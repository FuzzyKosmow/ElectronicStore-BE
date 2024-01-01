const joi = require('joi');
const CreateCustomerSchema = joi.object({
    name: joi.string().required().max(25),
    address: joi.string().max(50),
    phoneNumber: joi.string().max(15).required(),
});

const UpdateCustomerSchema = joi.object({
    name: joi.string().max(25),
    address: joi.string().max(50),
    phoneNumber: joi.string().max(15),
});

const ValidateCreateCustomer = (req, res, next) => {
    const { error } = CreateCustomerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}
const ValidateUpdateCustomer = (req, res, next) => {
    const { error } = UpdateCustomerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}

module.exports = {
    ValidateCreateCustomer,
    ValidateUpdateCustomer,
};