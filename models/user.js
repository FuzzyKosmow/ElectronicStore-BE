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
//Post middleware to delete image from cloudinary when employee is deleted.
UserSchema.post('findOneAndDelete', async function (employee) {
    if (employee.avatar) {
        await cloudinary.uploader.destroy(employee.avatar.filename);
    }
});

module.exports = mongoose.model('User', UserSchema);