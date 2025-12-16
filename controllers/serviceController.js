const mongoose = require("mongoose"); // <-- AJOUT ICI
const User = require("../models/user"); // chemin selon ton projet
const Reservation = require("../models/Reservation");

const Service = require("../models/Service"); // 🔹 Import du modèle Service

// Récupérer tous les services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().populate(
      "createur",
      "name prenom photo"
    ); // optionnel : infos créateur
    res.status(200).json(services);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ erreur: "Erreur serveur lors du chargement des services." });
  }
};

// Créer un nouveau service
exports.createService = async (req, res) => {
  try {
    console.log("🎯 Début createService");
    console.log("BODY:", req.body);
    console.log("CLOUDINARY URLs:", req.cloudinaryUrls); // ✅ Clé du succès
    const {
      titre,
      description,
      categories,
      typePrestation,
      creditsProposes,
      dateService,
      heure,
      duree,
      typeCours,
      publicCible,
      prerequis, // ✅ AJOUT
      materiel, // ✅ AJOUT
      accessiblePMR,
      lieu,
      nombrePlaces,
    } = req.body;

    const createur = req.userId;

    // --- VALIDATIONS ---
    if (!titre || titre.length < 3) {
      return res.status(400).json({ erreur: "Titre invalide." });
    }
    if (!description || description.length < 10) {
      return res.status(400).json({ erreur: "Description invalide." });
    }
    if (
      creditsProposes === undefined ||
      creditsProposes === null ||
      Number(creditsProposes) < 1
    ) {
      return res.status(400).json({ erreur: "Crédits invalides." });
    }

    // Remplace l'ancienne validation
    if (!req.body.dateAConvenir) {
      if (!dateService || dateService.length === 0) {
       // return res.status(400).json({ erreur: "Date manquante." });
      }
    }
    // Le lieu peut être facultatif si distanciel ou date à convenir
    // (à adapter selon ta logique)
   

    if (!createur || createur === "null") {
      return res
        .status(401)
        .json({ erreur: "Utilisateur non authentifié (createur manquant)." });
    }

    // 🔹 Récupération des images envoyées (si multiples)
    const images = req.cloudinaryUrls || [];
    console.log("FILES:", req.files);
    // --- CRÉATION ---
    const categoriesArray = Array.isArray(req.body.categories)
      ? req.body.categories
      : [req.body.categories].filter(Boolean); // pour éviter undefined

    const newService = new Service({
      titre,
      description,
      categories: categoriesArray,
      typePrestation,
      creditsProposes,
      images,
      dateService,
      heure,
      duree,
      typeCours,
      publicCible,
      prerequis, // ✅
      materiel,
      accessiblePMR,
      lieu,
      nombrePlaces,
      createur,
    });

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

await newService.validate();

    console.log("✅ Validation OK");

    const saved = await newService.save();
    res
      .status(201)
      .json({ message: "Service créé avec succès.", service: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: "Erreur serveur." });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      "createur",
      "prenom name photo"
    );
    if (!service) return res.status(404).json({ erreur: "Service non trouvé" });
    res.status(200).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
};

// Réservation d’un service
exports.reserverService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.userId;

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ msg: "Service introuvable" });

    if (service.nombrePlaces <= 0) {
      return res.status(400).json({ msg: "Plus de places disponibles" });
    }

    const acheteur = await User.findById(userId);
    const createur = await User.findById(service.createur);

    if (acheteur.credits < service.creditsProposes) {
      return res.status(400).json({ msg: "Crédits insuffisants" });
    }

    acheteur.credits -= service.creditsProposes;
    createur.credits += service.creditsProposes;
    service.nombrePlaces -= 1;

    await acheteur.save();
    await createur.save();
    await service.save();

    // Créer la réservation
    const reservation = new Reservation({
      service: serviceId,
      utilisateur: userId,
    });
    await reservation.save();

    res.json({ msg: "Réservation confirmée", service });
  } catch (err) {
    console.error("❌ Erreur réservation :", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

exports.getServicesDisponiblesByCreator = async (req, res) => {
  try {
    const creatorId = req.params.creatorId; // récupéré depuis l'URL

    const services = await Service.find({ createur: creatorId });

    const servicesDisponibles = [];

    for (const service of services) {
      const nbReservees = await Reservation.countDocuments({
        service: service._id,
      });
      if (service.nombrePlaces - nbReservees > 0) {
        servicesDisponibles.push({
          ...service.toObject(),
          placesRestantes: service.nombrePlaces - nbReservees,
        });
      }
    }

    res.json(servicesDisponibles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// 🔹 Mise à jour d’un service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("dateService reçue :", req.body.dateService);
    console.log("Tout le body reçu :", req.body);
    // Vérifier si l'utilisateur est authentifié
    if (!userId) {
      return res.status(401).json({ erreur: "Utilisateur non authentifié." });
    }

    // Trouver le service
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ erreur: "Service non trouvé." });
    }

    if (req.body.dateService !== undefined) {
  const rawDates = Array.isArray(req.body.dateService)
    ? req.body.dateService
    : [req.body.dateService];

  const parsedDates = rawDates
    .map(d => {
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter(Boolean);

  service.dateService = parsedDates;
}

    // Vérifier que l'utilisateur est bien le créateur
    if (service.createur.toString() !== userId.toString()) {
      return res.status(403).json({
        erreur: "Accès refusé. Vous n'êtes pas le propriétaire de ce service.",
      });
    }

    // Récupérer les champs à mettre à jour
    const {
      titre,
      description,
      categories,
      typePrestation,
      creditsProposes,
      dateService,
      heure,
      duree,
      typeCours,
      publicCible,
      prerequis,
      materiel,
      accessiblePMR,
      lieu,
      nombrePlaces,
    } = req.body;

    // --- VALIDATIONS ---
    if (titre && titre.length < 3) {
      return res.status(400).json({ erreur: "Titre invalide." });
    }
    if (description && description.length < 10) {
      return res.status(400).json({ erreur: "Description invalide." });
    }
    // Validation crédits
    // --- VALIDATION ET TRAITEMENT DU PRIX ---
    let prix;

    if (
      creditsProposes !== undefined &&
      creditsProposes !== null &&
      creditsProposes !== ""
    ) {
      prix = Number(creditsProposes);

      if (isNaN(prix) || prix < 1) {
        return res.status(400).json({ erreur: "Crédits invalides." });
      }
    } else {
      // si pas envoyé → garder le prix existant
      prix = service.creditsProposes;
    }

    // Gérer les catégories
    let categoriesArray = categories;
    if (categories && !Array.isArray(categories)) {
      categoriesArray = [categories].filter(Boolean);
    }

    // Gérer les images — seulement si de nouvelles sont uploadées
    let images = service.images; // par défaut, on garde les anciennes
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path); // ✅ Utilise file.path
    }

    // Mettre à jour le service
    service.titre = titre || service.titre;
    service.description = description || service.description;
    service.categories = categoriesArray || service.categories;
    service.typePrestation = typePrestation || service.typePrestation;
    service.creditsProposes = prix;
    service.images = images;
    // 🔹 DATE
    // 🔹 DATE
    
    // 🔹 DATE
let parsedDates = []; // déclaration unique

if (req.body.dateService !== undefined) {
  const rawDates = Array.isArray(req.body.dateService)
    ? req.body.dateService
    : [req.body.dateService];

  parsedDates = rawDates
    .map(d => {
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter(Boolean);
}

// Assignation au service
service.dateService = parsedDates;

  





    
    service.heure = heure || service.heure;
    service.duree = duree || service.duree;

    const validTypesCours = ["Individuel", "Collectif", "Groupe"];

    if (typeCours !== undefined && typeCours !== "") {
  service.typeCours = typeCours;
}

    // publicCible normal, juste assigner s'il existe
    if (publicCible !== undefined && publicCible !== null) {
      service.publicCible = publicCible;
    }

    service.prerequis = prerequis !== undefined ? prerequis : service.prerequis;
    service.materiel = materiel !== undefined ? materiel : service.materiel;

    service.accessiblePMR =
      accessiblePMR !== undefined ? accessiblePMR : service.accessiblePMR;
    service.lieu = lieu || service.lieu;

    if (nombrePlaces !== undefined) {
      service.nombrePlaces = Number(nombrePlaces);
    }

    console.log("Service avant save :", service.toObject());

    const updatedService = await service.save();

    console.log("✅ Service mis à jour :", updatedService);

    res.status(200).json({
      message: "Service mis à jour avec succès.",
      service: updatedService,
    });
  } catch (err) {
    console.error("❌ Erreur mise à jour service :", err);
    console.error("DETAILS:", err.message, err.errors);

    res.status(500).json({
      erreur: "Erreur serveur lors de la mise à jour.",
      details: err.message,
    });
  }
};
