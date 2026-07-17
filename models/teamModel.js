const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const teamSchema = new mongoose.Schema({
    team_email: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["ADMIN", "ASSIGNEE", "PROJECT MANAGER"],
    },
    team_fname: String,
    team_lname: String,
    team_password: String,
    // verified: {
    //     type: Boolean,
    //     default: false,
    // },
    team_createdUnder: {
        type: mongoose.Schema.Types.String,
        ref: 'User',
        // required: true,
    },
});

teamSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};
teamSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
    return token;
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;