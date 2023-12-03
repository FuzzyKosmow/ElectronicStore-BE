const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');
const { authorize } = require('../middleware/auth');
//Max 10mb file size. Maximum 5 images. Store using product name. Stored inside /product
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage, limits: { fileSize: 10000000, }, dest: 'product/' }).array('images', 5, errorMaxImages);

function errorMaxImages(req, res, next) {
    if (req.files.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 images allowed.' });
    }
    next();
}
router.route('/')
    .get(authorize(['employee', 'admin']), productController.getProducts)
    .post(authorize(['employee', 'admin']), async (req, res) => {
        try {
            await upload(req, res, function (err) {
                if (err instanceof multer.MulterError) {
                    // A Multer error occurred when uploading.
                    console.error("Multer error: ", err);
                    return res.status(500).json({ error: 'Error uploading file.' });
                } else if (err) {
                    // An unknown error occurred when uploading.
                    console.error("Unknown error: ", err);
                    console.log(req.headers);
                    return res.status(500).json({ error: 'Error uploading file.' });
                }

                // File uploaded successfully, continue with productController.addProduct
                productController.addProduct(req, res);
            });
        } catch (error) {
            // Handle other errors
            console.error(error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    });

router.route('/:id')
    .get(authorize(['employee', 'admin']), productController.getProduct)
    .patch(authorize(['employee', 'admin']), productController.updateProduct)
    .delete(authorize(['employee', 'admin']), productController.deleteProduct);



module.exports = router;