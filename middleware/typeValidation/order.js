const joi = require('joi').extend(require('@joi/date'));
//Receive customer id, employee id and order details only.  Order date will be set to current date and status will be set to 'pending'
const CreateOrderSchema = joi.object({
    customerId: joi.string().required(),
    employeeId: joi.string().required(),
    orderDetails: joi.array().items(joi.object({
        productId: joi.string().required(),
        quantity: joi.number().required(),
    })).required(),
});
// Can receive customer id, employee id, order date and status. Order details will be ignored
const UpdateOrderSchema = joi.object({
    customerId: joi.string(),
    employeeId: joi.string(),
    //DD/MM/YYYY
    orderDate: joi.date().format('DD/MM/YYYY'),
    status: joi.string().valid('Pending', 'In Progress', 'Delivered'),
    newOrderDetails: joi.array().items(joi.object({
        productId: joi.string().required(),
        quantity: joi.number().required(),
    })),
    deleteOrderDetails: joi.array().items(joi.string())
});

const ValidateCreateOrder = (req, res, next) => {
    const { error } = CreateOrderSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}
const ValidateUpdateOrder = (req, res, next) => {
    const { error } = UpdateOrderSchema.validate(req.body);
    if (error) {
        console.log("Update validation error: ", error);
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

module.exports = {
    ValidateCreateOrder,
    ValidateUpdateOrder,
};
