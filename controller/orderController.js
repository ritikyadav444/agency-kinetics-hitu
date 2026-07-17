const Order = require("../models/orderModel");
const Combined = require('../models/combinedModel')
const Service = require("../models/serviceModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHander = require("../utils/errorHander");

//create order
exports.createOrder = async (req, res, next) => {
    try {
        const body = req.body;
        const combinedId = req.combinedId;
        const combinedWorkSpaceName = req.combinedWorkSpaceName;

        req.body.createdBy = combinedId;
        req.body.workspace_name = combinedWorkSpaceName;

        const [clientPresentInCombined, servicePresent, teamPresent] = await Promise.all([
            Combined.exists({ _id: body.clientId }),
            Service.exists({ _id: body.serviceId }),
            Combined.exists({ _id: body.assignee }),
        ]);

        if (!clientPresentInCombined) {
            return res.status(400).json({ success: false, message: 'Client not found. Unable to create the order.' });
        }
        if (!servicePresent) {
            return res.status(400).json({ success: false, message: 'Service not found. Unable to create the order.' });
        }
        if (!teamPresent) {
            return res.status(400).json({ success: false, message: 'Member not found. Unable to create the order.' });
        }

        const order = await Order.create(body);
        res.status(201).json({ success: true, order });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//getAll
exports.getAllOrders = async (req, res) => {
    try {
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        const orders = await Order.find({ workspace_name: combinedWorkSpaceName }).sort({ orderId: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//get Order Details
exports.getOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHander("Order not found", 404));
    }
    res.status(200).json({ success: true, order });
});

//get Order For A particular Client
exports.getOrdersByClientId = async (req, res, next) => {
    try {
        const clientId = req.query.clientId;
        const combinedWorkspaceName = req.combinedWorkSpaceName;

        if (!clientId) {
            return res.status(400).json({ success: false, message: "Client ID is required" });
        }

        const orders = await Order.find({ clientId, workspace_name: combinedWorkspaceName });

        if (!orders.length) {
            return res.status(404).json({ success: false, message: "No orders found for this client" });
        }

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders for client:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//update order — single write (P13)
exports.updateOrder = async (req, res, next) => {
    const combinedWorkspaceName = req.combinedWorkSpaceName;
    try {
        const order = await Order.findOne({ _id: req.params.id, workspace_name: combinedWorkspaceName });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order Not Found" });
        }

        if (order.status === "Completed" || order.status === "Cancelled") {
            return next(new ErrorHander("You cannot modify a completed or cancelled order"));
        }

        const update = { ...req.body };
        if (req.body.status === "Completed") update.completedAt = Date.now();

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: req.params.id, workspace_name: combinedWorkspaceName },
            { $set: update },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//delete order
exports.deleteOrder = async (req, res, next) => {
    const combinedWorkspaceName = req.combinedWorkSpaceName;
    try {
        const order = await Order.findOne({ _id: req.params.id, workspace_name: combinedWorkspaceName });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order Not found" });
        }

        await order.deleteOne();
        res.status(200).json({ success: true, message: "Order Deleted Successfully" });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getOrderDetailsForTickets = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    try {
        const orders = await Order.find(
            { workspace_name: combinedWorkSpaceName },
            '_id orderId'
        ).sort({ orderId: -1 }).lean();

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching order details for tickets:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getOrderDetailsForInvoices = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    try {
        const orders = await Order.find(
            { workspace_name: combinedWorkSpaceName },
            '_id orderId serviceId quantity budget'
        ).sort({ orderId: -1 }).lean();

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching order details for invoices:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
