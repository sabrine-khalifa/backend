const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erreur: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];
  console.log("Token extrait:", token);

  // 🔹 Ligne à ajouter pour debug
  const decoded = jwt.decode(token);
  console.log("Token iat:", decoded.iat, "exp:", decoded.exp, "now:", Math.floor(Date.now() / 1000));

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = verified.id || verified.user?.id;
     if (!req.userId) {
      console.error("❌ ID utilisateur manquant dans le token");
      return res.status(401).json({ erreur: "Token invalide : ID utilisateur manquant" });
    }

    console.log("✅ req.userId défini :", req.userId);
    next();
  } catch (err) {
 console.error("❌ Erreur JWT :", err.message);
    return res.status(401).json({ 
      erreur: err.name === 'TokenExpiredError' ? 'Token expiré' : 'Token invalide' 
       });
        }
};
