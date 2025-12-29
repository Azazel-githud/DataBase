const express = require("express");
const homeController = require("../controllers/homeController.js");

const homeRouter = express.Router();
console.log('✅ homeRouter подключён');

homeRouter.get("/about", homeController.about);
homeRouter.get("/", homeController.index);

module.exports = homeRouter;