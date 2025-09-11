// models/Avis.js
const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  auteur: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  commentaire: { type: String, required: true },
    note: { type: Number, min: 1, max: 5 }, // ✅ Pas de required, mais bien présent


}, { timestamps: true });

module.exports = mongoose.model("Avis", avisSchema);
