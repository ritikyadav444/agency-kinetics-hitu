const express = require('express');
const { isAuthenticatedUser } = require('../middleware/authentication');
const { createTicket, getAllTicket, deleteTicket, updateTicket, getTicketDetails } = require('../controller/ticketController');
const router = express.Router();



router.route("/new/ticket").post(isAuthenticatedUser, createTicket)
router.route("/ticket/:id").get(isAuthenticatedUser, getTicketDetails);
router.route("/tickets").get(isAuthenticatedUser, getAllTicket)
router.route("/ticket/delete/:id").delete(isAuthenticatedUser, deleteTicket)
router.route("/ticket/update/:id").put(isAuthenticatedUser, updateTicket)



module.exports = router;