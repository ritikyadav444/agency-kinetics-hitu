const mongoose = require("mongoose");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (_) {}

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI).then(
        (data) => {
            console.log(`Mongodb connected server:${data.connection.host}`);
        }).catch((err) => {
            console.error("MongoDB connection failed:", err.message);
            process.exit(1);
        });
};
module.exports = connectDatabase
