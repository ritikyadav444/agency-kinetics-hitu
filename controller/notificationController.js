const Notification = require("../models/notificationModel");
const Combined = require('../models/combinedModel');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');

exports.createNotification = catchAsyncErrors(async(req, res, next) => {
    try {
        const { userId, message, routeLink } = req.body;
        const combinedId = req.combinedId;
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        // Create a new notification
        const notification = new Notification({
          userId,
          message,
          routeLink,
          workspace_name:combinedWorkSpaceName
        });
        
        // Save the notification to the database
        await notification.save();
    
        res.status(201).json({ success: true, notification });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    }
);

exports.getAllNotificationForAUser = catchAsyncErrors(async(req, res, next) => {
    try {
        const userId = req.params.id;
        const targetUser = await Combined.findOne({ _id: userId, workspace_name: req.combinedWorkSpaceName });
        if (!targetUser) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        const notifications = await Notification.find({ userId });
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

exports.getAllNotificationUnderWorkspace = catchAsyncErrors(async(req, res, next) => {
    try {
        const workspaceName = req.combinedWorkSpaceName;
        const usersInWorkspace = await Combined.find({ workspace_name: workspaceName }, '_id');
        const userIds = usersInWorkspace.map(u => u._id);
        const notifications = await Notification.find({ userId: { $in: userIds } });
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

exports.markAllNotificationsAsRead = catchAsyncErrors(async (req, res, next) => {
    const userId = req.combinedId;
    try {
      await Notification.updateMany({ userId }, { markAsRead: true });
      const notifications = await Notification.find({ userId });
      res.status(200).json({ success: true, notifications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });


exports.printAllNotifications = async (req, res, next) => {
    try {
        const usersInWorkspace = await Combined.find({ workspace_name: req.combinedWorkSpaceName }, '_id');
        const userIds = usersInWorkspace.map(u => u._id);
        const notifications = await Notification.find({ userId: { $in: userIds } });
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



exports.deleteNotificationById = catchAsyncErrors(async (req, res, next) => {
    try {
        const notificationId = req.params.id; 
        const deletedNotification = await Notification.findByIdAndDelete(notificationId);

        if (!deletedNotification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Fetch the remaining notifications for the user
        const remainingNotifications = await Notification.find({ userId: deletedNotification.userId });

        res.status(200).json({ success: true, notifications: remainingNotifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


exports.deleteAllNotificationsForUser = catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.combinedId;
      await Notification.deleteMany({ userId });
      res.status(200).json({ success: true, message: "Notifications deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  





