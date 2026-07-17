const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    assigneeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    task_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    priority: {
        type: String,
        required: true,
        enum: ["Normal", "High", "Highest", "Low", "Lowest"],
        default: "Normal"
    },
    kick_off_date: {
        type: String,
    },
    end_date: {
        type: String,
    },
    status: {
        type: String,
        required: true,
        enum: ["To Do", "In Progress", "Done"],
        default: "Progress"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    workspace_name: {
        type: mongoose.Schema.Types.String,
        ref: 'Combined',
        // required: true,
    },
});

taskSchema.index({ workspace_name: 1, orderId: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;