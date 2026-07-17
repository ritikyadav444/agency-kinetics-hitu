const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { roles } = require('../middleware/constant');

const userSchema = mongoose.Schema({
    fname: {
        type: String,
        required: [true, "Please Enter First Name"],
        default: "abc"

    },
    lname: {
        type: String,
        required: [true, "Please Enter Last Name"],
        default: "abc"
    },
    email: {
        type: String,
        required: [true, 'Please Enter Email'],
        default: "abc"

    },
    password: {
        type: String,
        required: [true, 'Please Enter Password'],
        default: "abc"

    },
    workspace: {
        type: String,
        required: [true, 'Please Enter Workspace'],
        default: "abc"

    },
    role: {
        type: String,
        enum: [roles.superAdmin, roles.admin, roles.projectManager, roles.assignee],
        default: roles.superAdmin,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

});
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};
userSchema.methods.comaprePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;