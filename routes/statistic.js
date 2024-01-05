const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const statisticController = require('../controllers/statistic');

//Most sold product
router.get('/products-most', authorize(['employee', 'admin']), statisticController.getMostSoldProduct);
//Get profit between two dates
router.get('/profit', authorize(['employee', 'admin']), statisticController.getProfit);
//Get number of customer order between two dates
router.get('/customer-ordered', authorize(['employee', 'admin']), statisticController.getCustomerOrder);
//Get number of product sold between two dates
router.get('/product-sold', authorize(['employee', 'admin']), statisticController.getProductSold);

router.route('/')
    .get(authorize(['employee', 'admin']), statisticController.getStatistic);

module.exports = router;