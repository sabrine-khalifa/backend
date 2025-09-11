// controllers/avisController.js
const Avis = require("../models/Avis");
const Service = require("../models/Service");


// controllers/avisController.js
exports.createAvis = async (req, res) => {
  try {
    const { serviceId, commentaire, note } = req.body;
    const userId = req.userId;

    if (!serviceId || !commentaire) {
      return res.status(400).json({ msg: "Service et commentaire requis" });
    }

    const newAvis = new Avis({
      service: serviceId,
      auteur: userId,
      commentaire,
      note: note || null // ✅ Sauvegarde la note
    });

    await newAvis.save();

    // ✅ Populate pour inclure les infos de l’auteur
    await newAvis.populate("auteur", "name prenom photo");

    // ✅ Envoie l’avis COMPLET, avec `note`
    res.status(201).json({ 
      msg: "Avis ajouté avec succès", 
      avis: newAvis // ✅ ou juste `newAvis` si tu n'utilises pas d'objet enveloppe
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// Récupérer les avis d’un service
exports.getAvisByService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const avis = await Avis.find({ service: serviceId })
      .populate("auteur", " titre categories name prenom photo ") // pour afficher qui a laissé l’avis
      .sort({ createdAt: -1 });

    res.json(avis);
  } catch (error) {
    console.error("Erreur getAvisByService:", error);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};


// Récupérer tous les avis liés aux services d’un utilisateur
// Récupérer les avis écrits par un utilisateur

exports.getAvisByUser = async (req, res) => {
  try {
    const avis = await Avis.find({ auteur: req.params.userId })
      .populate("service", "titre")
      .populate("auteur", "name prenom photo")
      .sort({ createdAt: -1 });

    res.json(avis);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
