const Employee = require('../models/employee');
const Image = require('../models/image');
const { cloudinary } = require('../cloudinary');
const Product = require('../models/product');
const User = require('../models/user');
const adminEmployeeInfoId = process.env.ADMIN_EMPLOYEE_INFO_ID;
//This function convert query to filter object for mongoose
//Query can be:
//Exact match: gender
//Contains: name, address, email, phoneNumber
//Birth date filter: birthDate, minBirthDate, maxBirthDate
//Salary filter: salary, minSalary, maxSalary

function ConvertEmployeeQuery(query) {
    let filter = {};
    if (!query)
        return filter;
    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query.address) {
        filter.address = { $regex: query.address, $options: 'i' };
    }
    if (query.phoneNumber) {
        filter.phoneNumber = { $regex: query.phoneNumber, $options: 'i' };
    }
    if (query.birthDate) {
        filter.birthDate = query.birthDate;
    }
    if (query.minBirthDate) {
        filter.birthDate = { $gte: query.minBirthDate };
    }
    if (query.maxBirthDate) {
        filter.birthDate = { $lte: query.maxBirthDate };
    }
    if (query.salary) {
        filter.salary = query.salary;
    }
    if (query.minSalary) {
        filter.salary = { $gte: query.minSalary };
    }
    if (query.maxSalary) {
        filter.salary = { $lte: query.maxSalary };
    }


    return filter;
}
module.exports.getEmployees = async (req, res, next) => {
    //Implement pagination
    const limit = req.query.limit;
    const startIndex = req.query.startIndex;
    let results = {};
    let filter = {};
    results = { ...req.results }
    if (req.query) {
        filter = ConvertEmployeeQuery(req.query);
    }
    try {
        const employees = await Employee.find(filter).skip(startIndex).limit(limit).exec();
        // results.results = await User.find({ role: 'employee' }).populate('employeeId').find(filter).skip(startIndex).limit(limit).exec();
        //Go through each employee id. If User has employeeId that is not in employee list, remove it
        const employeeIds = employees.map(employee => employee._id.toString());
        results.results = await User.find({ role: 'employee' }).populate('employeeId').exec();
        results.results = results.results.filter(user => employeeIds.includes(user.employeeId._id.toString()));

        //Exclude admin employee info
        if (adminEmployeeInfoId) {
            results.results = results.results
                .filter(employee => employee._id.toString() !== adminEmployeeInfoId);
        }
        results.totalFilterCount = await Employee.countDocuments(filter).exec();
        res.status(200).json({ results });
    } catch (error) {
        next(error);
    }
}
module.exports.getEmployee = async (req, res, next) => {
    try {

        const { id } = req.params;
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found', success: false });
        }
        res.json({ employee });
    } catch (e) {
        next(e);
    }
}
module.exports.addEmployee = async (req, res, next) => {
    const { name, phoneNumber, address, gender, birthDate, salary, position } = req.body;
    const { username, password } = req.body;
    // Minimum require name, username and password
    if (!name || !username || !password) {
        return res.status(400).json({ error: 'Name, username and password are required', success: false });
    }
    //Check if user exists
    const userExists = await User.exists({ username: username });
    if (userExists) {
        return res.status(400).json({ error: 'Username already exists', success: false });
    }
    //Create associate employee
    const employee = new Employee(
        {
            name: name,
            phoneNumber: phoneNumber,
            address: address,
            address: address,
            gender: gender,
            birthDate: birthDate,
            salary: salary,
            position: position
        }
    );
    //Register user
    const user = new User({ username, role: 'employee' });

    user.employeeId = employee._id;



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

    try {
        // Save the employee to the database
        await employee.save();
        await User.register(user, password);

        // Respond with success message and the created employee
        res.json({ msg: 'Employee added', employee, success: true });
    } catch (e) {
        next(e);
    }
};


module.exports.deleteEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findOneAndDelete({ _id: id });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.status(200).json({ msg: 'Employee deleted' });
    } catch (e) {
        next(e);
    }
}

module.exports.updateEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;
        // Find the employee by ID
        const employee = await Employee.findById(id);

        // Check if the employee exists
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found', success: false });
        }
        //Check if user upload any image
        if (req.file) {
            // Get url and filename from cloudinary
            const { path, filename } = req.file;
            const avatar = new Image(
                {
                    fileName: filename,
                    url: path,
                }
            );
            // Remove old image from cloudinary
            if (employee.avatar && employee.avatar.fileName) {
                await cloudinary.uploader.destroy(employee.avatar.fileName, function (err, res) {
                    if (err) {
                        console.error("Error deleting image from cloudinary: ", err);
                    }
                    else {
                        console.log("Image deleted from cloudinary: ", res);
                    }
                });
            }

            employee.avatar = avatar;
        }
        // Update the employee fields based on the request body
        for (const [key, value] of Object.entries(updateFields)) {
            // Check if the key exists in the employee model schema before updating
            if (employee.schema.obj[key] !== undefined) {
                //Birth date is received in format DD/MM/YYYY.
                if (key === 'birthDate') {
                    const date = value;
                    const [day, month, year] = date.split('/');
                    //Remove hour and store in DD/MM/YYYY format
                    employee[key] = new Date(`${year}-${month}-${day}`);

                }
                else
                    employee[key] = value;
            }
        }


        await employee.save();

        // Respond with success message and the updated employee
        res.status(200).json({ msg: 'Employee updated', employee });
    } catch (e) {
        console.error(e);
        next(e);
    }

};

module.exports.getCart = async (req, res, next) => {
    try {
        //Check if employee exist
        const { id } = req.params;
        const employee = Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        if (!req.session.cart) {
            req.session.cart = [];
        }
        return res.status(200).json({ cart: req.session.cart });
    } catch (e) {
        next(e);
    }
}
//Take in cart. Simply replace the old cart with new cart
module.exports.modifyCart = async (req, res, next) => {
    try {
        const { cart } = req.body;
        //Check if employee exist
        const { id } = req.params;
        const employee = Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        //Check each item in cart. If item is not valid, response with error
        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            //Check if product exist
            const product = Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
        }
        req.session.cart = cart;
        return res.status(200).json({ msg: 'Cart updated' });
    } catch (e) {
        next(e);
    }
}