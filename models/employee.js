const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ImageSchema } = require('./image');
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
        default: 'N/A',
    },
    phoneNumber: {
        type: String,
        required: false,
        default: 'N/A',
    },
    birthDate: {
        type: Date,
        required: false,
        default: Date.now,
    },
    gender: {
        type: String,
        required: false,
        default: 'N/A',
    },
    avatar: {
        type: Schema.Types.Mixed,
        required: false,
        default: null,
    },
    salary: {
        type: Number,
        default: 0,
        required: false,
    },
    position: {
        required: false,
        //Allow sale, warehouse, admin
        type: String,
        enum: ['sale', 'warehouse', 'admin'],
        default: 'sale',

    },
});
//Post middleware to delete image from cloudinary when employee is deleted.
EmployeeSchema.post('findOneAndDelete', async function (doc) {
    //Delete image from cloudinary
    if (doc && doc.avatar && doc.avatar.fileName) {
        await cloudinary.uploader.destroy(doc.avatar.fileName, function (err, res) {

            if (err) {
                console.error("Error deleting image from cloudinary: ", err);

            }
            else {
                console.log("Image deleted from cloudinary: ", res);
            }
        });


    }
    else {
        console.log('No image found');
    }
    //Delete associated account
    if (doc) {
        // Find account associated with employee using id
        const user = await User.findOne({ employeeId: doc._id });
        if (user) {
            await User.findByIdAndDelete(user._id);
            console.log('POST: Employee has account. Account username: ', user.username + '. Account deleted');
        }
        else
            console.log('No user found');
    }
});
module.exports = mongoose.model('Employee', EmployeeSchema);
