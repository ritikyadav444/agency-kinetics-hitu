const express = require('express');
const { getAllInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceDetails, payInvoice } = require('../controller/invoiceController');
const { isAuthenticatedUser } = require('../middleware/authentication');

const router = express.Router();


router.route("/invoices").get(isAuthenticatedUser, getAllInvoices);
router.route("/invoice/:id").get(isAuthenticatedUser, getInvoiceDetails);
router.route("/new/invoice").post(isAuthenticatedUser, createInvoice);
router.route("/invoice/delete/:id").delete(isAuthenticatedUser, deleteInvoice)
router.route("/invoice/update/:id").put(isAuthenticatedUser, updateInvoice)
router.route("/invoice/pay/:id").post(isAuthenticatedUser, payInvoice)


module.exports = router