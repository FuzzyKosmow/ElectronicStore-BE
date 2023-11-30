//Authentication middleware. Check if user is logged in or not . Also additional middleware to check if user is an employee or  admin   
const roleEnum = require('../enums/roles');
const User = require('../models/user');
function authorize(rolesAllowed) {
    return (req, res, next) => {
        // Check if the user contains the required role
        if (!req.isAuthenticated()) {
            return res.json({ msg: 'Unauthorized, you are not logged in' });
        }
        //Get username and check role 
        const { username } = req.user;
        //Dont add call back to find one
        User.findOne({ username })
            .then(user => {
                if (!user) {
                    return res.json({ msg: 'Unauthorized, you are not logged in' });
                }
                const { role } = user;
                if (rolesAllowed.includes(role)) {
                    next();
                }
                else {
                    return res.json({ msg: 'Unauthorized,  you must have one of the following roles: ' + rolesAllowed });
                }
            })
            .catch(e => {
                console.log(e);
            });

    };
}
module.exports.authorize = authorize;