const express = require('express');
const app = express();
const User = require('../models/employee');
const router = express.Router();
const employeeController = require('../controllers/employees');
const { authorize } = require('../middleware/auth');

router.route('/')
    .get(authorize(['employee', 'admin']), employeeController.getEmployees)
    .post(authorize(['admin']), employeeController.addEmployee);
router.route('/:id')
    .get(authorize(['employee', 'admin']), employeeController.getEmployee)
    .put(authorize(['admin']), employeeController.updateEmployee)
    .delete(authorize(['admin']), employeeController.deleteEmployee);

module.exports = router;