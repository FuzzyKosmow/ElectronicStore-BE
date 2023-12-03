const Employee = require('../models/employee');
const passport = require('passport');
const Image = require('../models/image');

module.exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({});
        res.json({ employees });
    }
    catch (e) {
        console.log(e);
    }
}
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
module.exports.addEmployee = async (req, res) => {
    const { name, phoneNumber, address, gender, birthDate, salary } = req.body;

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
        salary: salary,
    });
    // Check if the file was successfully uploaded
    if (!req.file || !req.file.path || !req.file.filename) {
        console.log("No file uploaded. Avatar will be set to null.");
        employee.avatar = null;
    }
    else {
        // Get url and filename from cloudinary
        const { path, filename } = req.file;
        // Create a new image object with the provided attributes
        const avatar = new Image(
            {
                fileName: filename,
                url: path,
            }
        );
        // Add the image to the employee's avatar field
        employee.avatar = avatar;
    }


    //Todo: Handle case employee without account
    try {
        // Save the employee to the database
        await employee.save();

        // Respond with success message and the created employee
        res.json({ msg: 'Employee added', employee });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    } ``
};


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
        console.log(req.body);
        // Find the employee by ID
        const employee = await Employee.findById(id);

        // Check if the employee exists
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        //Check if user upload any image
        if (req.file) {
            // Get url and filename from cloudinary
            const { path, filename } = req.file;

            // Create a new image object with the provided attributes
            const avatar = new Image(
                {
                    fileName: filename,
                    url: path,
                }
            );
            //Todo: Change it to replace old image later. For now it just update
            // Add the image to the employee's avatar field
            employee.avatar = avatar;
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

