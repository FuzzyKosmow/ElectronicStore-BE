const Customer = require('../models/customer');

//Search for customers by name, address, phone number
//Will return if contains any of the search terms
const ConvertCustomerQuery = (query) => {
    const filter = {};
    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query.address) {
        filter.address = { $regex: query.address, $options: 'i' };
    }
    if (query.phoneNumber) {
        filter.phoneNumber = { $regex: query.phoneNumber, $options: 'i' };
    }
    return filter;
}

module.exports.getCustomers = async (req, res, next) => {
    const limit = req.query.limit;
    const startIndex = req.query.startIndex;
    const query = req.query;
    let results = {};
    results = { ...req.results }
    //Filter assignment
    let filter = {};
    if (req.query) {
        filter = ConvertCustomerQuery(req.query);
    }
    try {
        results.results = await Customer.find(filter).limit(limit).skip(startIndex).exec();
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
}
module.exports.addCustomer = async (req, res, next) => {
    const { name, address, phoneNumber } = req.body;
    const customer = new Customer({
        name,
        address,
        phoneNumber,
    });
    //If address or phone number is not provided, set to null
    if (!address)
        customer.address = null;
    if (!phoneNumber)
        customer.phoneNumber = null;
    try {
        await customer.save();
        res.status(200).json(customer);
    } catch (error) {
        next(error);
    }
}

module.exports.getCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).exec();
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}
module.exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).exec();
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        customer.set(req.body);
        await customer.save();
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}
module.exports.deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id).exec();
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json({ message: 'Customer deleted', _id: customer._id });
    } catch (error) {
        next(error);
    }
}

