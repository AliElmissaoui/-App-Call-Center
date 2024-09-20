const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust path according to your project

// Configure the local strategy for passport
function configurePassport(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                // Find user by email
                const user = await User.findOne({ email });
                if (!user) {
                    return done(null, false, { message: 'No user with that email' });
                }

                // Compare password
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    return done(null, user); // Passwords match, user authenticated
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    // Serialize and deserialize user for session management
    passport.serializeUser((user, done) => done(null, user.id));

    // Updated with async/await for deserialization
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}

module.exports = configurePassport;
