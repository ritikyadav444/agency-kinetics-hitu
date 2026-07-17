const express = require('express');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authentication');
const { addOrUpdatePlanWithSync, handlePaymentSuccess, handlePaymentFailure, createAccountLink } = require('../controller/paymentController');

const router = express.Router();

router.route("/activate-plan").post(isAuthenticatedUser, addOrUpdatePlanWithSync);

router.route('/success').get(isAuthenticatedUser, handlePaymentSuccess);
router.route('/cancel').get(isAuthenticatedUser, handlePaymentFailure);
router.route('/create-account-link').post(isAuthenticatedUser, createAccountLink);
module.exports = router;