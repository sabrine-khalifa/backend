// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  prenom: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  photo: { type: String }, // URL de la photo
  credits: { type: Number, default: 100 },
  token: { type: String }, // pour Circle
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  // --- Nouveaux champs ---
  role: { 
    type: String, 
    enum: ['particulier', 'createur'], 
    default: 'particulier' 
  },

  // Champs spécifiques au Créateur
  metier: { type: String },
  domaine: { type: String },
  langues: [{ type: String }], // tableau
  nationalites: { type: String },
  video: { type: String },
  description: { type: String },
  valeurs: { type: String },
  lieuPrestation: { type: String, enum: ['', 'distanciel', 'presentiel', 'hybride'] },
  pmr: { type: Boolean, default: false },
  typeCours: { type: String, enum: ['', 'individuel', 'collectif'] },
  publicCible: { type: String },
  liens: { type: String },

  // Type de créateur (badge)
  typeCreateur: { 
    type: String, 
    enum: ['graine', 'herbe', 'etabli'], 
    default: 'herbe' 
  }
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);