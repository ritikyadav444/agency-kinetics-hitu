// subscriptionRoutes.js

const express = require('express');
const router = express.Router();
const { getSubscriptionDetails } = require('../controller/subscriptionController');
const { isAuthenticatedUser } = require('../middleware/authentication');

router.get('/subscription/:userId', isAuthenticatedUser, getSubscriptionDetails);

module.exports = router;
