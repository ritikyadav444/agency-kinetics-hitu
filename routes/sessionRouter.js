

const express = require('express');
const router = express.Router();
const { authorizeRoles, isAuthenticatedClient, isAuthenticatedUser, authorizeRolesClient, } = require("../middleware/authentication");


// Route handler to check session activity
router.get('/checkSession', (req, res) => {
    if (req.cookies.user) {
        res.status(200).json({ success: true, message: 'Session is active.' });
    } else {
        res.status(200).json({ success: false, message: 'Session is inactive or expired. Please log in again.' });
    }
});

module.exports = router;
