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
router.route('/register/admin')
    .post(usersController.registerAdmin);
router.post('/logout', usersController.logout);
router.get('/', (req, res) => {

})


module.exports = router;