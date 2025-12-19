// routes/reservation.js
const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation'); // ✅ le bon modèle

const authMiddleware = require("../middlewares/auth");

// Route pour compter les réservations d'un service
router.get('/count/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const count = await Reservation.countDocuments({ service: serviceId });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// Récupérer toutes les réservations d’un utilisateur
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({
      utilisateur: req.params.userId
    })
      .populate({
        path: "service",
        select: "titre duree typePrestation creditsProposes dateService",
        populate: {
          path: "createur",
          select: "name prenom photo"
        }
      })
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (err) {
    console.error("❌ Erreur réservations :", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

module.exports = router;
