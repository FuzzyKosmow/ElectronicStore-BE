const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
function IsValidObjectId(req, res, next) {
  const { error } = Joi.objectId().validate(req.params.id);

  if (error) {
    console.log("Invalid object id. Made to:" + req.method + " " + req.originalUrl);
    return res.status(400).json({
      error: error.details[0].message,
      success: false
    });
  }
  next();
}

module.exports = IsValidObjectId;