const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const customerController = require('../controllers/customers');
const { ValidateCreateCustomer, ValidateUpdateCustomer } = require('../middleware/typeValidation/customer');
const IsValidObjectId = require('../middleware/typeValidation/validObjectId');
const ValidatePagination = require('../middleware/validatePageLimit');
const Customer = require('../models/customer');
const ValidatePageWrapper = async (req, res, next) => {
    ValidatePagination(req, res, next, () => Customer.countDocuments());
}
router.route('/')
    .get(authorize(['employee', 'admin']), ValidatePageWrapper, customerController.getCustomers)
    .post(authorize(['employee', 'admin']), ValidateCreateCustomer, customerController.addCustomer);

router.route('/:id')
    .get(authorize(['employee', 'admin']), IsValidObjectId, customerController.getCustomer)
    .patch(authorize(['employee', 'admin']), IsValidObjectId, ValidateUpdateCustomer, customerController.updateCustomer)
    .delete(authorize(['employee', 'admin']), IsValidObjectId, customerController.deleteCustomer);


module.exports = router;