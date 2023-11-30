const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const UserSchema = new Schema({
    // Has default user name and stuffs
    role: {
        type: String,
        enum: ['employee', 'admin'],
        default: 'employee',
        required: true
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    }
});


UserSchema.plugin(passportLocalMongoose);
//Modify serialize and deserialize to include a role

module.exports = mongoose.model('User', UserSchema);