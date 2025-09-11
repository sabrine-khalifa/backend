// routes/avis.js
const express = require("express");
const router = express.Router();
const Avis = require("../models/Avis");
const Reservation = require("../models/Reservation");
const auth = require("../middlewares/auth");

// GET : Récupérer tous les avis d’un service

// ⚠️ placer en premier
router.get("/user/:userId", async (req, res) => {
  try {
    const avis = await Avis.find()
      .populate("auteur")
      .populate("service");

    const filteredAvis = avis.filter(a => 
      a.service?.createur?.toString() === req.params.userId
    );

    res.json(filteredAvis);
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
});



router.get("/service/:id", async (req, res) => {
  try {
    const avis = await Avis.find({ service: req.params.id })
      .populate("auteur", "name prenom photo")
      .sort({ createdAt: -1 });
    res.json(avis);
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors du chargement des avis" });
  }
});

// POST : Ajouter un avis (si l’utilisateur a réservé le service)
// routes/avis.js
router.post("/service/:id", auth, async (req, res) => {
  try {
    const { commentaire, note } = req.body; // ✅ Ajoute `note`

    if (!commentaire) {
      return res.status(400).json({ msg: "Le commentaire est requis" });
    }

    // Optionnel : validation de la note
    if (note !== undefined && (note < 1 || note > 5)) {
      return res.status(400).json({ msg: "La note doit être entre 1 et 5" });
    }

    // Vérifier que l’utilisateur a réservé le service
    const reservation = await Reservation.findOne({ 
      service: req.params.id, 
      utilisateur: req.userId 
    });

    if (!reservation) {
      return res.status(403).json({ msg: "Vous devez réserver ce service avant de poster un avis" });
    }

    // ✅ Créer l’avis avec `note`
    const newAvis = new Avis({
      service: req.params.id,
      auteur: req.userId,
      commentaire,
      note: note || null // ✅ Sauvegarde la note
    });

    await newAvis.save();
    await newAvis.populate("auteur", "name prenom photo");

    res.json(newAvis); // ✅ Renvoie l’avis complet (avec `note`)
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de l'ajout de l'avis" });
  }
});

module.exports = router;
