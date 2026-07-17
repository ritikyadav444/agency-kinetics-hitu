const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceId: {
        type: Number,
    },
    client_name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        required: true,
    },
    // orderId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Order',
    //     required: true,
    // },
    orderIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
          required: true,
        },
      ],
    country: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    zip: {
        type: String,
    },
    currency: {
        type: String,
        default:'INR'
    },
    amount: {
        type: Number,
        required: true,
        default: 90,
        min: 0.01,
        max: 999999.99,
    },
    discount_percentage: {
        type: Number,
        required: true,
        default: 0
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    paid_amount: {
        type: Number,
        // required: true,
        default: 0
    },
    due_amount: {
        type: Number,
        // required: true,
        default: 0
    },
    total_amount: {
        type: Number,
        // required: true,
        default: 0
    },
    tax_percentage :{
        type:Number,
        default: 0
    },
    tax_amount :{
        type:Number,
        default: 0
    },
    status: {
        type: String,
        required: true,
        enum: ["Open", "Draft", "Paid", "Void", "Uncollectable"],
        default: "Draft"
    },
    terms: {
        type: String,
        required: true,
        default: "Please make the payment within 15 days from the creation date."
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
        default: Date.now()
    }

});

invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceId) {
        try {
            // Find the latest invoice within the same `createdUnder` scope
            const lastInvoice = await Invoice.findOne(
                { workspace_name: this.workspace_name },
                {},
                { sort: { invoiceId: -1 } }
            );
            // Set invoiceId based on the last invoice found within `createdUnder`
            this.invoiceId = lastInvoice ? lastInvoice.invoiceId + 1 : 1;
            console.log("Invoice created under:", this.createdUnder, "Invoice ID:", this.invoiceId);
        } catch (error) {
            console.error('Error finding last invoice:', error);
            next(error); // Handle the error to prevent saving without an `invoiceId`
        }
    }
    next();
});


const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;