
const joi = require('joi');
const CreateProductSchema = joi.object({
    productName: joi.string().required().max(50),
    type: joi.string().required().max(50),
    brand: joi.string().required().max(25),
    manufacturer: joi.string().required().max(50),
    sellPrice: joi.number().min(0),
    importPrice: joi.number().min(0),
    quantity: joi.number().min(0),
    countryOrigin: joi.string().required().max(50),
    images: joi.array().items(joi.object({
        url: joi.string(),
        filename: joi.string(),
    })),
});
//Update consist of action to update information if needed as well as image. 
//Action can be add or reduce quantity of product. Default is add.
//If no action is specified, it will be add.
//If no quantity is specified, it will be 0.
const UpdateProductSchema = joi.object({
    productName: joi.string().max(50),
    type: joi.string().max(50),
    brand: joi.string().max(25),
    manufacturer: joi.string().max(50),
    sellPrice: joi.number().min(0),
    importPrice: joi.number().min(0),
    countryOrigin: joi.string().max(50),
    images: joi.array().items(joi.object({
        url: joi.string(),
        filename: joi.string(),
    })),
    //Product action : add with X quantity or reduce with X quantity// Both must be present
    productAction: joi.object({
        action: joi.string().valid('add', 'reduce').required(),
        quantity: joi.number().min(0).required(),
    }).optional(),
    imagesDel: joi.array().items(joi.string()),
})
const ValidateCreateProduct = (req, res, next) => {
    const { error } = CreateProductSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

const ValidateUpdateProduct = (req, res, next) => {
    const { error } = UpdateProductSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: "Schema validation error: " + error.details[0].message });
    }
    next();
}

module.exports = {
    ValidateCreateProduct,
    ValidateUpdateProduct,
};