// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const multer = require("multer");

// config multer
const upload = multer({ storage: multer.memoryStorage() });

// D’abord les routes fixes
router.post("/register", upload.single("photo"), authController.register);
router.post("/login", authController.login);
router.post("/refreshToken", authController.refreshToken);

// Ensuite seulement les dynamiques
router.get("/:id", authController.getUserById);

module.exports = router;
