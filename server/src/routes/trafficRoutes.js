const express = require("express");
const { trackVisit } = require("../controllers/trafficController");

const router = express.Router();

router.post("/track", trackVisit);

module.exports = router;
