
const express = require('express');
const router = express.Router();
const multer = require("multer");
const Avis = require("../models/Avis");
const Service = require("../models/Service"); // ✅ Ajoute cette ligne
const cloudinary = require('cloudinary').v2; // <-- Cette ligne manque !


const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middlewares/auth');
const getServiceById =require('../controllers/serviceController');
const { reserverService } = require("../controllers/serviceController");
const { getServicesDisponiblesByCreator } = require('../controllers/serviceController');

console.log("🚀 Chargement de serviceRoutes");

require('dotenv').config();

// ✅ Vérification des clés
console.log("☁️ CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("🔑 CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "OK" : "❌ MANQUANTE");
console.log("🔐 CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "OK (masquée)" : "❌ MANQUANTE");


// ✅ Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("☁️ Cloudinary configuré :", process.env.CLOUDINARY_CLOUD_NAME);

// ✅ Stockage en mémoire (pas sur disque)
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Middleware pour uploader vers Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'openup/images',
            resource_type: 'image',
            format: file.mimetype.split('/')[1],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url); // URL complète HTTPS
          }
        );
        stream.end(file.buffer);
      });
    });

    req.cloudinaryUrls = await Promise.all(uploadPromises);
    console.log("✅ Images uploadées sur Cloudinary:", req.cloudinaryUrls);
    next();
  } catch (err) {
    console.error("❌ Échec upload Cloudinary:", err);
    return res.status(500).json({ erreur: "Échec de l'upload de l'image" });
  }
};


router.post(
  "/",
  authMiddleware,
  upload.array("image", 5),       // 1. Reçoit les fichiers en mémoire
  uploadToCloudinary,             // 2. Upload vers Cloudinary
  serviceController.createService // 3. Sauvegarde avec URLs
);



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