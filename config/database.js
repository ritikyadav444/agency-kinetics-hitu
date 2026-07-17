// const mongoose = require("mongoose");
// const dotenv = require("dotenv").config()
// const connectDatabase = () => {
//     mongoose.connect(process.env.DB_URI).then(

//         (data) => {
//             console.log(`Mongodb connected server:${data.connection.host}`);

//         });
// };
// module.exports = connectDatabase

// const mongoose = require("mongoose");
// const dotenv = require("dotenv").config()

// const DB_URI = 'mongodb+srv://codewithhitu:lIbzHlC3onFwjjzp@cluster0.4v3doxn.mongodb.net/?retryWrites=true&w=majority'
// const connectDatabase = () => {
//     mongoose.connect(DB_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     }).then(

//         (data) => {
//             console.log(`Mongodb connected server:${data.connection.host}`);

//         });
// };
// module.exports = connectDatabase



const mongoose = require("mongoose");
const dotenv = require("dotenv").config()
const connect_db_uri = process.env.DB_URI
const connectDatabase = () => {
    mongoose.connect(connect_db_uri).then(

        (data) => {
            console.log(`Mongodb connected server:${data.connection.host}`);

        });
};
module.exports = connectDatabase
