const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");
require("dotenv").config();

const client = new STSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

(async () => {
  try {
    const result = await client.send(new GetCallerIdentityCommand({}));
    console.log(result);
  } catch (err) {
    console.error(err);
  }
})();