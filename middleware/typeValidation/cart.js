const joi = require('joi');
joi.objectId = require('joi-objectid')(joi);

const ModifyCartSchema = joi.object({
    cart: joi.array().items(joi.object({
        productId: joi.objectId().required(),
        quantity: joi.number().min(0).required(),
    })).required(),

});

const ModifyCartValidation = (req, res, next) => {
    const { error } = ModifyCartSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
}

module.exports = ModifyCartValidation;


