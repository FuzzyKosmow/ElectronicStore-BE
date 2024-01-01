//Authentication middleware. Check if user is logged in or not . Also additional middleware to check if user is an employee or  admin   
const roleEnum = require('../enums/roles');
const User = require('../models/user');
function authorize(rolesAllowed) {
    return (req, res, next) => {
        // Check if the user contains the required role
        if (!req.isAuthenticated()) {
            return res.status(401).json({ msg: 'Unauthorized, you are not logged in', success: false });
        }
        //Get username and check role 
        const { username } = req.user;
        //Dont add call back to find one
        User.findOne({ username })
            .then(user => {
                if (!user) {
                    return res.status(401).json({ msg: 'Unauthorized, you are not logged in', success: false });
                }
                const { role } = user;
                if (rolesAllowed.includes(role)) {
                    next();
                }
                else {
                    return res.status(401).json({ msg: 'Unauthorized,  you must have one of the following roles: ' + rolesAllowed, success: false });
                }
            })
            .catch(e => {
                console.log(e);
            });

    };
}
module.exports.getCurrentUser = (req, res, next) => {
    //If logged in , return username and role.
    console.log(req.body);
    if (req.isAuthenticated()) {
        const { username, role, employeeId } = req.user;
        return res.status(200).json({ user: { username, role, employeeId } });
    }
    res.status(200).json({ user: null });
}
module.exports.authorize = authorize;