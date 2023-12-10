const joi = require('joi');
const GenderEnum = require('../../enums/gender');
const CreateUserSchema = joi.object({
    username: joi.string().required().max(30),
    password: joi.string().required().max(50),
});
//For changing password.
const UpdateUserSchema = joi.object({
    username: joi.string().max(30),
    password: joi.string().max(50),
});

const CreateEmployeeSchema = joi.object({
    name: joi.string().required().max(25),
    address: joi.string().max(50),
    phoneNumber: joi.string().max(15),
    birthDate: joi.date().format('DD/MM/YYYY'),
    gender: joi.string().valid(...Object.values(GenderEnum)),
    avatar: joi.object({
        url: joi.string(),
        filename: joi.string(),
    }),
    salary: joi.number().min(0),
});
const UpdateEmployeeSchema = joi.object({
    name: joi.string().max(25),
    address: joi.string().max(50),
    phoneNumber: joi.string().max(15),
    birthDate: joi.date().format('DD/MM/YYYY'),
    gender: joi.string().valid(...Object.values(GenderEnum)),
    avatar: joi.object({
        url: joi.string(),
        filename: joi.string(),
    }),
    salary: joi.number().min(0)
});

const ValidateCreateUser = (req, res, next) => {
    const { error } = CreateUserSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}
const ValidateUpdateUser = (req, res, next) => {
    const { error } = UpdateUserSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}
const ValidateCreateEmployee = (req, res, next) => {
    const { error } = CreateEmployeeSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}
const ValidateUpdateEmployee = (req, res, next) => {
    const { error } = UpdateEmployeeSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, success: false });
    }
    next();
}
module.exports = {
    ValidateCreateUser,
    ValidateUpdateUser,
    ValidateCreateEmployee,
    ValidateUpdateEmployee,
};