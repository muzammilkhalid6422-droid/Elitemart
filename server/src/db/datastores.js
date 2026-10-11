const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Datastore = require("nedb-promises");
const nedbStorage = require("@seald-io/nedb/lib/storage.js");

const isRetryableFsError = (error) =>
  ["EPERM", "EACCES", "EEXIST", "EBUSY", "UNKNOWN", "EAGAIN"].includes(error?.code);

const originalCrashSafeWrite = nedbStorage.crashSafeWriteFileLinesAsync;
nedbStorage.crashSafeWriteFileLinesAsync = async (filename, lines, modes) => {
  try {
    await originalCrashSafeWrite(filename, lines, modes);
  } catch (error) {
    if (!isRetryableFsError(error)) throw error;

    const tempFilename = `${filename}~`;
    const destExists = fs.existsSync(filename);
    const tempExists = fs.existsSync(tempFilename);

    if (tempExists && destExists) {
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
          await fs.promises.copyFile(tempFilename, filename);
          break;
        } catch (copyError) {
          if (attempt === 4) {
            // Keep the existing db file rather than crashing the whole server.
            console.warn(
              `[DB] Could not replace ${path.basename(filename)} from temp file:`,
              copyError.message
            );
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
        }
      }
    } else if (tempExists && !destExists) {
      await fs.promises.copyFile(tempFilename, filename);
    } else if (!tempExists) {
      throw error;
    }

    await fs.promises.unlink(tempFilename).catch(() => {});
  }
};

const dataDir = path.join(__dirname, "..", "data");
const mongoUri = String(process.env.MONGODB_URI || "").trim();
const mongoDbName = process.env.MONGODB_DB_NAME || "ecommerce";
const shouldUseMongo =
  mongoUri &&
  !mongoUri.includes("USERNAME") &&
  !mongoUri.includes("PASSWORD") &&
  !mongoUri.includes("CLUSTER.mongodb.net");

let mongoClientPromise;

const getMongoDb = async () => {
  if (!shouldUseMongo) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!mongoClientPromise) {
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(mongoUri);
    mongoClientPromise = client.connect();
  }

  const client = await mongoClientPromise;
  return client.db(mongoDbName);
};

const clone = (value) => JSON.parse(JSON.stringify(value));

class MongoQuery {
  constructor(collectionName, query = {}) {
    this.collectionName = collectionName;
    this.query = query;
    this.sortSpec = null;
  }

  sort(sortSpec) {
    this.sortSpec = sortSpec;
    return this;
  }

  async exec() {
    const db = await getMongoDb();
    const cursor = db.collection(this.collectionName).find(this.query);
    if (this.sortSpec) cursor.sort(this.sortSpec);
    return cursor.toArray();
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }

  finally(callback) {
    return this.exec().finally(callback);
  }
}

class MongoStore {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async collection() {
    const db = await getMongoDb();
    return db.collection(this.collectionName);
  }

  find(query = {}) {
    return new MongoQuery(this.collectionName, query);
  }

  async findOne(query = {}) {
    const collection = await this.collection();
    return collection.findOne(query);
  }

  async insert(document) {
    const collection = await this.collection();
    const now = new Date().toISOString();
    const nextDocument = {
      ...clone(document),
      _id: document._id || crypto.randomUUID(),
      createdAt: document.createdAt || now,
      updatedAt: document.updatedAt || now,
    };

    await collection.insertOne(nextDocument);
    return nextDocument;
  }

  async update(query, update, options = {}) {
    const collection = await this.collection();
    const now = new Date().toISOString();
    const nextUpdate = {
      ...clone(update),
      $set: {
        ...(update.$set || {}),
        updatedAt: now,
      },
    };

    if (options.upsert) {
      nextUpdate.$setOnInsert = {
        ...(update.$setOnInsert || {}),
        createdAt: now,
      };
    }

    const mongoOptions = { upsert: Boolean(options.upsert) };
    const result = options.multi
      ? await collection.updateMany(query, nextUpdate, mongoOptions)
      : await collection.updateOne(query, nextUpdate, mongoOptions);

    return result.modifiedCount + result.upsertedCount;
  }

  async remove(query, options = {}) {
    const collection = await this.collection();
    const result = options.multi
      ? await collection.deleteMany(query)
      : await collection.deleteOne(query);
    return result.deletedCount;
  }

  ensureIndex({ fieldName, unique = false }) {
    return this.collection()
      .then((collection) => collection.createIndex({ [fieldName]: 1 }, { unique }))
      .catch((error) => {
        console.error(
          `Failed to create ${this.collectionName}.${fieldName} index:`,
          error.message
        );
      });
  }
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const createStore = (filename) =>
  shouldUseMongo
    ? new MongoStore(path.basename(filename, ".db"))
    : Datastore.create({
        filename: path.join(dataDir, filename),
        autoload: false,
        timestampData: true,
      });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clearStaleTempFiles = () => {
  if (!fs.existsSync(dataDir)) return;

  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith(".db~")) continue;
    const tempPath = path.join(dataDir, file);
    try {
      fs.unlinkSync(tempPath);
    } catch (error) {
      console.warn(`[DB] Could not remove stale ${file}:`, error.message);
      setTimeout(() => {
        fs.unlink(tempPath, () => {});
      }, 500);
    }
  }
};

const loadStoreWithRetry = async (name, store, retries = 6) => {
  if (shouldUseMongo || typeof store.load !== "function") return;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await store.load();
      return;
    } catch (error) {
      const retryable = isRetryableFsError(error);
      if (retryable && attempt < retries) {
        console.warn(`[DB] ${name} locked (${error.code}), retry ${attempt}/${retries - 1}...`);
        await sleep(400 * attempt);
        continue;
      }
      throw error;
    }
  }
};

const usersStore = createStore("users.db");
const sellersStore = createStore("sellers.db");
const adminsStore = createStore("admins.db");
const productsStore = createStore("products.db");
const cartsStore = createStore("carts.db");
const ordersStore = createStore("orders.db");
const paymentRequestsStore = createStore("paymentRequests.db");
const reviewsStore = createStore("reviews.db");
const favoritesStore = createStore("favorites.db");
const trafficStore = createStore("traffic.db");
const settingsStore = createStore("settings.db");
const registrationOtpsStore = createStore("registrationOtps.db");
const passwordResetOtpsStore = createStore("passwordResetOtps.db");

const nedbStores = [
  ["users.db", usersStore],
  ["sellers.db", sellersStore],
  ["admins.db", adminsStore],
  ["products.db", productsStore],
  ["carts.db", cartsStore],
  ["orders.db", ordersStore],
  ["paymentRequests.db", paymentRequestsStore],
  ["reviews.db", reviewsStore],
  ["favorites.db", favoritesStore],
  ["traffic.db", trafficStore],
  ["settings.db", settingsStore],
  ["registrationOtps.db", registrationOtpsStore],
  ["passwordResetOtps.db", passwordResetOtpsStore],
];

const ready = (async () => {
  if (shouldUseMongo) return;
  clearStaleTempFiles();
  for (const [name, store] of nedbStores) {
    await loadStoreWithRetry(name, store);
  }

  usersStore.ensureIndex({ fieldName: "email", unique: true });
  sellersStore.ensureIndex({ fieldName: "email", unique: true });
  adminsStore.ensureIndex({ fieldName: "email", unique: true });
  productsStore.ensureIndex({ fieldName: "sellerId" });
  cartsStore.ensureIndex({ fieldName: "userId", unique: true });
  ordersStore.ensureIndex({ fieldName: "userId" });
  paymentRequestsStore.ensureIndex({ fieldName: "sellerId" });
  paymentRequestsStore.ensureIndex({ fieldName: "status" });
  reviewsStore.ensureIndex({ fieldName: "productId" });
  reviewsStore.ensureIndex({ fieldName: "userId" });
  favoritesStore.ensureIndex({ fieldName: "userId" });
  trafficStore.ensureIndex({ fieldName: "visitorId" });
  trafficStore.ensureIndex({ fieldName: "path" });
  trafficStore.ensureIndex({ fieldName: "createdAt" });
  settingsStore.ensureIndex({ fieldName: "key", unique: true });
  registrationOtpsStore.ensureIndex({ fieldName: "email", unique: true });
  passwordResetOtpsStore.ensureIndex({ fieldName: "email", unique: true });
})();

module.exports = {
  ready,
  usersStore,
  sellersStore,
  adminsStore,
  productsStore,
  cartsStore,
  ordersStore,
  paymentRequestsStore,
  reviewsStore,
  favoritesStore,
  trafficStore,
  settingsStore,
  registrationOtpsStore,
  passwordResetOtpsStore,
};
