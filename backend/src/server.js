const http = require('http');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', service: 'backend' }));
    } else if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Hello from Backend!' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] UP - Listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('[Backend] DOWN - Received SIGTERM, shutting down...');
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('[Backend] DOWN - Received SIGINT, shutting down...');
    server.close(() => process.exit(0));
});
