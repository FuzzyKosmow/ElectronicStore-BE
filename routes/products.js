const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');
const { authorize } = require('../middleware/auth');
//Max 10mb file size. Maximum 5 images. Store using product name. Stored inside /product
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage, limits: { fileSize: 10000000, }, dest: 'product/' }).array('images', 5, errorMaxImages);
const Product = require('../models/product');
const ValidatePagination = require('../middleware/validatePageLimit');
const { ValidateCreateProduct, ValidateUpdateProduct } = require('../middleware/typeValidation/product');
const IsValidObjectId = require('../middleware/typeValidation/validObjectId');
async function UploadImages(req, res, next) {
    try {
        await upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                console.error("Multer error: ", err);
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
                if (err.message === 'Invalid image file') {
                    return res.status(400).json({ error: 'Invalid image file.' });
                }
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
function errorMaxImages(req, res, next) {
    if (req.files.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 images allowed.' });
    }
    next();
}
//Wrapper function for ValidatePagination that will check for the pagination query. If not provided, will use default values
const ValidatePageWrapper = async (req, res, next) => {
    ValidatePagination(req, res, next, () => Product.countDocuments());
}

router.route('/')
    .get(authorize(['employee', 'admin']), ValidatePageWrapper, productController.getProducts)
    .post(authorize(['employee', 'admin']), UploadImages, ValidateCreateProduct, productController.addProduct);

router.route('/:id')
    .get(authorize(['employee', 'admin']), IsValidObjectId, productController.getProduct)
    .patch(authorize(['employee', 'admin']), IsValidObjectId, UploadImages, ValidateUpdateProduct, productController.updateProduct)
    .delete(authorize(['employee', 'admin']), IsValidObjectId, productController.deleteProduct);



module.exports = router;