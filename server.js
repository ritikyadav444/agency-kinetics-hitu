const app = require('./app')
const path = require('path')
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, 'config', '.env') })
const connectDatabase = require("./config/database")

const PORT = process.env.PORT || 4001

connectDatabase()

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is working on http://0.0.0.0:${PORT}`)
})

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, retrying in 2 seconds...`);
        setTimeout(() => {
            server.close();
            server.listen(PORT, '0.0.0.0');
        }, 2000);
    }
});

function shutdown() {
    server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
process.once('SIGUSR2', () => {
    server.close(() => process.kill(process.pid, 'SIGUSR2'));
});
