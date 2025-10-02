const express = require('express');
const router = express.Router();
const { storage } = require('./config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

const Service = require('./models/Service'); // ou votre modèle

router.post('/services', upload.single('image'), async (req, res) => {
  try {
    const { titre, description, typePrestation, creditsProposes, dateService, heure, duree, lieu } = req.body;

    // L'image téléchargée est maintenant sur Cloudinary
    const imageUrl = req.file.path; // CloudinaryStorage stocke l'URL ici

    const newService = await Service.create({
      titre,
      description,
      typePrestation,
      creditsProposes,
      dateService,
      heure,
      duree,
      lieu,
      images: [imageUrl],
      createur: req.user.id,
    });

    res.status(201).json({ message: 'Service créé avec succès.', service: newService });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
