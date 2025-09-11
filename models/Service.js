const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  titre: { type: String, required: true, minlength: 3 },
  description: { type: String, required: true, minlength: 10 },
  categories: [ {type: String} ],
  typePrestation: { type: String, enum: ['Présentiel', 'En ligne'], required: true },
  prix: { type: Number },
  images:  [{ type: String }],
  lieu: { type: String },
  dateService: { type: Date },
  heure: { type: String }, // format "HH:mm"
  duree: { type: String }, // ex: "1h30"
  typeCours: { type: String, enum: ['Individuel', 'Collectif', 'Groupe'] },
  publicCible: { type: String, enum: ['Débutants', 'Professionnels', 'Tous niveaux'] },
  accessiblePMR: { type: Boolean, default: false },

  creditsProposes: { type: Number, required: true, min: 1 },
  nombrePlaces: { type: Number },
  createur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
