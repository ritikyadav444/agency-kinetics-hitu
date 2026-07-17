const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { roles } = require('../middleware/constant');

const combinedSchema = mongoose.Schema({

    profile_img: {
        type: String,
    },
    company_img: {
        type: String,
    },
 
     company_SuperName: {
         type: String,
         default: "Please Provide Company Name"
     },

    fname: {
        type: String,

    },
    lname: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    workspace_name: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Combined',
    },
    role: {
        type: String,
        enum: [roles.superAdmin, roles.admin, roles.projectManager, roles.assignee, roles.client],
        default: roles.superAdmin,
        required: true
    },

    //TEAM DETAILS
    isTeamMember: {
        type: Boolean,
        // default: false,
    },

    //CLIENT DETAILS
    isClient: {
        type: Boolean,
        // default: false,
    },

    country: {
        type: String,
        // required: [true, 'Please Enter country Name'],
    },
    state: {
        type: String,
        // required: [true, 'Please Enter state Name'],
    },
    city: {
        type: String,
        // required: [true, 'Please Enter city Name'],
    },
    postalCode: {
        type: Number,
        // required: [true, 'Please Enter postalCode Name'],
    },

    clientId: {
        type: Number,
    },

    verified: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    companyname: {
        type: String,
        // required: [true, "Please Enter Last Name"],
        // default: "abc"
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    workspace_created_on: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    stripeAccountId: {
        type: String,
        required: false,
    },
    stripeCustomerId: {
        type: String,
        required: false,
    },

});

// // Set expireOn date based on playRecursion and plan
// combinedSchema.pre('save', function (next) {
//     const now = new Date();
//     this.plans.forEach(plan => {
//         if (!plan.expireOn) {
//             if (plan.playRecursion === 'Monthly') {
//                 plan.expireOn = new Date(plan.subscribedOn.getTime() + 30 * 24 * 60 * 60 * 1000);
//                 // ? new Date(now.getTime() + 30 * 1000)
//             } else if (plan.playRecursion === 'Yearly') {
//                 plan.expireOn = new Date(plan.subscribedOn.getTime() + 365 * 24 * 60 * 60 * 1000);
//             }
//         }
//     });
//     const isExpired = this.plans.every(plan => plan.expireOn <= now);
//     this.status = isExpired ? 'inactive' : 'active';
//     next();
// });

combinedSchema.methods.isAccountActive = function () {
    return this.status === 'active';
};

combinedSchema.methods.getJWTToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: '4h'
    });
};
combinedSchema.methods.comaprePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

combinedSchema.methods.generateAuthToken = function() {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '4h' });
};

combinedSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

combinedSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(16).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
}

combinedSchema.pre('save', async function(next) {
    if (this.role === 'CLIENT' && !this.clientId) {
        try {
            const lastClient = await Combined.findOne({}, {}, { sort: { clientId: -1 } });
            if (lastClient) {
                this.clientId = lastClient.clientId + 1;
            } else {
                this.clientId = 1;
            }
            console.log("In", lastClient, this.clientId, this.client_createdUnder);
        } catch (error) {
            console.error('Error finding last client:', error);
        }
    }
    next();
});


combinedSchema.index({ email: 1, workspace_name: 1 });
combinedSchema.index({ workspace_name: 1, role: 1 });
combinedSchema.index({ resetPasswordToken: 1 });

const Combined = mongoose.model('Combined', combinedSchema);

module.exports = Combined;