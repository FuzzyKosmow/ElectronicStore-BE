
const Product = require('../models/product');
const pageLimit = 30;
const Image = require('../models/image');
const { cloudinary } = require('../cloudinary');

//This function will convert the query to filter. Will check for the following fields:
//brand, type, name, manufacturer, countryOrigin, sellPrice, sellPriceMin, sellPriceMax
//In brand , name, manufacturer, countryOrigin, will use regex to find all products that contain the string
//In sellPrice, sellPriceMin, sellPriceMax, will find all products that have sellPrice >= sellPriceMin and sellPrice <= sellPriceMax
//Quantity is similiar to sellPrice


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
    if (query.productName) {
        //Run regex to find all products that contain the name
        filter.productName = { $regex: query.productName, $options: 'i' };
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
    if (query.quantity) {
        filter.quantity = query.quantity;
    }
    if (query.quantityMin) {
        filter.quantity = { $gte: query.quantityMin };
    }
    if (query.quantityMax) {
        if (filter.quantity) {
            filter.quantity.$lte = query.quantityMax;
        }
        else {
            filter.quantity = { $lte: query.quantityMax };
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
        res.status(200).json({ ...results });
    } catch (error) {
        next(error);
    }
}

//Accept in multi-part form data. Append images multiple times to add multiple images
module.exports.addProduct = async (req, res, next) => {
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
        res.status(200).json({ msg: 'Product added', product: savedProduct });
    } catch (error) {
        next(error);
    }
}
//Singular, no filter
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

//Update product: imagesDel contains the images that will be deleted (array of image id)
//files contains the new images that will be added (array of image) (checked at upload section)
//productAction contains the action and quantity to update the product (object). Both will always be present (validation checked)
//If action is add, will add the quantity to the product. If action is reduce, will reduce the quantity from the product
//Old images will be deleted from cloudinary and from the product's images field
//New images will be added to the product's images field
//If no imagesDel is provided, no images will be deleted
//If no files is provided, no images will be added
//If no productAction is provided, no quantity will be changed
//Quantity will not be modifiable outside of productAction
//Flow : Get product -> Update information -> Update quantity -> Delete images -> Add images -> Save product
//Note: Image update must be done in multipart form data.
module.exports.updateProduct = async (req, res, next) => {
    try {
        //Get product
        const { id } = req.params;
        const product = await Product.findById(id);
        const imagesDel = req.body.imagesDel;
        const updateFields = req.body;
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        //Update the product information part
        for (const [key, value] of Object.entries(updateFields)) {
            //Exclude quantity
            if (key === 'quantity') {
                continue;
            }
            product[key] = value;
        }
        //Handle update quantity
        if (updateFields.productAction) {
            const { action, quantity } = updateFields.productAction;
            //Parse quantity to int
            const intQuantity = parseInt(quantity);
            if (action === 'add') {
                product.quantity += intQuantity;
            }
            else if (action === 'reduce') {
                product.quantity = Math.max(product.quantity - intQuantity, 0);
            }
        }
        else
            console.log("No quantity or action provided. Quantity will not be changed.");

        //If imagesDel is provided, delete the images
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
        res.status(200).json({ msg: 'Product updated', product: savedProduct });
    } catch (e) {
        next(e);
    }
}
//Delete product: Have post function to call delete images from cloudinary
module.exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            console.log("Product not found");
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ msg: 'Product deleted', success: true });
    } catch (e) {
        next(e);
    }
}
