const express = require('express');
const { isAuthenticatedUser } = require('../middleware/authentication');
const { getTransactionDetails, getPaymentMethodDetails } = require('../controller/stripeController');

const router = express.Router();


router.route("/transactions-by-email").get(isAuthenticatedUser, getTransactionDetails);
router.route("/payment-method-details").get(isAuthenticatedUser, getPaymentMethodDetails);




module.exports = router