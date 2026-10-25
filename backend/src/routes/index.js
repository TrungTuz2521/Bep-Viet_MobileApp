const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const recipeRoutes = require("./recipeRoutes");
const libraryRoutes = require("./libraryRoutes");
const chatbotRoutes = require("./chatbotRoutes");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/recipes", recipeRoutes);
router.use("/library", libraryRoutes);
router.use("/chatbot", chatbotRoutes);

module.exports = router;