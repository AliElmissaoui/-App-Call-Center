const { check, validationResult } = require('express-validator');
const Call = require('../models/Call'); 

const validateInputTickets = [
    check('callId')
        .notEmpty().withMessage('Call Code is required')
        .custom(async (value) => {
            const call = await Call.findById(value);
            if (!call) {
                throw new Error('Invalid Call Code');
            }
            return true;
        }),
    check('problemDescription')
        .notEmpty().withMessage('Problem Description is required')
        .isString().withMessage('Problem Description must be a string'),
    check('status')
        .optional()
        .isIn(['open', 'in-progress', 'resolved']).withMessage('Invalid status'),
    check('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
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

const validateEditTickets = [
    check('problemDescription')
        .notEmpty().withMessage('Problem Description is required')
        .isString().withMessage('Problem Description must be a string'),
    check('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['open', 'in-progress', 'resolved']).withMessage('Invalid status'),
    check('priority')
        .notEmpty().withMessage('Priority is required')
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
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

module.exports = {validateInputTickets,validateEditTickets};
