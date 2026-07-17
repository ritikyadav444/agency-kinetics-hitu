const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    plans: [
        {
            playRecursion: {
                type: String,
                enum: ['Monthly', 'Yearly'],
                // required: true,
            },
            type: {
                type: String,
            },
            price: {
                type: Number,
                // required: true,
            },
            maxTeamMembers: {
                type: Number,
                // required: true,
            },
            subscribedOn: {
                type: Date,
                default: Date.now
            },
            expireOn: {
                type: Date
            },
            days: {
                type: Number,
                default: 0,   // Initialize to 0
            },
            status: {
                type: String,
                enum: ['active', 'expire', 'trial', 'future'],
                default: 'active'
            },
        }
    ],

    
    stripeAccountId: {
        type: String,
        required: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Combined',
        required: true,
    },
    workspace_name: {type: String},
    totalDaysLeft: {type: Number}

});


subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ 'plans.expireOn': 1 });
subscriptionSchema.index({ workspace_name: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;