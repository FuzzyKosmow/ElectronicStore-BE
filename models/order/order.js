const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Order = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Delivered'],
        default: 'Pending'
    },
    orderDetails: [{
        type: Schema.Types.ObjectId,
        ref: 'OrderDetail'
    }],
    total: {
        type: Number,
        default: 0
    }
});
Order.pre('save', async function (next) {
    //Use order details to get product and its sell price to calculate total
    const orderDetails = this.orderDetails;
    let total = 0;
    for (const orderDetail of orderDetails) {
        const product = await mongoose.model('Product').findById(orderDetail.productId);
        total += product.sellPrice * orderDetail.quantity;
    }
    this.total = total;
    next();
});
Order.pre('remove', async function (next) {
    //Remove all order details associated with this order
    const orderDetails = this.orderDetails;
    for (const orderDetail of orderDetails) {
        await mongoose.model('OrderDetail').findByIdAndDelete(orderDetail);
    }
    next();
});
Order.pre('findOneAndDelete', async function (next) {
    //Remove all order details associated with this order
    const orderDetails = this.orderDetails;
    for (const orderDetail of orderDetails) {
        await mongoose.model('OrderDetail').findByIdAndDelete(orderDetail);
    }
    next();
});

module.exports = mongoose.model('Order', Order);