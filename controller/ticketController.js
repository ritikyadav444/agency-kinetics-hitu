const Ticket = require("../models/ticketmodel");
const Order = require("../models/orderModel");
const Combined = require('../models/combinedModel');
const ErrorHander = require("../utils/errorHander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

//create Ticket
exports.createTicket = async (req, res, next) => {
    try {
        const combinedId = req.combinedId;
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        req.body.createdBy = combinedId;
        req.body.workspace_name = combinedWorkSpaceName;
        const body = req.body;

        const [clientPresent, teamPresent, orderPresent] = await Promise.all([
            Combined.exists({ _id: body.client_name }),
            Combined.exists({ _id: body.assignee }),
            Order.exists({ _id: body.orderId }),
        ]);

        if (!clientPresent) {
            return res.status(400).json({ success: false, message: 'Client not found. Unable to create the ticket.' });
        }
        if (!teamPresent) {
            return res.status(400).json({ success: false, message: 'Member not found. Unable to create the ticket.' });
        }
        if (!orderPresent) {
            return res.status(400).json({ success: false, message: 'Order not found. Unable to create the ticket.' });
        }

        const lastTicket = await Ticket.findOne(
            { workspace_name: combinedWorkSpaceName },
            {},
            { sort: { ticketId: -1 } }
        );
        body.ticketId = lastTicket && lastTicket.ticketId ? lastTicket.ticketId + 1 : 1;

        const ticket = await Ticket.create(body);
        res.status(201).json({ success: true, ticket });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ success: false, message: 'Internal server error while creating the ticket.' });
    }
};

// getAll
exports.getAllTicket = async (req, res) => {
    try {
        const combinedWorkSpaceName = req.combinedWorkSpaceName;
        const tickets = await Ticket.find({ workspace_name: combinedWorkSpaceName }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, tickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching tickets.' });
    }
};

// Get Ticket Details
exports.getTicketDetails = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return next(new ErrorHander("Ticket not found", 404));
        }
        res.status(200).json({ success: true, ticket });
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching ticket details.' });
    }
};

//update ticket
exports.updateTicket = async (req, res, next) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, workspace_name: combinedWorkSpaceName });
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket Not Found" });
        }

        ticket.status = req.body.status;
        if (req.body.status === "Closed") ticket.closedAt = Date.now();
        ticket.priority = req.body.priority;
        if (req.body.priority === "") ticket.changedAt = Date.now();
        ticket.subject = req.body.subject;
        ticket.description = req.body.description;

        await ticket.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, ticket });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ success: false, message: 'Internal server error while updating the ticket.' });
    }
};

//delete ticket
exports.deleteTicket = async (req, res) => {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    try {
        const ticket = await Ticket.findOne({ _id: req.params.id, workspace_name: combinedWorkSpaceName });
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        await ticket.deleteOne();
        res.status(200).json({ success: true, message: "Ticket deleted successfully" });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ success: false, message: 'Internal server error while deleting the ticket.' });
    }
};
