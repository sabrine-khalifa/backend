const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user");

// ==========================
// REGISTER
// ==========================
// controllers/authController.js
// controllers/authController.js
// ==========================
// REGISTER
// ==========================
exports.register = async (req, res) => {
  const { name, prenom, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      prenom,
      email,
      password: hashedPassword,
      role: role || 'particulier',
      credits: 100,
      isEmailVerified: false
    });

    // 🔑 Token de vérification
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    newUser.emailVerificationToken = emailVerificationToken;
    newUser.emailVerificationExpires = Date.now() + 3600000; // 1h
    await newUser.save();

    // ✉️ ENVOI EMAIL (MANQUANT)
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"OpenUp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Confirmez votre adresse email",
      html: `
        <p>Bonjour ${prenom || name},</p>
        <p>Merci pour votre inscription sur <b>OpenUp</b>.</p>
        <p>Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Ce lien est valide pendant 1 heure.</p>
      `,
    });

    res.status(201).json({
      msg: "Inscription réussie ! Veuillez vérifier votre e-mail."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};


exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: "Lien de vérification invalide ou expiré." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ msg: "Votre e-mail a été confirmé ! Vous pouvez maintenant vous connecter." });
  } catch (err) {
    console.error("Erreur vérification e-mail :", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};
// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Utilisateur introuvable" });

    // 🔒 Vérification : e-mail confirmé ?
    if (!user.isEmailVerified) {
      return res.status(400).json({ msg: "Veuillez confirmer votre e-mail avant de vous connecter." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Identifiants invalides" });

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        prenom: user.prenom,
        email: user.email,
        photo: user.photo,
        credits: user.credits,
        role: user.role,
        metier: user.metier,
        domaine: user.domaine,
        langues: user.langues,
        nationalites: user.nationalites,
        video: user.video,
        description: user.description,
        valeurs: user.valeurs,
        lieuPrestation: user.lieuPrestation,
        pmr: user.pmr,
        typeCours: user.typeCours,
        publicCible: user.publicCible,
        liens: user.liens,
        typeCreateur: user.typeCreateur
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ erreur: 'Refresh token manquant' });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ erreur: 'Refresh token invalide ou expiré' });

    // Crée un nouveau access token
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ accessToken: newAccessToken });
  });
};


// ==========================
// UPDATE USER
// ==========================
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    // Mise à jour des champs
    const updatableFields = [
      'name', 'prenom', 'email', 'role', 'metier', 'domaine', 'nationalites',
      'video', 'description', 'valeurs', 'lieuPrestation', 'typeCours',
      'publicCible', 'liens'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // Gestion des booléens
    if (req.body.pmr !== undefined) user.pmr = req.body.pmr === 'true' || req.body.pmr === true;

    // Gestion des tableaux
    if (req.body.langues && Array.isArray(req.body.langues)) {
      user.langues = req.body.langues;
    } else if (typeof req.body.langues === 'string') {
      user.langues = req.body.langues.split(',');
    }

    // Mot de passe
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    // Photo
  // Photo
if (req.cloudinaryUrl) {
  user.photo = req.cloudinaryUrl;
}



    await user.save();

    const { password, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};

// ==========================
// MOT DE PASSE OUBLIÉ
// ==========================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "Utilisateur introuvable" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Réinitialisation du mot de passe",
      html: `<p>Bonjour,</p>
             <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
             <a href="${resetURL}">${resetURL}</a>`,
    });

    res.json({ msg: "Lien de réinitialisation envoyé à votre email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// ==========================
// RÉINITIALISATION DU MOT DE PASSE
// ==========================
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ msg: "Token invalide ou expiré" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ msg: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
};


// ==========================
// GET USER BY ID
// ==========================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur", error: err.message });
  }
};
