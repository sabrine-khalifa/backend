// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUserById } = require('../controllers/authController');

router.get('/:id', getUserById);

module.exports = router;