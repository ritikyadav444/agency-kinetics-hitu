const mongoose = require('mongoose');

const tokenClientSchema = new mongoose.Schema({

    tokenClient: {
        type: String,
        required: true,
    },
});

const Token = mongoose.model('TokenClient', tokenClientSchema, 'tokenClients');

module.exports = Token;