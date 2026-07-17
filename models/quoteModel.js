const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    quoteId: {
        type: Number,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        // required: true,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        // required: true,
    },

    order_brief: {
        type: String,
        // required: [true, 'Order Brief Required'],
        default:""
    },
    attachment: {
        type: String,
    } || null || undefined,

    quantity: {
        type: Number,
        // required: true,
        default: 1
    },
    budget: {
        type: Number,
        // required: true,
        default: 1
    },
    value: {
        type: Number,
        // required: true,
        default: 1
    },
    unit: {
        type: String,
        enum: ['Days', 'Weeks', 'Months'],
        // required: true,
        default: "Days"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    selected: {
        type: String,
        enum: ['Accepted', 'Rejected', 'Pending'],
        // required: true,
        default: "Pending"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
    },
    workspace_name: {
        type: mongoose.Schema.Types.String,
        ref: 'User',

    },
});

quoteSchema.pre('save', async function (next) {
    if (!this.quoteId) {
        try {
            // Filter by `workspace_name` to find the last quote in that workspace
            const lastQuote = await Quote.findOne(
                { workspace_name: this.workspace_name },
                {},
                { sort: { quoteId: -1 } }
            );
            // Set quoteId based on the last quote found within `workspace_name`
            this.quoteId = lastQuote ? lastQuote.quoteId + 1 : 1;
            console.log("Quote for workspace:", this.workspace_name, "Quote ID:", this.quoteId);
        } catch (error) {
            console.error('Error finding last quote:', error);
            next(error); // Handle the error to prevent saving without a `quoteId`
        }
    }
    next();
});


const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;