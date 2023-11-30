const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSChema = new Schema({
    url: String,
    filename: String
});

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
    images: {
        type: [ImageSChema]
    },
});

module.exports = mongoose.model('Product', productSchema);