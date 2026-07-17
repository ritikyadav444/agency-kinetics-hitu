const awsServerlessExpress = require("aws-serverless-express");
const  connectDatabase  = require("./config/database");
let connection = null;

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (connection === null) connection = connectDatabase();
  const app = require("./app");
  const server = awsServerlessExpress.createServer(app);
  return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
};