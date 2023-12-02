
//Cloudinary setup
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
//Cloudinary setup

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
//Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'ElectronicStore',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});


module.exports = {
    cloudinary,
    storage
}