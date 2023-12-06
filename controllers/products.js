
const Product = require('../models/product');
const pageLimit = 30;
const Image = require('../models/image');
//This function will convert the query to filter. Will check for the following fields:
//brand, type, name, manufacturer, countryOrigin, sellPrice, sellPriceMin, sellPriceMax
//In brand , name, manufacturer, countryOrigin, will use regex to find all products that contain the string
//In sellPrice, sellPriceMin, sellPriceMax, will find all products that have sellPrice >= sellPriceMin and sellPrice <= sellPriceMax
function ConvertProductQuery(query) {
    if (!query) {
        return {};
    }
    const filter = {};
    if (query.brand) {
        filter.brand = { $regex: query.brand, $options: 'i' };
    }
    if (query.type) {
        filter.type = query.type;
    }
    if (query.name) {
        //Run regex to find all products that contain the name
        filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query.manufacturer) {
        filter.manufacturer = { $regex: query.manufacturer, $options: 'i' };
    }
    if (query.countryOrigin) {
        filter.countryOrigin = { $regex: query.countryOrigin, $options: 'i' };
    }
    //If sellPrice is provided, will find all products that is equal to sellPrice. 
    //If sellPriceMin is provided, will find all products that have sellPrice >= sellPriceMin
    //If sellPriceMax is provided, will find all products that have sellPrice <= sellPriceMax
    //If both sellPriceMin and sellPriceMax are provided, will find all products that have sellPriceMin <= sellPrice <= sellPriceMax
    //Will discard sellPrice if sellPriceMin or sellPriceMax is provided
    if (query.sellPrice) {
        filter.sellPrice = query.sellPrice;
    }
    if (query.sellPriceMin) {
        filter.sellPrice = { $gte: query.sellPriceMin };
    }
    if (query.sellPriceMax) {
        if (filter.sellPrice) {
            filter.sellPrice.$lte = query.sellPriceMax;
        }
        else {
            filter.sellPrice = { $lte: query.sellPriceMax };
        }
    }

    return filter;

}
//This function will validate page and limit. If page or limit is invalid, will return error message 400
const ValidatePagination = (page, limit) => {
    if (page < 1) {
        return res.status(400).json({ error: 'Invalid page number, should start with 1' });
    }
    if (limit < 1) {
        return res.status(400).json({ error: 'Invalid limit, should be positive number' });
    }
    if (isNaN(page)) {
        page = 1;
    }
    if (isNaN(limit)) {
        limit = pageLimit;
    }
    return { page, limit };
}

module.exports.getProducts = async (req, res) => {
    //Implement pagination
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    const query = req.query;
    //Checking filter
    let filter = {};
    if (req.query) {
        filter = ConvertProductQuery(req.query);
    }
    ///Validate page and limit then reassign it to the variable
    const { page: newPage, limit: newLimit } = ValidatePagination(page, limit);
    page = newPage;
    limit = newLimit;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {};
    //Setting start index
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
