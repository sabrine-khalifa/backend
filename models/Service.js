const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  titre: { type: String, required: true, minlength: 3 },
  description: { type: String, required: true, minlength: 10 },
  categories: [ {type: String} ],
  typePrestation: { type: String, enum: ['Présentiel', 'En ligne', 'Distanciel & Présentiel'], required: true },
  images:  [{ type: String }],
  lieu: { type: String },
  dateService: [{ type: Date }],
  heure: { type: String }, 
  duree: { type: String }, 

  dateAConvenir: {
    type: Boolean,
    default: false,
  },
  typeCours: { type: String, enum: ['Individuel', 'Collectif', 'Individuelle & Collective '] },
  publicCible: { type: String },
  prerequis: { type: String, default: "Aucun prérequis" },
  materiel: { type: String, default: "Aucun matériel requis" },
  accessiblePMR: { type: Boolean, default: false },

  creditsProposes: { type: Number, required: true, min: 1 },
  nombrePlaces: { type: Number },
  createur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
