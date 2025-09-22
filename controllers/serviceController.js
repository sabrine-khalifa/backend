const mongoose = require("mongoose"); // <-- AJOUT ICI
const User = require('../models/user'); // chemin selon ton projet
const Reservation = require("../models/Reservation");

const Service = require('../models/Service'); // 🔹 Import du modèle Service

// Récupérer tous les services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate('createur', 'name prenom photo'); // optionnel : infos créateur
    res.status(200).json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur lors du chargement des services.' });
  }
};

// Créer un nouveau service
exports.createService = async (req, res) => {
  try {
    const {
   titre, description, categories, typePrestation, creditsProposes,
      prix, dateService, heure, duree, typeCours, publicCible, accessiblePMR,
      lieu, nombrePlaces
    } = req.body;

    const createur = req.userId;

    // --- VALIDATIONS ---
    if (!titre || titre.length < 3) {
      return res.status(400).json({ erreur: 'Titre invalide.' });
    }
    if (!description || description.length < 10) {
      return res.status(400).json({ erreur: 'Description invalide.' });
    }
    if (!creditsProposes || creditsProposes < 1) {
      return res.status(400).json({ erreur: 'Crédits invalides.' });
    }
    if (typePrestation === 'Présentiel' && (!prix || prix <= 0)) {
      return res.status(400).json({ erreur: 'Prix requis pour une prestation présentielle.' });
    }
    if (!dateService || !lieu) {
      return res.status(400).json({ erreur: 'Date ou lieu manquant.' });
    }
    if (!createur || createur === "null") {
      return res.status(401).json({ erreur: "Utilisateur non authentifié (createur manquant)." });
    }

    // 🔹 Récupération des images envoyées (si multiples)
const images = req.files ? req.files.map(file => file.path) : [];
    // --- CRÉATION ---
    const categoriesArray  = Array.isArray(req.body.categories)
  ? req.body.categories
  : [req.body.categories].filter(Boolean); // pour éviter undefined

      const newService = new Service({
      titre,
      description,
      categories: categoriesArray,
      typePrestation,
      creditsProposes,
      prix: typePrestation === 'Présentiel' ? prix : undefined,
      images,
      dateService,
      heure,
      duree,
      typeCours,
      publicCible,
      accessiblePMR,
      lieu,
      nombrePlaces,
      createur,
    });

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const saved = await newService.save();
    res.status(201).json({ message: 'Service créé avec succès.', service: saved });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('createur', 'prenom name photo');
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
      const nbReservees = await Reservation.countDocuments({ service: service._id });
      if (service.nombrePlaces - nbReservees > 0) {
        servicesDisponibles.push({
          ...service.toObject(),
          placesRestantes: service.nombrePlaces - nbReservees
        });
      }
    }

    res.json(servicesDisponibles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
};



// 🔹 Mise à jour d’un service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

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
      return res.status(403).json({ erreur: "Accès refusé. Vous n'êtes pas le propriétaire de ce service." });
    }

    // Récupérer les champs à mettre à jour
    const {
      titre,
      description,
      categories,
      typePrestation,
      creditsProposes,
      prix,
      dateService,
      heure,
      duree,
      typeCours,
      publicCible,
      accessiblePMR,
      lieu,
      nombrePlaces,
    } = req.body;

    // --- VALIDATIONS ---
    if (titre && titre.length < 3) {
      return res.status(400).json({ erreur: 'Titre invalide.' });
    }
    if (description && description.length < 10) {
      return res.status(400).json({ erreur: 'Description invalide.' });
    }
    if (creditsProposes && creditsProposes < 1) {
      return res.status(400).json({ erreur: 'Crédits invalides.' });
    }
    if (typePrestation === 'Présentiel' && prix && prix <= 0) {
      return res.status(400).json({ erreur: 'Prix requis pour une prestation présentielle.' });
    }
    if (typePrestation && (typePrestation === 'presentiel' || typePrestation === 'hybride') && !lieu) {
      return res.status(400).json({ erreur: 'Lieu requis pour ce type de prestation.' });
    }

    // Gérer les catégories
    let categoriesArray = categories;
    if (categories && !Array.isArray(categories)) {
      categoriesArray = [categories].filter(Boolean);
    }

    // Gérer les images — seulement si de nouvelles sont uploadées
    let images = service.images; // par défaut, on garde les anciennes
    if (req.files && req.files.length > 0) {
  images = req.files.map(file => file.path); // ✅ Utilise file.path
    }

    // Mettre à jour le service
    service.titre = titre || service.titre;
    service.description = description || service.description;
    service.categories = categoriesArray || service.categories;
    service.typePrestation = typePrestation || service.typePrestation;
    service.creditsProposes = creditsProposes || service.creditsProposes;
    service.prix = typePrestation === 'Présentiel' ? (prix || service.prix) : undefined;
    service.images = images;
    service.dateService = dateService || service.dateService;
    service.heure = heure || service.heure;
    service.duree = duree || service.duree;
    service.typeCours = typeCours || service.typeCours;
    service.publicCible = publicCible || service.publicCible;
    service.accessiblePMR = accessiblePMR !== undefined ? accessiblePMR : service.accessiblePMR;
    service.lieu = lieu || service.lieu;
    service.nombrePlaces = nombrePlaces || service.nombrePlaces;

    const updatedService = await service.save();

    console.log("✅ Service mis à jour :", updatedService);

    res.status(200).json({
      message: "Service mis à jour avec succès.",
      service: updatedService,
    });

  } catch (err) {
    console.error("❌ Erreur mise à jour service :", err);
    res.status(500).json({ erreur: "Erreur serveur lors de la mise à jour." });
  }
};