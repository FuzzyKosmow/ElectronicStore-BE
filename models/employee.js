const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { imageSchema } = require('./image');
const { cloudinary } = require('../cloudinary');
const User = require('./user');
const EmployeeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: false,
    },
    phoneNumber: {
        type: String,
        required: false,
    },
    birthDate: {
        type: Date,
        required: false,
    },
    gender: {
        type: String,
        required: false,
    },
    avatar: {
        type: Schema.Types.Mixed,
        required: false,
    },
    salary: {
        type: Number,
        default: 0,
        required: false,
    },
});
//Post middleware to delete image from cloudinary when employee is deleted.
EmployeeSchema.post('findOneAndDelete', async function (doc) {
    if (doc && doc.avatar && doc.avatar.fileName) {
        await cloudinary.uploader.destroy(doc.avatar.fileName, function (err, res) {

            if (err) {
                console.error("Error deleting image from cloudinary: ", err);

            }
            else {
                console.log("Image deleted from cloudinary: ", res);
            }
        });

        // Find account associated with employee using id
        const user = await User.findOne({ employeeId: doc._id });

        // Delete account
        if (user) {
            await User.findByIdAndDelete(user._id);

        }
        else
            console.log('No user found');
    }
    else {
        console.log('No image found');
    }
});
module.exports = mongoose.model('Employee', EmployeeSchema);
