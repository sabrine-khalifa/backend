// routes/messagesRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const authMiddleware = require("../middlewares/auth");
const Message = require("../models/Message");

// ✅ Route : tous les messages (pour la liste)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .populate("sender", "name prenom photo")
    .populate("receiver", "name prenom photo")
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Erreur /messages:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Route : messages avec un utilisateur spécifique
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const otherId = new mongoose.Types.ObjectId(req.params.userId);

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId }
      ]
    })
    .populate("sender", "name prenom photo")
    .populate("receiver", "name prenom photo")
    .sort({ createdAt: 1 });

    // Marquer comme lu
    await Message.updateMany(
      { sender: otherId, receiver: userId, lu: false },
      { lu: true }
    );

    res.json(messages);
  } catch (err) {
    console.error("Erreur /messages/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Envoyer un message
router.post("/", authMiddleware, require("../controllers/messageController").sendMessage);

module.exports = router;