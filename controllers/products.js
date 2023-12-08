
const Product = require('../models/product');
const pageLimit = 30;
const Image = require('../models/image');
const { cloudinary } = require('../cloudinary');

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
//Return contains results (array of products), next (next page info), previous (previous page info) and success (boolean)
module.exports.getProducts = async (req, res) => {
    //Implement pagination
    const limit = req.query.limit;
    const startIndex = req.query.startIndex;
    const query = req.query;
    const results = {};
    results.next = req.results.next;
    results.previous = req.results.previous;
    //Filter assignment
    let filter = {};
    if (req.query) {
        filter = ConvertProductQuery(req.query);
    }
    try {
        results.results = await Product.find(filter).limit(limit).skip(startIndex).exec();
        res.json({ ...results, success: true });
    } catch (error) {
        res.status(500).json({ error: error, success: false });
    }
}
//Accept in multi-part form data. Append images multiple times to add multiple images
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
        res.json({ msg: 'Product added', product: savedProduct, success: true });
    } catch (error) {
        res.status(500).json({ error: error, success: false });
    }
}
//Singular, no filter
module.exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found', success: false });
        }
        res.json({ product });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
}

//Update product. imagesDel contains the images that will be deleted (array of image id)
//files contains the new images that will be added (array of image)
module.exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        const imagesDel = req.body.imagesDel;
        const updateFields = req.body;
        if (!product) {
            return res.status(404).json({ error: 'Product not found', success: false });
        }
        //Update the product
        for (const [key, value] of Object.entries(updateFields)) {
            product[key] = value;
        }
        if (imagesDel) {
            const imageIds = [...imagesDel]
            for (const imageId of imageIds) {
                // Images is an array of ImageSchema. Find the image where id = imageId
                if (!product.images) {
                    console.log("Product does not have images");
                    break;
                }
                const imageIndex = product.images.findIndex(image => image._id == imageId);

                if (imageIndex !== -1) {
                    const image = product.images[imageIndex];

                    // Delete image from cloudinary
                    await cloudinary.uploader.destroy(image.fileName, function (err, res) {
                        if (err) {
                            console.error("Error deleting image from cloudinary: ", err);
                        } else {
                            console.log("Image deleted from cloudinary: ", res);
                        }
                    });

                    // Pull the image from the product's images field
                    product.images.splice(imageIndex, 1);
                }
            }
        }

        //Check if the file was successfully uploaded
        if (!req.files) {
            console.log("No file uploaded. Product images will not be changed.");
        }
        else {
            //Add the new images
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
                if (!product.images) {
                    product.images = [];
                }
                product.images.push(image);
            }
        }
        //Save the product
        const savedProduct = await product.save();
        res.json({ msg: 'Product updated', product: savedProduct, success: true });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
}
//Delete product
module.exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ msg: 'Product deleted', success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error', success: false });
    }
}
