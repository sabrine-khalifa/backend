// routes/reservation.js
const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation'); // ✅ le bon modèle

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
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reservations = await Reservation.find({ utilisateur: userId })
      .populate("service")   // pour avoir les infos du service réservé
      .populate("utilisateur", "nom email"); // infos utilisateur si besoin

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});


module.exports = router;
