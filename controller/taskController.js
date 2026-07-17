const Order = require("../models/orderModel");
const Task = require("../models/taskModel");
const ErrorHander = require("../utils/errorHander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Combined = require("../models/combinedModel");

//create task
exports.createTask = async (req, res, next) => {
    try {
        const combinedId = req.combinedId;
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        req.body.createdBy = combinedId;
        req.body.workspace_name = combinedWorkSpaceName;

        const user = await Combined.findOne({ _id: req.body.assigneeId });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Assignee not found.' });
        }

        const allowedRoles = ['ADMIN', 'SUPERADMIN', 'PROJECTMANAGER', 'ASSIGNEE'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(400).json({ success: false, message: 'Assignee role is not permitted.' });
        }

        const task = await Task.create(req.body);
        res.status(201).json({ success: true, task });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ success: false, message: 'Error creating task.' });
    }
};

//get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        const tasks = await Task.find({ workspace_name: combinedWorkSpaceName });
        res.status(200).json({ success: true, tasks });
    } catch (error) {
        console.error('Error fetching all tasks:', error);
        res.status(500).json({ success: false, message: 'Error fetching tasks.' });
    }
};

exports.getTaskByOrderId = async (req, res) => {
    try {
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        const tasks = await Task.find({ workspace_name: combinedWorkSpaceName, orderId: req.params.id });
        res.status(200).json({ success: true, tasks });
    } catch (error) {
        console.error('Error fetching tasks details', error);
        res.status(500).json({ success: false, message: 'Error fetching tasks by order ID.' });
    }
};

exports.getTasksForAClient = async (req, res) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const userId = req.params.userId;
    try {
        const orders = await Order.find({ workspace_name: combinedWorkSpaceName, clientId: userId });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: 'No orders found for the user.' });
        }

        const orderIds = orders.map(order => order._id);
        const tasks = await Task.find({ workspace_name: combinedWorkSpaceName, orderId: { $in: orderIds } });
        res.status(200).json({ success: true, tasks });
    } catch (error) {
        console.error('Error fetching tasks for user:', error);
        res.status(500).json({ success: false, message: 'Error fetching tasks for the user.' });
    }
};

exports.getTaskDetails = catchAsyncErrors(async (req, res, next) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return next(new ErrorHander("task not found", 404));
    }
    res.status(200).json({ success: true, task });
});

//update Task — single write (P14)
exports.updateTask = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, workspace_name: combinedWorkSpaceName },
            req.body,
            { new: true, runValidators: true }
        );
        if (!task) {
            return res.status(404).json({ success: false, message: "Task Not Found" });
        }
        res.status(200).json({ success: true, task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ success: false, message: 'Error updating task.' });
    }
};

//delete Task
exports.deleteTask = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    try {
        const task = await Task.findOne({ _id: req.params.id, workspace_name: combinedWorkSpaceName });
        if (!task) {
            return res.status(404).json({ success: false, message: "Task Not found" });
        }

        await task.deleteOne();
        res.status(200).json({ success: true, message: "Task Deleted Successfully" });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, message: 'Error deleting task.' });
    }
};
