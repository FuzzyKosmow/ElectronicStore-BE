const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ImageSchema } = require('./image');
const { cloudinary } = require('../cloudinary');
const productSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    manufacturer: {
        type: String,
        required: true
    },
    sellPrice: {
        type: Number,
        required: true
    },
    importPrice: {
        type: Number,
        required: true
    },
    countryOrigin: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: false,
        default: 0

    },
    sold: {
        type: Number,
        required: false,
        default: 0
    },
    images: {
        type: [ImageSchema],
    },
});
productSchema.post('findOneAndDelete', async function (doc) {
    try {
        if (doc && doc.images) {
            console.log("Deleting images from cloudinary: ", doc.images);
            // Convert to array
            const images = [...doc.images];
            for (const image of images) {
                await cloudinary.uploader.destroy(image.fileName, function (err, res) {
                    if (err) {
                        console.error("Error deleting image from cloudinary: ", err);
                    } else {
                        console.log("Image deleted from cloudinary: ", res);
                    }
                });
            }
        }
    } catch (e) {
        console.error("Error deleting images from cloudinary: ", e);
    }
});
module.exports = mongoose.model('Product', productSchema);