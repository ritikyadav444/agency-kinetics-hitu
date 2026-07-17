const express = require('express')
const app = express();
// const mongoose = require('mongoose')
const cookieParser = require("cookie-parser");
const cors = require('cors')
const dotenv = require("dotenv");
dotenv.config()
const helmet = require('helmet')
const morgan = require('morgan')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const cronJob = require('./cronJob')

app.use(helmet())
app.use(morgan('dev'))
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
});

// const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
// app.use(awsServerlessExpressMiddleware.eventContext())

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4001',
  "https://dashboard.agencykinetics.com",
  "https://app.agencykinetics.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());

//Route imports
const service = require("./routes/serviceRouter")
const invoice = require("./routes/invoiceRouter");
const order = require("./routes/orderRouter");
const quote = require("./routes/quoteRouter");
const ticket = require("./routes/ticketRoutes");
const task = require("./routes/taskRouter");
const combined = require("./routes/combinedRoute");
const sessionRoute = require("./routes/sessionRouter")
const notificationRoute = require("./routes/notificationRouter")
const comment = require("./routes/taskCommentRouter");
const subscription = require("./routes/subscriptionRouter")
const payment = require("./routes/paymentRouter")
const stripe = require("./routes/stripeRoutes")

const connectDatabase = require('./config/database');



app.use("/api/v1", task)
app.use("/api/v1", order);
app.use("/api/v1", quote);
app.use("/api/v1", service);
app.use("/api/v1", invoice);
app.use("/api/v1", ticket)
app.use("/api/v1", combined)
app.use("/api/v1", sessionRoute)
app.use("/api/v1", notificationRoute)
app.use("/api/v1", comment)
app.use("/api/v1", subscription)
app.use("/api/v1", payment)
app.use("/api/v1", stripe)



// const PORT = process.env.PORT || 4001
// connectDatabase()
// app.listen(PORT, () => {
//     console.log(`Server is working on http://127.0.0.1:${PORT}`)

// })

module.exports = app
