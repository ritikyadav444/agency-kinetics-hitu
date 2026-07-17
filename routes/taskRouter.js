const express = require('express');
const { getAllQuotes, createQuote, updateQuote, deleteQuote } = require('../controller/quoteController');
const { isAuthenticatedClient, authorizeRolesClient, isAuthenticatedUser, authorizeRoles } = require('../middleware/authentication');
const { createTask, getAllTasks, deleteTask, updateTask, getTaskDetails, getTaskByOrderId, getTasksForAClient } = require('../controller/taskController');

const router = express.Router();

router.route("/order/:orderId/task/new").post(isAuthenticatedUser, createTask)
router.route("/client/:userId/tasks").get(getTasksForAClient)
router.route("/tasks").get(isAuthenticatedUser, getAllTasks)
router.route("/task/order/:id").get(isAuthenticatedUser, getTaskByOrderId)

router.route("/task/:id").get(isAuthenticatedUser, getTaskDetails)



router.route("/order/:orderId/task/delete/:id").delete(isAuthenticatedUser, deleteTask)
router.route("/order/:orderId/task/update/:id").put(isAuthenticatedUser, updateTask)


module.exports = router