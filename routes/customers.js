const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const customerController = require('../controllers/customers');


router.route('/')
    .get(authorize(['employee', 'admin']), customerController.getCustomers)
    .post(authorize(['employee', 'admin']), customerController.addCustomer);

router.route('/:id')
    .get(authorize(['employee', 'admin']), customerController.getCustomer)
    .patch(authorize(['employee', 'admin']), customerController.updateCustomer)
    .delete(authorize(['employee', 'admin']), customerController.deleteCustomer);

module.exports = router;