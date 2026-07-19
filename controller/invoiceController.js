const Invoice = require("../models/invoiceModel");
const Combined = require('../models/combinedModel');
const Order = require("../models/orderModel");
const ErrorHander = require("../utils/errorHander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

//create invoice
exports.createInvoice = async (req, res, next) => {
  try {
    const body = req.body;
    const combinedWorkSpaceName = req.combinedWorkSpaceName;

    const clientPresent = await Combined.exists({ _id: body.client_name });
    if (!clientPresent) {
      return res.status(400).json({ success: false, message: 'Client not found. Unable to create the invoice.' });
    }

    const orderPresent = await Order.find({ _id: { $in: body.orderIds } });
    if (orderPresent.length !== body.orderIds.length) {
      return res.status(400).json({ success: false, message: 'One or more orders not found. Unable to create the invoice.' });
    }

    body.createdBy = req.combinedId;
    body.workspace_name = combinedWorkSpaceName;

    const lastInvoice = await Invoice.findOne(
      { workspace_name: combinedWorkSpaceName },
      {},
      { sort: { invoiceId: -1 } }
    );
    body.invoiceId = lastInvoice ? lastInvoice.invoiceId + 1 : 1;

    const invoice = await Invoice.create(body);
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: 'Internal server error while creating invoice.' });
  }
};

//get Invoice details
exports.getInvoiceDetails = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching invoice details.' });
  }
};

//getAll
exports.getAllInvoices = async (req, res) => {
  try {
    const combinedWorkSpaceName = req.combinedWorkSpaceName;
    const invoices = await Invoice.find({ workspace_name: combinedWorkSpaceName }).sort({ invoiceId: -1 });
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching invoices.' });
  }
};

//update invoice
exports.updateInvoice = async (req, res, next) => {
  const combinedWorkSpaceName = req.combinedWorkSpaceName;
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, workspace_name: combinedWorkSpaceName });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const updated = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });

    res.status(200).json({ success: true, invoice: updated });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: 'Internal server error while updating invoice.' });
  }
};

//delete invoice
exports.deleteInvoice = async (req, res, next) => {
  const combinedWorkSpaceName = req.combinedWorkSpaceName;
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, workspace_name: combinedWorkSpaceName });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    await invoice.deleteOne();
    res.status(200).json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: 'Internal server error while deleting invoice.' });
  }
};

exports.payInvoice = async (req, res, next) => {
  const { id } = req.params;
  const combinedWorkSpaceName = req.combinedWorkSpaceName;
  const { userEmail } = req.body;
  const invoice = await Invoice.findOne({ _id: id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }
  const invoiceId = invoice.invoiceId;
  const amountToCharge = Math.round(invoice.total_amount * 100);
  const superAdmin = await Combined.findOne({ role: "SUPERADMIN", workspace_name: combinedWorkSpaceName });

  if (!superAdmin) {
    return res.status(404).json({ success: false, message: "SuperAdmin not found in the specified workspace" });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Payment for Invoice #${invoiceId}` },
          unit_amount: amountToCharge,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: userEmail,
      success_url: `${process.env.FRONTEND_URL}/invoices`,
      cancel_url: `${process.env.FRONTEND_URL}/invoices`,
      payment_intent_data: {
        transfer_data: { destination: superAdmin.stripeAccountId },
      },
    });

    res.status(200).json({ success: true, message: 'Redirecting to payment...', url: session.url });
  } catch (error) {
    console.error('Error in payInvoice:', error);
    res.status(500).json({ success: false, message: "Server error.", error: error.message });
  }
};
