const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { roles } = require('../middleware/constant');

const clientSchema = new mongoose.Schema({
    clientId: {
        type: Number,
    },
    client_password: {
        type: String,
        required: [true, 'Please Enter Password'],
    },
    role: {
        type: String,
        required: [true, 'Please Enter  CLIENT'],
        default: "CLIENT",
    },
    client_email: {
        type: String,
        required: [true, 'Please Enter Email']
    },
    client_fname: {
        type: String,
        required: [true, 'Please Enter  First Name'],
    },
    client_lname: {
        type: String,
        required: [true, 'Please Enter  Last Name'],
    },
    client_country: {
        type: String,
        required: [true, 'Please Enter country Name'],
    },
    client_state: {
        type: String,
        required: [true, 'Please Enter state Name'],
    },

    client_city: {
        type: String,
        required: [true, 'Please Enter city Name'],
    },
    client_postalCode: {
        type: Number,
        required: [true, 'Please Enter postalCode Name'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    createdUnder: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        // required: true,
    },
});

clientSchema.methods.getJWTTokenClient = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};
clientSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
    return token;
};

clientSchema.pre('save', async function (next) {
    if (!this.clientId) {
        try {
            const lastClient = await Client.findOne({}, {}, { sort: { clientId: -1 } });
            if (lastClient) {
                this.clientId = lastClient.clientId + 1;
            } else {
                this.clientId = 1;
            }
            console.log("In", lastClient, this.clientId, this.createdUnder);
        } catch (error) {
            console.error('Error finding last client:', error);
        }
    }
    next();
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;