const Order = require('../models/order/order');
const OrderDetail = require('../models/order/orderDetail');
const Product = require('../models/product');
const pageLimit = 30;
const page = 1;
function ConvertOrderQuery(query) {
    if (!query) {
        return {};
    }
    const filter = {};
    if (query.customerId) {
        filter.customerId = query.customerId;
    }
    if (query.employeeId) {
        filter.employeeId = query.employeeId;
    }
    if (query.orderDate) {
        filter.orderDate = query.orderDate;
    }
    if (query.status) {
        filter.status = query.status;
    }
    return filter;
}

module.exports.getOrders = async (req, res) => {
    const limit = req.query.limit;
    const startIndex = req.query.startIndex;
    const filter = ConvertOrderQuery(req.query);
    try {

        results.results = await Order.find(filter).limit(limit).skip(startIndex).exec();
        res.status(200).json({ ...results, success: true });
    } catch (error) {
        res.status(500).json({ error: error });
    }
}
module.exports.addOrder = async (req, res) => {
    const orderDetails = req.body.orderDetails;
    const order = new Order({
        customerId: req.body.customerId,
        employeeId: req.body.employeeId,
        orderDate: Date.now(),
        status: 'Pending',
        orderDetails: [],
        total: 0
    });
    try {
        //Save order details
        for (const orderDetail of orderDetails) {
            const product = await Product.findById(orderDetail.productId);
            if (!product) {
                return res.status(400).json({ error: 'Product not found.' });
            }
            const newOrderDetail = new OrderDetail({
                productId: orderDetail.productId,
                quantity: orderDetail.quantity,
                sellPrice: product.sellPrice,
                orderId: order._id
            });
            await newOrderDetail.save();
            order.orderDetails.push(newOrderDetail._id);
        }
        await order.save();
        console.log("saved order");
        res.status(200).json({ msg: 'Order added', order: order });
    } catch (error) {
        res.status(500).json({ error: error });
    }
}

module.exports.getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ order });
    } catch (e) {
        res.status(500).json({ error: e });
    }
}
module.exports.updateOrder = async (req, res) => {

    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const orderDetails = req.body.orderDetails;
        //Delete old order details
        await OrderDetail.deleteMany({ orderId: order._id });
        //Save new order details
        for (const orderDetail of orderDetails) {
            const product = await Product.findById(orderDetail.productId);
            if (!product) {
                return res.status(400).json({ error: 'Product not found.' });
            }
            const newOrderDetail = new OrderDetail({
                productId: orderDetail.productId,
                quantity: orderDetail.quantity,
                sellPrice: product.sellPrice,
                orderId: order._id
            });
            await newOrderDetail.save();
            order.orderDetails.push(newOrderDetail._id);
        }
        order.customerId = req.body.customerId;
        order.employeeId = req.body.employeeId;
        order.orderDate = req.body.orderDate;
        order.status = req.body.status;
        await order.save();
        res.status(200).json({ msg: 'Order updated', order: order });
    } catch (e) {
        res.status(500).json({ error: e });
    }
}

module.exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        await Order.findByIdAndDelete(id);
        res.json({ msg: 'Order deleted' });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e });
    }
}