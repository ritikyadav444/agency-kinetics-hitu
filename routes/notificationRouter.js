const express = require('express');
const { activateToken, verifyTeamEmail, loginCombined, getAllClient, getAllSuperAdmin, getAllTeam, logoutCombined, register, invite, createClient, deleteMembers, getAllUnderOne, updateClient, getClientDetails, updateTeam1, getTeamDetails, updatePassword, forgotPassword, resetPassword, getAllExceptClient } = require('../controller/combinedController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authentication');
const { createNotification, getAllNotificationForAUser, printAllNotifications, getAllNotificationUnderWorkspace, deleteNotificationById, deleteAllNotificationsForUser, markAllNotificationsAsRead } = require('../controller/notificationController');

const router = express.Router();

router.route("/notification/getAll").get(isAuthenticatedUser, printAllNotifications);
router.route("/notification/create").post(isAuthenticatedUser, createNotification);
router.route("/notification/getByUserId/:id").get(isAuthenticatedUser, getAllNotificationForAUser);
router.route("/notification/delete/:id").delete(isAuthenticatedUser, deleteNotificationById);
router.route("/notification/workspace/:workspaceName").get(isAuthenticatedUser, getAllNotificationUnderWorkspace);
router.route("/notification/deleteAll/:id").delete(isAuthenticatedUser, deleteAllNotificationsForUser);
router.route('/notifications/markAllAsRead/:userId').put(isAuthenticatedUser, markAllNotificationsAsRead);



module.exports = router