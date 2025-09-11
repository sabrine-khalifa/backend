const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { register, login, refreshToken, updateUser, forgotPassword, resetPassword, getUserById } = require('../controllers/authController');
const verifyToken = require('../middlewares/auth'); // ✅ Import corrigé

// Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier de destination
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
  }
});

const upload = multer({ storage });

// Routes
router.post('/register', upload.single('photo'), register);
router.post('/login', login);
router.post('/refreshToken', refreshToken);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/:id', verifyToken, upload.single("photo"), updateUser);
router.get("/:id", getUserById);

module.exports = router;
