const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
require('dotenv').config();
 const Routes = require('./src/routes/Routes');
 const configurePassport = require('./src/config/passport'); 
const methodOverride = require('method-override');

const app = express();

const port = process.env.PORT || 3001;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Call passport configuration
configurePassport(passport);

app.use((req, res, next) => {
    res.locals.user = req.user || null; // Pass req.user to all views
    next();
});
// Routes
 app.use('/', Routes);


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB Atlas:', err);
    });


    