const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ImageSchema } = require('./image');

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
        type: [ImageSchema],
    },
});

module.exports = mongoose.model('Product', productSchema);