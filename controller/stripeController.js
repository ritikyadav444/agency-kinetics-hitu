const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Combined = require('../models/combinedModel');

exports.getTransactionDetails = async (req, res) => {
  try {
    const { email, workspace_name } = req.query;

    if (!email || !workspace_name) {
      return res.status(400).json({ error: "Email and workspace_name are required in query params." });
    }

    if (req.combinedEmail !== email) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const user = await Combined.findOne({ email, workspace_name });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: "User or Stripe customer ID not found." });
    }

    const customerId = user.stripeCustomerId;

    const charges = await stripe.charges.list({
      limit: 100,
      customer: customerId,
    });

    const formattedCharges = charges.data.map((charge) => ({
      amount: charge.amount / 100,
      created: new Date(charge.created * 1000).toLocaleDateString(),
      currency: charge.currency,
      receipt_url: charge.receipt_url,
      id: charge.id,
      description: charge.description
    }));

    res.json({
      success: true,
      count: formattedCharges.length,
      charges: formattedCharges,
    });

  } catch (error) {
    console.error("Error fetching Stripe transactions:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentMethodDetails = async (req, res) => {
  try {
    const { email, workspace_name } = req.query;

    if (!email || !workspace_name) {
      return res.status(400).json({ error: "Email and workspace_name are required in query params." });
    }

    if (req.combinedEmail !== email) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const user = await Combined.findOne({ email, workspace_name });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: "User or Stripe customer ID not found." });
    }

    const customerId = user.stripeCustomerId;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 100, // Increase limit if many cards are saved
    });

    const seen = new Set();
    const formattedPaymentMethod = [];

    for (const pm of paymentMethods.data) {
      const key = `${pm.card.brand}-${pm.card.last4}`;
      if (!seen.has(key)) {
        seen.add(key);
        formattedPaymentMethod.push({
          brand: pm.card.brand,
          created: new Date(pm.created * 1000).toLocaleDateString(),
          last4: pm.card.last4,
          id: pm.id,
          name: pm.billing_details.name,
        });
      }
    }

    res.json({
      success: true,
      count: formattedPaymentMethod.length,
      payment_methods: formattedPaymentMethod,
    });

  } catch (error) {
    console.error("Error fetching Stripe payment methods:", error.message);
    res.status(500).json({ error: error.message });
  }
};
