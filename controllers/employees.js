const Employee = require('../models/employee');
const passport = require('passport');


module.exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({});
        res.json({ employees });
    }
    catch (e) {
        console.log(e);
    }
}
module.exports.addEmployee = async (req, res) => {
    try {
        // Require name. Additional attributes: email, phone, address, gender, dateOfBirth, avatar
        const { name, phoneNumber, address, gender, birthDate, avatar } = req.body;
        // Validate that at least the "name" attribute is present
        if (!name) {
            return res.status(400).json({ error: 'Name is required in the request body.' });
        }

        // Create a new employee object with the provided attributes
        const employee = new Employee({
            name: name,
            address: address,
            phoneNumber: phoneNumber,
            birthDate: birthDate,
            gender: gender,
            avatar: avatar,
        });

        // Save the employee to the database
        await employee.save();
        //Todo: Handle case where employee may not have account/ not needing one.


        // Respond with success message and the created employee
        res.json({ msg: 'Employee added', employee });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports.getEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ employee });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
module.exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ msg: 'Employee deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;

        // Find the employee by ID
        const employee = await Employee.findById(id);

        // Check if the employee exists
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Update the employee fields based on the request body
        for (const [key, value] of Object.entries(updateFields)) {
            // Check if the key exists in the employee model schema before updating
            if (employee.schema.obj[key] !== undefined) {
                employee[key] = value;
            }
        }

        // Save the updated employee to the database
        await employee.save();

        // Respond with success message and the updated employee
        res.json({ msg: 'Employee updated', employee });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

