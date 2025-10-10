// routes/auth.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

// ✅ Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// ✅ Stockage en mémoire
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Middleware pour uploader la photo vers Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next(); // Si pas de photo, on continue

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'openup/avatars',
          resource_type: 'image',
          format: req.file.mimetype.split('/')[1],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    req.cloudinaryUrl = result;
    console.log("✅ Photo uploadée sur Cloudinary:", result);
    next();
  } catch (err) {
    console.error("❌ Échec upload photo:", err);
    return res.status(500).json({ erreur: "Échec de l'upload de la photo" });
  }
};

// ✅ Contrôleurs
const { 
  register, login, refreshToken, updateUser, 
  forgotPassword, resetPassword, getUserById 
} = require('../controllers/authController');

const verifyToken = require('../middlewares/auth');

// ✅ Routes
router.post('/register', upload.single('photo'), uploadToCloudinary, register);
router.post('/login', login);
router.post('/refreshToken', refreshToken);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/:id', verifyToken, upload.single('photo'), uploadToCloudinary, updateUser);
router.get("/:id", getUserById);

module.exports = router;