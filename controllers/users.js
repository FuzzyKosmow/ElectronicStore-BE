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
        await employee.save();
        const user = new User({ username, role: 'employee' });
        user.employeeId = employee._id;
        //Register
        const registeredUser = await User.register(user, password);
        //Log in the user
        req.login(registeredUser, err => {
            if (err) {
                return next(err);
            }
            //Send json information
            res.json({ msg: 'Employee registered', employeeId: employee._id, username: username, role: 'employee' });
        });
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



module.exports.login = (req, res, next) => {
    passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' })(req, res, function () {
        const response = {
            employeeId: req.user.employeeId,
            username: req.user.username,
            role: req.user.role
        }
        res.json(response);
    });
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        req.session.destroy();
        res.json({ msg: 'Logout success' });
    });
};