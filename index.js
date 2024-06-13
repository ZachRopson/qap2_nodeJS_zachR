const http = require('http');
const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');
const axios = require('axios');

// Create an EventEmitter instance
class MyEmitter extends EventEmitter {};
const myEmitter = new MyEmitter();

// Define the port
const PORT = 3000;

// Function to get the log file name based on the current date
function getLogFileName() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `logs/${year}-${month}-${day}.log`;
}

// Function to log messages to a file
function logToFile(filePath, message) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFile(filePath, message, (err) => {
        if (err) {
            console.error(`Failed to write to ${filePath}: ${err.message}`);
        }
    });
}

// Event listeners for logging
myEmitter.on('log', (message) => {
    console.log(`LOG: ${message}`);
    logToFile(getLogFileName(), `LOG: ${message}\n`);
});

myEmitter.on('error', (message) => {
    console.error(`ERROR: ${message}`);
    logToFile(getLogFileName(), `ERROR: ${message}\n`);
});

// Function to serve HTML files
function serveFile(filePath, contentType, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.write('<h1>500 Internal Server Error</h1>');
            res.end();
            myEmitter.emit('error', `500 Internal Server Error: ${filePath}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.write(data);
            res.end();
            myEmitter.emit('log', `Served: ${filePath}`);
        }
    });
}

// Function to fetch and serve daily information
async function serveDailyInfo(res) {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD'); // Example API for daily exchange rates
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(response.data));
        res.end();
        myEmitter.emit('log', `Served daily information`);
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write('<h1>500 Internal Server Error</h1>');
        res.end();
        myEmitter.emit('error', `Failed to fetch daily information: ${error.message}`);
    }
}

// Create the server
const server = http.createServer((req, res) => {
    console.log(`Requested URL: ${req.url}`);
    myEmitter.emit('log', `Requested URL: ${req.url}`);

    switch (req.url) {
        case '/':
            serveFile('views/index.html', 'text/html', res);
            break;
        case '/about':
            serveFile('views/about.html', 'text/html', res);
            break;
        case '/contact':
            serveFile('views/contact.html', 'text/html', res);
            break;
        case '/products':
            serveFile('views/products.html', 'text/html', res);
            break;
        case '/subscribe':
            serveFile('views/subscribe.html', 'text/html', res);
            break;
        case '/daily-info':
            serveDailyInfo(res);
            break;
        default:
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('<h1>404 Not Found</h1>');
            res.end();
            myEmitter.emit('error', `404 Not Found: ${req.url}`);
    }
});

// Log server start
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    myEmitter.emit('log', `Server is listening on port ${PORT}`);
});




