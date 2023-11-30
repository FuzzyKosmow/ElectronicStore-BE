const express = require('express');
const app = express();
const User = require('../models/user');
const ExpressError = require('../utils/ExpressError');
const router = express.Router();
const passport = require('passport');
const { storeReturnTo } = require('../middleware');
const usersController = require('../controllers/users');
const { alreadyLoggedIn, requireLogginEmployee } = require('../middleware');

router.route('/register')
    .post(usersController.registerEmployee);
router.route('/login')
    .post(usersController.login);
router.route('/register/admin')
    .post(usersController.registerAdmin);
router.post('/logout', usersController.logout);
router.get('/', (req, res) => {
    res.send('Hello. User : ' + req.user);
})


module.exports = router;