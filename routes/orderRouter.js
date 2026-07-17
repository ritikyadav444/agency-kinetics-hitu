const express = require('express');
const { getAllOrders, createOrder, updateOrder, deleteOrder, getOrderDetails, getOrdersByClientId, getOrderDetailsForTickets, getOrderDetailsForInvoices } = require('../controller/orderController');
const { authorizeRoles, isAuthenticatedUser } = require('../middleware/authentication');

const router = express.Router();


router.route("/orders").get(isAuthenticatedUser, getAllOrders);
router.route("/order/:id").get(isAuthenticatedUser, getOrderDetails);
router.route("/ordersForAClient").get(isAuthenticatedUser, getOrdersByClientId);
router.route("/new/order").post(isAuthenticatedUser, createOrder);
router.route("/order/delete/:id").delete(isAuthenticatedUser, deleteOrder)
router.route("/order/update/:id").put(isAuthenticatedUser, updateOrder)
router.route("/ordersForTickets").get(isAuthenticatedUser, getOrderDetailsForTickets);
router.route("/ordersForInvoices").get(isAuthenticatedUser, getOrderDetailsForInvoices);



module.exports = router