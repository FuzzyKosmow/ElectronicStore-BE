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
            required: true,
        },
        latestOrderDate: {
            //DD/MM/YYYY
            type: String,
            required: false,
            default: null
        },
        totalValueBought: {
            type: Number,
            required: false,
            default: 0
        }
    }
)
module.exports = mongoose.model('Customer', CustomerSchema);