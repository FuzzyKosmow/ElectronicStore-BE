const express = require('express');
const app = express();
const User = require('../models/user');
const ExpressError = require('../utils/ExpressError');
const router = express.Router();
const passport = require('passport');
const usersController = require('../controllers/users');
const { getCurrentUser } = require('../middleware/auth');

router.route('/register')
    .post(usersController.registerEmployee);
router.route('/login')
    .get(getCurrentUser)
    .post(usersController.login);

router.post('/logout', usersController.logout);
//Register admin only in development
if (process.env.NODE_ENV !== "production") {
    router.route('/register/admin')
        .post(usersController.registerAdmin);
};
router.get('/', (req, res) => {

})


module.exports = router;