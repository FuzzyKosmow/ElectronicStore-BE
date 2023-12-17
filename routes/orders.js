const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orders');
const Order = require('../models/order/order');
const { authorize } = require('../middleware/auth');
const ValidatePagination = require('../middleware/validatePageLimit');
const { ValidateCreateOrder, ValidateUpdateOrder } = require('../middleware/typeValidation/order');
const IsValidObjectId = require('../middleware/typeValidation/validObjectId');
const ValidatePageWrapper = async (req, res, next) => {
    ValidatePagination(req, res, next, () => Order.countDocuments());
}

router.route('/')
    .get(authorize(['employee', 'admin']), ValidatePageWrapper, orderController.getOrders)
    .post(authorize(['employee', 'admin']), ValidateCreateOrder, orderController.addOrder);
router.route('/:id')
    .get(authorize(['employee', 'admin']), IsValidObjectId, orderController.getOrder)
    .patch(authorize(['employee', 'admin']), IsValidObjectId, ValidateUpdateOrder, orderController.updateOrder)
    .delete(authorize(['employee', 'admin']), IsValidObjectId, orderController.deleteOrder);
router.route('/:id/:detailId')
    .get(authorize(['employee', 'admin']), orderController.getOrderDetail)
module.exports = router;