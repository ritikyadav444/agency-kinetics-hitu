const { body, validationResult } = require('express-validator');

// Runs after validation chains and returns 422 if any errors exist
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
};

const signupValidator = [
    body('fname').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
    body('lname').trim().optional({ checkFalsy: true }).isLength({ max: 50 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('workspace_name')
        .trim()
        .notEmpty().withMessage('Workspace name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Workspace name must be 2–50 characters')
        .matches(/^[a-zA-Z0-9 _-]+$/).withMessage('Workspace name may only contain letters, numbers, spaces, hyphens, and underscores'),
    body('password')
        .isLength({ min: 7 }).withMessage('Password must be at least 7 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    validate,
];

const loginValidator = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    body('workspace_name').trim().notEmpty().withMessage('Workspace name is required'),
    validate,
];

const forgotPasswordValidator = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('workspace_name').trim().notEmpty().withMessage('Workspace name is required'),
    validate,
];

const resetPasswordValidator = [
    body('password')
        .isLength({ min: 7 }).withMessage('Password must be at least 7 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    validate,
];

const inviteTeamValidator = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['ADMIN', 'ASSIGNEE', 'PROJECTMANAGER']).withMessage('Invalid role'),
    validate,
];

const createClientValidator = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('fname').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
    body('lname').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
    body('password')
        .isLength({ min: 7 }).withMessage('Password must be at least 7 characters'),
    validate,
];

module.exports = {
    signupValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    inviteTeamValidator,
    createClientValidator,
};
