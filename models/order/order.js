const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Order = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true

    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    orderDate: {
        //DD/MM/YYYY HH:MM:SS
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Delivered'],
        default: 'Pending',
        required: true
    },
    //This just contains ids of order details
    orderDetails: [{
        type: Schema.Types.ObjectId,
        ref: 'OrderDetail'
    }],
    total: {
        type: Number,
        default: 0
    },
    profit: {
        type: Number,
        default: 0
    }
});
Order.pre('save', async function (next) {
    //Use order details to get product and its sell price to calculate total
    try {
        let total = 0;
        let baseCost = 0;
        const orderDetails = [...this.orderDetails]
        for (const orderDetailId of orderDetails) {
            const orderDetail = await mongoose.model('OrderDetail').findById(orderDetailId);
            //If undefined, remove it from order details
            if (!orderDetail) {
                console.log("Presave: Order detail not found");
                this.orderDetails = this.orderDetails.filter(id => id !== orderDetailId);
                continue;
            }
            const product = await mongoose.model('Product').findById(orderDetail.productId);
            total += orderDetail.quantity * product.sellPrice;
            baseCost += orderDetail.quantity * product.importPrice;


        }

        this.total = total;
        this.profit = total - baseCost;


        next();
    } catch (error) {
        console.log("Pre save error: ", error);
    }
});
Order.pre('findOneAndDelete', async function (next) {
    try {
        const order = await this.model.findOne(this.getQuery());
        if (!order) {
            {
                console.log("Order not found");
                return next();
            }
        }
        //Delete order details
        for (const orderDetailId of order.orderDetails) {
            await mongoose.model('OrderDetail').findByIdAndDelete(orderDetailId);
        }
        next();
    } catch (error) {
        console.log("Pre delete error: ", error);
    }
});

module.exports = mongoose.model('Order', Order);