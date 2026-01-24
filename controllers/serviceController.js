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
   console.log("BODY :", req.body);
  console.log("FILES :", req.files);
  try {
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
      pmrDetails,
      lieu,
      nombrePlaces,
    } = req.body;

    const createur = req.userId;

    // 🔥 NORMALISATION DATE SERVICE (FormData fix)
const rawDateService = req.body.dateService;

const normalizedDateService = Array.isArray(rawDateService)
  ? rawDateService.filter(Boolean)
  : rawDateService
    ? [rawDateService]
    : [];


    // ✅ date à convenir
   const dateAConvenir = String(req.body.dateAConvenir) === "true";


    // --- VALIDATIONS ---
    if (!titre || titre.length < 3) {
      return res.status(400).json({ erreur: "Titre invalide." });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({ erreur: "Description invalide." });
    }

    if (!creditsProposes || Number(creditsProposes) < 1) {
      return res.status(400).json({ erreur: "Crédits invalides." });
    }

    // ✅ Date obligatoire UNIQUEMENT si pas "à convenir"
  if (!dateAConvenir && normalizedDateService.length === 0) {
  return res.status(400).json({ erreur: "Date manquante." });
}


    // --- NORMALISATION ---
    const categoriesArray = Array.isArray(categories)
      ? categories
      : [categories].filter(Boolean);

    const normalizedPrerequis = Array.isArray(prerequis)
      ? prerequis[0]
      : prerequis;

    const normalizedMateriel = Array.isArray(materiel)
      ? materiel[0]
      : materiel;

    const normalizedAccessiblePMR =
      accessiblePMR === true || accessiblePMR === "true";

    // 🔹 Images
    const images = req.cloudinaryUrls || [];
    const normalizedPmrDetails = Array.isArray(pmrDetails)
  ? pmrDetails[0]
  : pmrDetails;


    // --- CRÉATION ---
   const newService = new Service({
  titre,
  description,
  categories: categoriesArray,
  typePrestation,
  creditsProposes,
  images,
  dateService: dateAConvenir ? [] : normalizedDateService,
  heure: dateAConvenir ? "" : heure,
  duree,
  typeCours,
  publicCible,
  prerequis: normalizedPrerequis,
  materiel: normalizedMateriel,
  accessiblePMR: normalizedAccessiblePMR,
  pmrDetails: normalizedPmrDetails,
  lieu,
  nombrePlaces,
  dateAConvenir,
  createur,
});


    await newService.save();

    res.status(201).json({
      message: "Service créé avec succès.",
      service: newService,
    });
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
    if (!service) {
      return res.status(404).json({ msg: "Service introuvable" });
    }

    // 🔒 1️⃣ VÉRIFIER SI DÉJÀ RÉSERVÉ
    const dejaReserve = await Reservation.findOne({
      service: serviceId,
      utilisateur: userId,
    });

    if (dejaReserve) {
      return res.status(400).json({
        msg: "Vous avez déjà réservé ce service",
      });
    }

    // 🔒 2️⃣ Vérifier les places
    if (service.nombrePlaces <= 0) {
      return res.status(400).json({ msg: "Plus de places disponibles" });
    }

    const acheteur = await User.findById(userId);
    const createur = await User.findById(service.createur);

    // 🔒 3️⃣ Vérifier crédits
    if (acheteur.credits < service.creditsProposes) {
      return res.status(400).json({ msg: "Crédits insuffisants" });
    }

    // 🔄 4️⃣ Mise à jour crédits et places
    acheteur.credits -= service.creditsProposes;
    createur.credits += service.creditsProposes;
    service.nombrePlaces -= 1;

    await acheteur.save();
    await createur.save();
    await service.save();

    // ✅ 5️⃣ Créer la réservation
    const reservation = new Reservation({
      service: serviceId,
      utilisateur: userId,
    });
    await reservation.save();

  // 🔁 Recharger le service avec le créateur
const populatedService = await Service.findById(serviceId).populate(
  "createur",
  "prenom name photo"
);
const updatedAcheteur = await User.findById(userId).select(
  "name prenom email credits photo role"
);

res.json({
  msg: "Réservation confirmée",
  service: populatedService,
    user: updatedAcheteur,
});

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


// 🔹 Mise à jour d'un service
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
      dateAConvenir,
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
      prix = service.creditsProposes;
    }

    // Gérer les catégories
    let categoriesArray = categories;
    if (categories && !Array.isArray(categories)) {
      categoriesArray = [categories].filter(Boolean);
    }

    // Gérer les images — seulement si de nouvelles sont uploadées
    let images = service.images;
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path);
    }

    // --- MISE À JOUR DES CHAMPS ---
    service.titre = titre || service.titre;
    service.description = description || service.description;
    service.categories = categoriesArray || service.categories;
    service.typePrestation = typePrestation || service.typePrestation;
    service.creditsProposes = prix;
    service.images = images;

    

// ---------- DATE À CONVENIR ----------
if (dateAConvenir !== undefined) {
  service.dateAConvenir =
    dateAConvenir === true || dateAConvenir === "true";
}

// ---------- SI DATE À CONVENIR ----------
if (service.dateAConvenir === true) {
  service.dateService = [];
  service.heure = "";
} else {
  // ---------- DATES CLASSIQUES ----------
  if (dateService !== undefined) {
    const rawDates = Array.isArray(dateService)
      ? dateService
      : [dateService];

    service.dateService = rawDates
      .map((d) => {
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date;
      })
      .filter(Boolean);
  }

  // ---------- HEURE ----------
  if (heure !== undefined) {
    service.heure = heure;
  }
}

    service.duree = duree || service.duree;

    if (typeCours !== undefined && typeCours !== "") {
      service.typeCours = typeCours;
    }

    if (publicCible !== undefined && publicCible !== null) {
      service.publicCible = publicCible;
    }

   // 🔧 NORMALISATION DES CHAMPS PROBLÉMATIQUES

// prerequis
if (Array.isArray(prerequis)) {
  service.prerequis = prerequis[0];
} else if (prerequis !== undefined) {
  service.prerequis = prerequis;
}

// materiel
if (Array.isArray(materiel)) {
  service.materiel = materiel[0];
} else if (materiel !== undefined) {
  service.materiel = materiel;
}

// accessiblePMR
if (Array.isArray(accessiblePMR)) {
  service.accessiblePMR = accessiblePMR[0] === "true";
} else if (accessiblePMR !== undefined) {
  service.accessiblePMR =
    accessiblePMR === true || accessiblePMR === "true";
}

// 🧹 Nettoyage PMR
if (service.accessiblePMR === false) {
  service.pmrDetails = "";
}

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
