// controllers/messageController.js
const Message = require("../models/Message");
const User = require("../models/user");
const mongoose = require("mongoose");

// Envoyer un message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.userId; // récupéré depuis authMiddleware
    const { receiverId, content } = req.body;
 // 🔹 Ajoute les logs ici
  
    // Vérification des champs
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ msg: "Tous les champs sont requis" });
    }

    // Vérifier que l'expéditeur et le destinataire existent
    const senderExists = await User.findById(senderId);
    const receiverExists = await User.findById(receiverId);

    if (!senderExists || !receiverExists) {
      return res.status(400).json({ msg: "Expéditeur ou destinataire inexistant" });
    }

    // Création du message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    await message.save();

    res.status(201).json({ msg: "Message envoyé avec succès", message });
  } catch (error) {
    console.error("Erreur sendMessage:", error);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};


// Récupérer les messages entre l'utilisateur connecté et un autre utilisateur
exports.getMessages = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const otherId = new mongoose.Types.ObjectId(req.params.userId);

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId }
      ]
    })
    .populate("sender", "name prenom photo")   // ✅ Ajouté
    .populate("receiver", "name prenom photo") // ✅ Ajouté
    .sort({ createdAt: 1 });

    // Marquer comme lu
    await Message.updateMany(
      { sender: otherId, receiver: userId, lu: false },
      { lu: true }
    );

    res.json(messages);
  } catch (err) {
    console.error("Erreur getMessages:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
