const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
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
imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

module.exports = mongoose.model('Image', imageSchema);
module.exports.imageSchema = imageSchema;