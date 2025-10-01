// config/cloudinary.js
const cloudinary = require('cloudinary').v2; // ✅ .v2 existe seulement en v2+
const { CloudinaryStorage } = require('multer-storage-cloudinary');
console.log("☁️ Cloudinary v2 chargé");
console.log("🔧 Clé API:", process.env.CLOUDINARY_API_KEY?.substring(0, 4) + "...");
console.log("📦 Dossier:", process.env.CLOUDINARY_CLOUD_NAME);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'openup/image',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    resource_type: 'image',
  },
});

module.exports = { cloudinary, storage };