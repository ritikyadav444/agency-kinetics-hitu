const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    
    ticketId: {
        type: Number,
    },
    client_name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        required: true,
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    subject: {
        type: String,
        // required: true,
        default: ''

    },
    description: {
        type: String,
    },
    status: {
        type: String,
        required: true,
        enum: ["Open", "Hold", "Close"],
        default: "Open"
    },
    priority: {
        type: String,
        required: true,
        enum: ["Normal", "High", "Highest", "Low", "Lowest"],
        default: "Normal"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
    },
    workspace_name: {
        type: mongoose.Schema.Types.String,
        ref: 'Combined',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

ticketSchema.pre('save', async function (next) {
    if (!this.ticketId) {
        try {
            // Find the last ticket in the same workspace
            const lastTicket = await Ticket.findOne(
                { workspace_name: this.workspace_name },
                {},
                { sort: { ticketId: -1 } }
            );
            // Set ticketId to the next value in the sequence for the workspace
            this.ticketId = lastTicket && lastTicket.ticketId ? lastTicket.ticketId + 1 : 1;
        } catch (error) {
            console.error('Error finding last ticket:', error);
            next(error); // Pass error to avoid saving without a `ticketId`
        }
    }
    next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;