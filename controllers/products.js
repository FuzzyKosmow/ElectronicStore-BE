
const Product = require('../models/product');
const pageLimit = 30;
module.exports.getProducts = async (req, res) => {
    //Implement pagination
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    if (page < 1) {
        return res.status(400).json({ error: 'Invalid page number, should start with 1' });
    }
    if (limit < 1) {
        return res.status(400).json({ error: 'Invalid limit, should be positive number' });
    }
    if (isNaN(page) || isNaN(limit)) {
        page = 1;
        limit = pageLimit;
    }
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {};
    if (endIndex < await Product.countDocuments().exec()) {
        results.next = {
            page: page + 1,
            limit: limit
        }
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }
    try {
        results.results = await Product.find().limit(limit).skip(startIndex).exec();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}
module.exports.addProduct = async (req, res) => {
    const product = new Product(req.body);
    try {
        const savedProduct = await product.save();
        res.json(savedProduct);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}

module.exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ product });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//Update product
module.exports.updateProduct = async (req, res) => {
}
//Delete product
module.exports.deleteProduct = async (req, res) => {
}
