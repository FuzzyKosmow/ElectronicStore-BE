const express = require('express');
const Employee = require('../models/employee');
const router = express.Router();
const employeeController = require('../controllers/employees');
const { authorize } = require('../middleware/auth');
const multer = require('multer');
const { storage } = require('../cloudinary');
//Store in cloudinary, max 1 image, 10mb.
//File name is employee username. Stored inside /employeee
const upload = multer({ storage, limits: { fileSize: 10000000, }, dest: 'employee/' }).single('avatar');
const ValidatePagination = require('../middleware/validatePageLimit');
const { ValidateUpdateEmployee } = require('../middleware/typeValidation/user');
const IsValidObjectId = require('../middleware/typeValidation/validObjectId');
const UploadImage = async (req, res, next) => {
    try {
        await upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                console.error("Multer error: ", err);
                return res.status(500).json({ error: 'Error uploading file.' });
            }
            else if (err) {
                // An unknown error occurred when uploading.
                console.error("Unknown error: ", err);
                console.log(req.headers);
                return res.status(500).json({ error: 'Error uploading file.' });
            }
            next();
        });
    } catch (error) {
        // Handle other errors
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
}
//Wrapper class for ValidatePagination
const ValidatePageWrapper = async (req, res, next) => {
    ValidatePagination(req, res, next, () => Employee.countDocuments());
}
router.route('/')
    .get(authorize(['employee', 'admin']), ValidatePageWrapper, employeeController.getEmployees)
    //This path may be disable. Employee come with account. And ususally creating account also create another employee
    //Consider disabling this path later.
    .post(authorize(['admin']), UploadImage, employeeController.addEmployee);
router.route('/:id')
    .get(authorize(['employee', 'admin']), IsValidObjectId, employeeController.getEmployee)
    .patch(authorize(['admin']), IsValidObjectId,  UploadImage,ValidateUpdateEmployee, employeeController.updateEmployee)
    .delete(authorize(['admin']), IsValidObjectId, employeeController.deleteEmployee);




module.exports = router;