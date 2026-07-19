const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const Combined = require('../models/combinedModel');
const Subscription = require("../models/subscriptionModel");

const pricingDetails = {
    'Monthly': [
        { price: 9, maxTeamMembers: 3, type: 'Essential' },
        { price: 39, maxTeamMembers: 10, type: 'Professional' },
        { price: 119, maxTeamMembers: 25, type: 'Elite' }
    ],
    'Yearly': [
        { price: 72, maxTeamMembers: 3, type: 'Essential' },
        { price: 348, maxTeamMembers: 10, type: 'Professional' },
        { price: 1188, maxTeamMembers: 25, type: 'Elite' }
    ]
};

exports.addOrUpdatePlanWithSync = async (req, res) => {

    const userId = req.combinedId ? req.combinedId : null;
    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    const { playRecursion, selectedPlanIndex } = req.body;

    if (!['Monthly', 'Yearly'].includes(playRecursion)) {
        return res.status(400).json({
            success: false,
            message: "Invalid playRecursion type. Allowed values are 'Monthly' or 'Yearly'."
        });
    }

    if (typeof selectedPlanIndex !== 'number' || selectedPlanIndex < 0 || selectedPlanIndex >= pricingDetails[playRecursion].length) {
        return res.status(400).json({
            success: false,
            message: "Invalid selected plan index."
        });
    }

    try {
        const superAdmin = await Combined.findById(userId);
        if (!superAdmin) {
            return res.status(404).json({ success: false, message: "SuperAdmin not found" });
        }

        let customerId = superAdmin?.stripeCustomerId;

        if (!customerId) {
        const customer = await stripe.customers.create({
            email: superAdmin.email,
            name: superAdmin.fname + ' ' + superAdmin.lname,
            metadata: {
            userId: userId.toString(),
            workspace_name: superAdmin.workspace_name
            }
        });
        customerId = customer.id;

        superAdmin.stripeCustomerId = customerId;
        await superAdmin.save();
        }

        const activePlan = superAdmin.status === 'active';
        // console.log(activePlan, superAdmin)
        // if (activePlan) {
        //     return res.status(400).json({
        //         success: false,
        //         message: `Plan already active: ${superAdmin.plans[0].playRecursion} - ${superAdmin.plans[0].maxTeamMembers} members`,
        //         activePlanDetails: superAdmin.plans[0]
        //     });
        // }

        const now = new Date();
        const priceDetails = pricingDetails[playRecursion][selectedPlanIndex];
        const planTypeDescription = `${priceDetails.type} ${playRecursion} Plan`;

        // Create Stripe Checkout session for the selected plan
        const session = await stripe.checkout.sessions.create({
            // payment_method_types: ["card"],
            mode: "payment", // Change to "subscription" if you want recurring payments
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `${playRecursion} Plan - ${priceDetails.maxTeamMembers} Team Members`,
                        },
                        unit_amount: priceDetails.price * 100, // Stripe expects amount in cents
                    },
                    quantity: 1, // Single subscription
                }
            ],
            
            // tax_id_collection
            // : {
            //     enabled
            // : true,
            //     },
            allow_promotion_codes:true,
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
            metadata: {
                playRecursion,
                selectedPlanIndex,
            },
            customer: customerId,
            payment_intent_data: { 
                setup_future_usage: 'off_session',
                description: planTypeDescription
            }
        });

        res.status(200).json({
            success: true,
            message: 'Redirecting to payment...',
            url: session.url
        });

    } catch (error) {
        console.error('Error in addOrUpdatePlanWithSync:', error);
        res.status(500).json({
            success: false,
            message: "Server error.",
            error: error.message
        });
    }
};


exports.handlePaymentSuccess = async (req, res) => {
    const userId = req.combinedId ? req.combinedId : null;
    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    const { session_id } = req.query;
    if (!session_id) {
        return res.status(400).json({ success: false, message: "Session ID is required." });
    }

    try {
        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);

        // Retrieve metadata for playRecursion and selectedPlanIndex
        const playRecursion = session.metadata.playRecursion;
        const selectedPlanIndex = parseInt(session.metadata.selectedPlanIndex);

        if (!pricingDetails[playRecursion] || selectedPlanIndex < 0 || selectedPlanIndex >= pricingDetails[playRecursion].length) {
            return res.status(400).json({ success: false, message: "Invalid plan metadata in session." });
        }

        const superAdmin = await Combined.findById(userId);
        if (!superAdmin) {
            return res.status(404).json({ success: false, message: "SuperAdmin not found" });
        }

        let subscription = await Subscription.findOne({ userId });
        const workspace_name = superAdmin.workspace_name;

        const now = new Date();
        const priceDetails = pricingDetails[playRecursion][selectedPlanIndex];

        // Check for an active free trial in Subscription and end it
        if (!subscription) {
            subscription = new Subscription({ userId, workspace_name });
        } else if (subscription.plans.length > 0 && !subscription.plans[0].playRecursion) {
            // End any active free trial
            subscription.plans[0].expireOn = now;
            subscription.plans[0].days = 0;
            subscription.plans[0].status = 'expire'
        }

        // Determine the start date for the new plan
        let startDate = now;
        if (subscription.plans.length > 0) {
            const lastPlan = subscription.plans[subscription.plans.length - 1];
            const lastExpireDate = new Date(lastPlan.expireOn);
            startDate = lastExpireDate > now ? lastExpireDate : now;
        }

        // Calculate the new expiration date
        const newExpirationDate = playRecursion === 'Monthly'
            ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
            : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        
        const days = playRecursion === 'Monthly' ? 30 : 365;

        // Create a new paid plan
        const newPlan = {
            playRecursion,
            subscribedOn: startDate,
            expireOn: newExpirationDate,
            price: playRecursion === 'Yearly' ? (priceDetails.price / 12) : priceDetails.price,
            maxTeamMembers: priceDetails.maxTeamMembers,
            days: days,
            type: priceDetails.type,
            status: 'active'
        };

        // Append the new plan to the subscription plans array
        subscription.plans.push(newPlan);

        // Update the status of each plan after adding the new plan
        subscription.plans.forEach(plan => {
            const currentDate = now
            if (currentDate >= plan.subscribedOn && currentDate < plan.expireOn) {
                plan.status = 'active';
            } else if (currentDate > plan.expireOn) {
                plan.status = 'expire';
            } else if (currentDate < plan.subscribedOn) {
                plan.status = 'future';
            }
        });
        subscription.workspace_name = workspace_name
        // Save the updated subscription
        await subscription.save();

        res.status(200).json({
            success: true,
            message: 'Plan added successfully.',
            subscription
        });

    } catch (error) {
        console.error('Error in handlePaymentSuccess:', error);
        res.status(500).json({
            success: false,
            message: "Server error.",
            error: error.message
        });
    }
};



exports.handlePaymentFailure = async (req, res) => {
    const userId = req.combinedId ? req.combinedId : null;
    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    // Log failure details for debugging
    
    res.status(400).json({
        success: false,
        message: 'Payment was not successful. Please try again.',
    });
};


// Controller to handle the creation of the account link
exports.createAccountLink = async (req, res) => {
    const userId = req.combinedId ? req.combinedId : null;

    if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated." });
    }
    try {
      const account = await stripe.accounts.create({
        type: 'standard', 
      });
  
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/onboard`,
        return_url: `${process.env.FRONTEND_URL}/onboard`,
        type: 'account_onboarding',
      });
      
      const superAdmin = await Combined.findById(userId);
        if (!superAdmin) {
            return res.status(404).json({ success: false, message: "SuperAdmin not found" });
        }

        // Store the account ID in the superAdmin's profile
        superAdmin.stripeAccountId = account.id;
        await superAdmin.save();

      // Send the onboarding URL back to the client
      res.status(200).json({ url: accountLink.url });
    } catch (error) {
      console.error('Error creating account link:', error);
      res.status(500).json({ error: error.message });
    }
  };