const Subscription = require('../models/subscriptionModel');
const ErrorHander = require("../utils/errorHander");

exports.getSubscriptionDetails = async (req, res, next) => {
    const { userId } = req.params;
    console.log(userId)

    try {
        const subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            return next(new ErrorHander("Subscription not found for this user.", 404));
        }
        console.log(subscription)
        res.status(200).json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error("Error in getSubscriptionDetails:", error);
        res.status(500).json({
            success: false,
            message: "Server error.",
            error: error.message
        });
    }
};
