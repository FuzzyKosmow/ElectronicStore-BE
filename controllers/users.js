const User = require('../models/user');
const ExpressError = require('../utils/ExpressError');
const Employee = require('../models/employee');
const passport = require('passport');
module.exports.renderRegisterForm = (req, res) => {
    res.render('users/register');
}
module.exports.registerEmployee = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        //Create an empty employee. Connect it to the user
        const employee = new Employee(
            {
                name: username,
            }
        );
        //Check if employee exists
        const employeeExists = await Employee.exists({ name: username });
        if (employeeExists) {
            return res.status(400).json({ error: 'Employee already exists', employeeId: employee._id });
        }
        await employee.save();
        const user = new User({ username, role: 'employee' });
        user.employeeId = employee._id;
        //Register
        const registeredUser = await User.register(user, password);
        res.status(200).json({ msg: 'Employee registered', employeeId: employee._id, username: username, role: 'employee' });

    }
    catch (e) {
        next(e);
    }
}
module.exports.registerAdmin = async (req, res, next) => {
    try {
        console.log('registerAdmin');
        const { username, password } = req.body;

        //Check if user exists
        const userExists = await User.exists({ username: username });

        const user = new User({ username, role: 'admin' });
        user.employeeId = null;
        //Register
        const registeredUser = await User.register(user, password);
        //Log in the user
        req.login(registeredUser, err => {
            if (err) {
                return next(err);
            }
            //Send json information
            res.status(200).json({ msg: 'Admin registered', username: username, role: 'admin' });

        });
    }
    catch (e) {
        next(e);
    }
}



module.exports.login = (req, res) => {
    try {
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                console.log(err);
                return next(err);
            }
            if (!user) {
                return res.status(400).json({ error: 'Invalid username or password' });
            }
            req.logIn(user, function (err) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                //Set user
                res.user = user;
                res.status(200).json({ msg: 'Login success', employeeId: user.employeeId, username: user.username, role: user.role });
            });
        })(req, res);
    }
    catch (e) {
        next(e);
    }
};

module.exports.logout = (req, res, next) => {
    try {
        req.logout(function (err) {
            if (err) {
                return next(err);
            }
            req.session.destroy();
            //Set user
            res.user = null;
            res.status(200).json({ msg: 'Logout success' });
        });
    }
    catch (e) {
        next(e);
    }
};