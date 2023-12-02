const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CustomerSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: false
        },
        phoneNumber: {
            type: String,
            required: false
        },
    }
)
module.exports = mongoose.model('Customer', CustomerSchema);