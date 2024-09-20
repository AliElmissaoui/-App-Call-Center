const { check, validationResult } = require('express-validator');
const validateInputCalls = [
   
    check('callerName')
        .notEmpty().withMessage('Caller Name is required')
        .isString().withMessage('Caller Name must be a string'),
    check('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    check('duration')
        .notEmpty().withMessage('Duration is required')
        .isString().withMessage('Duration must be a string'),
    check('subject')
        .notEmpty().withMessage('Subject is required')
        .isString().withMessage('Subject must be a string'),
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

const validateEditInputCalls = [
   
    check('callerName')
        .notEmpty().withMessage('Caller Name is required')
        .isString().withMessage('Caller Name must be a string'),
    check('duration')
        .notEmpty().withMessage('Duration is required')
        .isString().withMessage('Duration must be a string'),
    check('subject')
        .notEmpty().withMessage('Subject is required')
        .isString().withMessage('Subject must be a string'),
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


module.exports = {validateInputCalls,validateEditInputCalls};
