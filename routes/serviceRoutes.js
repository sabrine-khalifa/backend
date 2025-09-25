
const express = require('express');
const router = express.Router();
const multer = require("multer");
const Avis = require("../models/Avis");
const Service = require("../models/Service"); // ✅ Ajoute cette ligne
const { storage } = require('../config/cloudinary'); // ✅ Importe Cloudinary


const upload = multer({ storage });


// Stockage en mémoire (ou tu peux utiliser diskStorage pour sauvegarder sur disque)
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middlewares/auth');
const getServiceById =require('../controllers/serviceController');
const { reserverService } = require("../controllers/serviceController");
const { getServicesDisponiblesByCreator } = require('../controllers/serviceController');




router.post('/', authMiddleware, upload.array("images"), serviceController.createService);
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.post("/:id/reserver", authMiddleware, reserverService);
router.get('/creator/:creatorId/disponibles', getServicesDisponiblesByCreator);


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


router.get("/:id/avis", async (req, res) => {
  try {
    const avis = await Avis.find({ service: req.params.id }).populate("auteur", "name prenom photo");
    res.json(avis);
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors du chargement des avis" });
  }
});

router.post("/:id/avis", authMiddleware, async (req, res) => {
  try {
    const { commentaire } = req.body;

    if (!commentaire) return res.status(400).json({ msg: "Le commentaire est requis" });

    const newAvis = new Avis({
      service: req.params.id,
      auteur: req.user.id, // ID de l'utilisateur connecté
      commentaire,
    });

    await newAvis.save();

    // Optionnel : populate pour renvoyer les infos de l'auteur
    await newAvis.populate("auteur", "name prenom photo");

    res.json(newAvis);
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de l'ajout de l'avis" });
  }
});

// ✅ Route : tous les services d'un utilisateur (le créateur)
router.get("/serv/user/:userId", async (req, res) => {
  try {
    const services = await Service.find({ createur: req.params.userId });
    res.json(services);
  } catch (err) {
    console.error("Erreur /services/user/:userId :", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

router.put('/:id', authMiddleware, upload.array('image'), serviceController.updateService);

module.exports = router;