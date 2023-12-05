
const Product = require('../models/product');
const pageLimit = 30;
const Image = require('../models/image');
module.exports.getProducts = async (req, res) => {
    //Implement pagination
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    const query = req.query;
    const filter = {};
    if (query.brand) {
        filter.brand = query.brand;
    }

    if (query.type) {
        filter.type = query.type;
    }
    //Parameters for seraching products: name, category, 
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

        results.results = await Product.find(filter).limit(limit).skip(startIndex).exec();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}
module.exports.addProduct = async (req, res) => {
    const product = new Product(req.body);
    product.images = [];
    // Check if the file was successfully uploaded
    if (!req.files || !req.files.length) {
        console.log("No file uploaded. Product images will be set to null.");
        product.images = null;
    }
    else {
        for (const file of req.files) {
            // Get url and filename from cloudinary
            const { path, filename } = file;
            // Create a new image object with the provided attributes
            const image = new Image(
                {
                    fileName: filename,
                    url: path,
                }
            );
            // Add the image to the product's images field
            product.images.push(image);
        }
    }
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
