const Customer = require('../models/customer');
const pageLimit = 30;

module.exports.getCustomers = async (req, res) => {
    //Implement pagination
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    const query = req.query;

    const filter = {};
    if (query.name) {
        filter.name = query.name;
    }

    if (query.email) {
        filter.email = query.email;
    }
    //Parameters for seraching products: name, category, 
    if (page < 1) {
        return res.status(400).json({ error: 'Invalid page number, should start with 1' });
    }
    if (limit < 1) {
        return res.status(400).json({ error: 'Invalid limit, should be positive number' });
    }
    if (isNaN(page))
        page = 1;
    if (isNaN(limit))
        limit = pageLimit;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {};
    const docCount = await Customer.countDocuments().exec();
    //Safe guard for end index
    if (endIndex < docCount) {
        results.next = {
            page: page + 1,
            limit: limit
        }
    }
    else if (endIndex >= docCount) {
        results.next = null;
    }
    //Safe guard for start index
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }

    try {

        results.results = await Customer.find(filter).limit(limit).skip(startIndex).exec();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}


module.exports.addCustomer = async (req, res) => {
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
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ error: error });
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
module.exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id).exec();
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found', success: false });
        }
        res.json({ message: 'Customer deleted successfully', customer: customer, success: true });
    } catch (error) {
        res.status(500).json({ error: error });
    }
}