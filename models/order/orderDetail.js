const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const OrderDetailSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        min: 1,
        required: true
    }
});

module.exports = mongoose.model('OrderDetail', OrderDetailSchema);