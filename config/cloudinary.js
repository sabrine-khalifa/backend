// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'openup/images', // Dossier virtuel sur Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    resource_type: 'image',
  },
});

module.exports = { cloudinary, storage };