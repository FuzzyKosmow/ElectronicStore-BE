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
            return res.json({ msg: 'Employee already exists', success: false });
        }
        await employee.save();
        const user = new User({ username, role: 'employee' });
        user.employeeId = employee._id;
        //Register
        const registeredUser = await User.register(user, password);

        res.json({ msg: 'Employee registered', employeeId: employee._id, username: username, role: 'employee' });

    }
    catch (e) {
        res.json({ msg: 'Employee registration failed', error: e });
    }
}
module.exports.registerAdmin = async (req, res, next) => {
    try {
        console.log('registerAdmin');
        const { username, password } = req.body;
        //Create an empty employee. Connect it to the user
        const employee = new Employee(
            {
                name: username,
            }
        );
        //Check if user exists
        const userExists = await User.exists({ username: username });
        await employee.save();
        const user = new User({ username, role: 'admin' });
        user.employeeId = employee._id;
        //Register
        const registeredUser = await User.register(user, password);
        //Log in the user
        req.login(registeredUser, err => {
            if (err) {
                return next(err);
            }
            //Send json information
            res.json({ msg: 'Admin registered', employeeId: employee._id, username: username, role: 'admin' });

        });
    }
    catch (e) {
        res.json({ msg: 'Admin registration failed', error: e });
    }
}



module.exports.login = (req, res) => {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (!user) {
            return res.json({ msg: 'Invalid username or password', success: false });
        }
        req.logIn(user, function (err) {
            if (err) {
                console.log(err);
                return next(err);
            }
            //Set user
            res.user = user;
            res.json({ msg: 'Login success', success: true, employeeId: user.employeeId, username: user.username, role: user.role });
        });
    })(req, res);
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            console.log(err);
            return next(err);
        }
        req.session.destroy();
        //Set user
        res.user = null;
        res.json({ msg: 'Logout success', success: true });
    });
};