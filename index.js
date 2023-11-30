const express = require('express');
const app = express();
const port = 3000;
const usersRouter = require('./routes/users');
const employeesRouter = require('./routes/employees');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const { setCurrentUser } = require('./middleware');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');
const dotenv = require('dotenv').config();
const RedisStore = require("connect-redis").default
const createClient = require('redis').createClient;
const redisClient = createClient(
    {
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            connectTimeout: 50000,
        }
    }
)

redisClient.connect().then(() => {
    console.log('Redis connected');
}).catch((err) => {
    console.log(`Redis error: ${err}`);
});

// Redis store
const store = new RedisStore({
    client: redisClient,
})  // Redis store

//Setting up session 
const sessionConfig = {
    store,
    secret: "SECRETSAUCE",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + (1000 * 60 * 60 * 24 * 7), // 1 week
        maxAge: (1000 * 60 * 60 * 24 * 7)
    }
}
app.use(setCurrentUser);
app.use(session(sessionConfig));

//Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())
app.use(passport.initialize());
app.use(passport.session());

//Setting up views and resources setting 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(morgan('tiny'));


//Routes
// app.use('/products', productsRouter);
// app.use('/customers', customersRouter);
// app.use('/orders', ordersRouter);
app.use('/employees', employeesRouter);
app.use('/', usersRouter);
app.all('*', (req, res, next) => {
    console.log("Request made to: ", req.originalUrl);
    next(new ExpressError('Page not found', 404));
});
//Error handling
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    console.log("Error message: ", err.message);
    if (!err.message) err.message = 'Oh no, something went wrong!';
    res.status(statusCode).json({ error: err.message, statusCode: statusCode });
});




//MongoDB connection. 
mongoose.connect(process.env.MONGO_DB_LOCAL)
    .then(() => {
        console.log('MongoDB connected');
        //Database connnected name
        console.log('Database name: ' + mongoose.connection.name);
    }).catch((err) => {
        console.log(`MongoDB error: ${err}`);
    });


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});