const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
});
//Virtual for thumbnail
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

module.exports = mongoose.model('Image', ImageSchema);
module.exports.ImageSchema = ImageSchema;