
const joi = require('joi');
const CreateProductSchema = joi.object({
    productName: joi.string().required().max(50),
    type: joi.string().required().max(50),
    brand: joi.string().required().max(25),
    manufacturer: joi.string().required().max(50),
    sellPrice: joi.number().min(0),
    importPrice: joi.number().min(0),
    countryOrigin: joi.string().required().max(50),
    images: joi.array().items(joi.object({
        url: joi.string(),
        filename: joi.string(),
    })),
});

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
    imagesDel: joi.array().items(joi.string()),
});

const ValidateCreateProduct = (req, res, next) => {
    const { error } = CreateProductSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}

const ValidateUpdateProduct = (req, res, next) => {
    const { error } = UpdateProductSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}

module.exports = {
    ValidateCreateProduct,
    ValidateUpdateProduct,
};