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
const ModifyCartValidation = require('../middleware/typeValidation/cart');
const UploadImage = async (req, res, next) => {
    try {
        await upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ error: 'Too many files uploaded or field name is wrong.' });
                }
                else if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File too large.' });
                }
                else {
                    return res.status(500).json({ error: 'Error uploading file.' });
                }

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
    //TODO:This path may be disable. Employee come with account. And ususally creating account also create another employee
    //Consider disabling this path later.
    .post(authorize(['admin']), UploadImage, employeeController.addEmployee);

router.route('/:id/cart')
    .get(authorize(['employee', 'admin']), IsValidObjectId, employeeController.getCart)
    .post(authorize(['employee', 'admin']), IsValidObjectId, ModifyCartValidation, employeeController.modifyCart)


router.route('/:id')
    .get(authorize(['employee', 'admin']), IsValidObjectId, employeeController.getEmployee)
    .patch(authorize(['admin']), IsValidObjectId, UploadImage, ValidateUpdateEmployee, employeeController.updateEmployee)
    //Also delete associated account
    .delete(authorize(['admin']), IsValidObjectId, employeeController.deleteEmployee);




module.exports = router;