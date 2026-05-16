const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Datastore = require("nedb-promises");

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
        autoload: true,
        timestampData: true,
      });

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

module.exports = {
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
};
