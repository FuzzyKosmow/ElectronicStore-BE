const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

mongoose.connect('mongodb://localhost:27017/electronicStore').then(() => {
    console.log('MongoDB connected');
    //Database connnected name
    console.log('Database name: ' + mongoose.connection.name);
}).catch((err) => {
    console.log(`MongoDB error: ${err}`);
});