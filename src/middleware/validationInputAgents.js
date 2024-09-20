const { check, validationResult } = require('express-validator');
const User = require('../models/User');

const validateEmail = async (value) => {
    const existingUser = await User.findOne({ email: value });
    if (existingUser) {
        throw new Error('Email is already in use');
    }
};

const validateInputAgents = [
    check('name').notEmpty().withMessage('Name is required'),
    check('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .custom(validateEmail).withMessage('Email is already in use'),
        check('phone')
        .notEmpty().withMessage('Phone number is required')
        .isNumeric().withMessage('Phone number must contain only numbers')
        .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits long'),
    check('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    check('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                console.log(value)
                console.log(req.body.password)
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            errors.array().forEach(error => {
                req.flash('error', error.msg);
            });
            return res.redirect('back');
        }
        next();
    }
];


const validateInputEditAgents = [
    check('name').notEmpty().withMessage('Name is required'),
        check('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address'),
        check('phone')
        .notEmpty().withMessage('Phone number is required')
        .isNumeric().withMessage('Phone number must contain only numbers')
        .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits long'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            errors.array().forEach(error => {
                req.flash('error', error.msg);
            });
            return res.redirect('back');
        }
        next();
    }
];

module.exports = {validateInputAgents,validateInputEditAgents};