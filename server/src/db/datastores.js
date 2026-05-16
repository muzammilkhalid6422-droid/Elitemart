const fs = require("fs");
const path = require("path");
const Datastore = require("nedb-promises");

const dataDir = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const createStore = (filename) =>
  Datastore.create({
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
