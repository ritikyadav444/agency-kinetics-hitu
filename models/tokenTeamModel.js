const mongoose = require('mongoose');

const tokenTeamSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        required:true
    },
    tokenTeam: {
        type: String,
        required: true,
    },
});

const TokenTeam = mongoose.model('TokenTeam', tokenTeamSchema, 'tokenTeams');

module.exports = TokenTeam;