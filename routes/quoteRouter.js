const express = require('express');
const { getAllQuotes, createQuote, updateQuote, deleteQuote, getQuoteDetails } = require('../controller/quoteController');
const { isAuthenticatedClient, authorizeRolesClient, authorizeRoles, isAuthenticatedUser } = require('../middleware/authentication');

const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/quotes").get(isAuthenticatedUser, getAllQuotes);
router.route("/quote/:id").get(isAuthenticatedUser, getQuoteDetails);
router.route("/quotes/client").get(isAuthenticatedUser, getAllQuotes);
router.route("/new/quote").post(upload.single('attachment'), isAuthenticatedUser, createQuote);
router.route("/quote/update/:id").put(isAuthenticatedUser, updateQuote)
router.route("/quote/delete/:id").delete(isAuthenticatedUser, deleteQuote)


module.exports = router