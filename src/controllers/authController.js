

const User = require('../models/User');
const bcrypt = require('bcrypt');
const passport = require('passport');


const hashPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};


const comparePassword = async (plainTextPassword, hashedPassword) => {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
};

const registerUser = async (req, res) => {
    try {
        const { password, email } = req.body;

      
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

     
        const hashedPassword = await hashPassword(password);

      
        if (typeof hashedPassword !== 'string') {
            throw new Error('Failed to hash password');
        }

  
        const newUser = new User({
            password: hashedPassword,
            email,
         
        });

       
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};





const renderLoginPage = async (req, res) => {
    res.render('auth/login',{ layout: false });
};


const renderRegisterPage = async (req, res) => {
    res.render('auth/register');
};

const renderProfile = async (req, res) => {
    try {
        res.render('pages/profile/edit', {
            currentPage: "profile",
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        req.flash('error', 'Internal Server Error');
        res.redirect('back');
    }
};

const editProfile = async (req, res) => {
    try {
        const { name, phone, email, password, passwordconfirmation } = req.body;

     
        const user = await User.findById(req.user.id);

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/profile');
        }


        if (password || passwordconfirmation) {
            if (password !== passwordconfirmation) {
                req.flash('error', 'Passwords do not match');
                return res.redirect('/profile'); 
            }

           
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

     
        user.name = name || user.name;
        user.phone = phone || user.phone;

        if (email && user.email !== email) {
            user.email = email;
        }

      
        await user.save();
        req.flash('success', 'Profile updated successfully');
        res.redirect('/profile'); 

    } catch (err) {
        req.flash('error', 'An error occurred while updating profile');
        console.error(err);
        res.redirect('/profile');
    }
};



const logoutUser = (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'You have successfully logged out');
        res.redirect('/login');
    });
};
module.exports = {
    registerUser,
    renderLoginPage,
    logoutUser,
    renderRegisterPage,
    renderProfile,
    editProfile
};
