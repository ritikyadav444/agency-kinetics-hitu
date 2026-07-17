const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Combined', // Assuming you have a User model
    required: true
  },
  message: {
    type: String,
    required: true
  },
  workspace_name: {
    type: String

  },
    createdAt: {
      type: Date,
      default: Date.now
    },
    markAsRead: {
      type: Boolean,
      default: false,
    },
    routeLink: {
      type: String,
    }

});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
