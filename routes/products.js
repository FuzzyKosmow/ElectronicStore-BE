const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');
const { authorize } = require('../middleware/auth');
//Product routing. Require employee level authorization.
//Get all should include pagination. Each page should have 30 products.
router.route('/')
    .get(authorize(['employee', 'admin']), productController.getProducts)
    .post(authorize(['employee', 'admin']), productController.addProduct);

router.route('/:id')
    .get(authorize(['employee', 'admin']), productController.getProduct)
    .patch(authorize(['employee', 'admin']), productController.updateProduct)
    .delete(authorize(['employee', 'admin']), productController.deleteProduct);



module.exports = router;