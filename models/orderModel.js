const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        required: true,
    },
    subject: {
        type: String,
        // required: true,
        default: ''
    },
    orderId: {
        type: Number,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        required: true,
    },
    serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Service',
        required: true,
    },
    order_brief: {
        type: String,
    },
    attachment: {
        data: Buffer,
        contentType: String,
    },
    note: {
        type: String,
    },
    kick_off_date: {
        type: String,
        // default: Date.now
    },
    end_date: {
        type: String,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    budget: {
        type: Number,
        required: true,
        default: 1

    },
    status: {
        type: String,
        required: true,
        enum: ["Review", "Ongoing", "Cancelled", "Completed"],
        default: "Ongoing"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
    },
    workspace_name: {
        type: mongoose.Schema.Types.String,
        ref: 'Combined',
    },

});
orderSchema.pre('save', async function (next) {
    if (!this.orderId) {
        try {
            const lastOrder = await Order.findOne(
                { workspace_name: this.workspace_name },
                {},
                { sort: { orderId: -1 } }
            );
            this.orderId = lastOrder ? lastOrder.orderId + 1 : 1;
        } catch (error) {
            console.error('Error setting orderId for workspace:', error);
        }
    }
    next();
});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;