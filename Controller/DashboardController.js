const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/AuthMiddleware");
const {getDashboardData} = require("../API/Dashboard");


router.get("/dashboard", authMiddleware, getDashboardData);

module.exports = router;
