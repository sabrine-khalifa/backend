// backend/controllers/circleAuth.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Route : /api/circle/login
exports.loginWithCircle = async (req, res) => {
  const { token } = req.query; // reçu depuis Circle

  try {
    // Vérifie le JWT avec Circle
    const response = await axios.get('https://api.circle.so/v1/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const userData = response.data.member;

    // Crée un utilisateur local ou récupère l'existant
    let user = await User.findOne({ circleId: userData.id });
    if (!user) {
      user = await User.create({
        circleId: userData.id,
        name: userData.name,
        email: userData.email,
        photo: userData.photo,
        credits: 1000 // solde de départ
      });
    }

    // Génère un token local
    const localToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`http://localhost:3000/dashboard?token=${localToken}`);
  } catch (err) {
    res.status(401).json({ msg: "Échec d'authentification avec Circle" });
  }
};