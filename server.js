const app = require('./app')
const path = require('path')
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, 'config', '.env') })
const connectDatabase = require("./config/database")

const PORT = process.env.PORT || 4001

connectDatabase()

const server = app.listen(PORT, () => {
    console.log(`Server is working on http://127.0.0.1:${PORT}`)
})