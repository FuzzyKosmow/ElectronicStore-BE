const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Gender = require('../enums/gender');
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
    avatar: { //URL
        type: String,
        required: false,
    },
});

module.exports = mongoose.model('Employee', EmployeeSchema);
