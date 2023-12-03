


module.exports.setCurrentUser = (req, res, next) => {
    res.locals.currentUser = req.user;
    //Print session
    next();
}

