const express = require('express');
const app = express();
const User = require('../models/employee');
const router = express.Router();
const employeeController = require('../controllers/employees');
const { authorize } = require('../middleware/auth');
const multer = require('multer');
const { storage } = require('../cloudinary');
//Store in cloudinary, max 1 image, 10mb.
//File name is employee username. Stored inside /employeee
const upload = multer({ storage, limits: { fileSize: 10000000, }, dest: 'employee/' }).single('avatar');


router.route('/')
    .get(authorize(['employee', 'admin']), employeeController.getEmployees)
    .post(authorize(['admin']), async (req, res) => {
        try {
            await upload(req, res, function (err) {
                if (err) {
                    // Handle multer errors
                    console.error(err);
                    return res.status(500).json({ error: 'Error uploading file.' });
                }

                // File uploaded successfully, continue with employeeController.addEmployee
                employeeController.addEmployee(req, res);
            });
        } catch (error) {
            // Handle other errors
            console.error(error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    });
router.route('/:id')
    .get(authorize(['employee', 'admin']), employeeController.getEmployee)
    .patch(authorize(['admin']), async (req, res) => {
        try {
            await upload(req, res, function (err) {
                if (err) {
                    // Handle multer errors
                    console.error(err);
                    return res.status(500).json({ error: 'Error uploading file.' });
                }

                // File uploaded successfully, continue with employeeController.updateEmployee
                employeeController.updateEmployee(req, res);
            });
        } catch (error) {
            // Handle other errors
            console.error(error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    })
    .delete(authorize(['admin']), employeeController.deleteEmployee);

module.exports = router;