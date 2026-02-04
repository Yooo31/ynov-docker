const http = require('http');
const { WebSocketServer } = require('ws');

const config = {
    port: parseInt(process.env.PORT) || 3000,
    maxPlayers: parseInt(process.env.MAX_PLAYERS) || 100,
    tickRate: parseInt(process.env.TICK_RATE) || 50,
    serverName: process.env.SERVER_NAME || 'DockerCloud-GameServer',
    nodeEnv: process.env.NODE_ENV || 'production'
};

const serverState = {
    startTime: new Date(),
    players: new Map(),
    playerIdCounter: 0
};

const httpServer = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            service: 'gameserver',
            players: serverState.players.size,
            maxPlayers: config.maxPlayers,
            uptime: Math.floor((Date.now() - serverState.startTime.getTime()) / 1000),
            timestamp: new Date().toISOString()
        }));
    } else if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Hello from Docker Cloud Game Server!',
            serverName: config.serverName,
            version: '1.0.0',
            websocket: `ws://localhost:${config.port}`
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

const wss = new WebSocketServer({ server: httpServer });

console.log(`[GameServer] Initializing ${config.serverName}...`);
console.log(`[GameServer] Max players: ${config.maxPlayers}`);
console.log(`[GameServer] Tick rate: ${config.tickRate}ms`);

wss.on('connection', (ws, req) => {
    if (serverState.players.size >= config.maxPlayers) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Server full'
        }));
        ws.close();
        return;
    }

    const playerId = ++serverState.playerIdCounter;
    const player = {
        id: playerId,
        ws: ws,
        joinedAt: new Date(),
        x: Math.random() * 100,
        y: Math.random() * 100
    };

    serverState.players.set(playerId, player);
    console.log(`[GameServer] Player ${playerId} connected. Total: ${serverState.players.size}`);

    ws.send(JSON.stringify({
        type: 'welcome',
        playerId: playerId,
        serverName: config.serverName,
        players: serverState.players.size,
        maxPlayers: config.maxPlayers
    }));

    broadcast({
        type: 'playerJoined',
        playerId: playerId,
        totalPlayers: serverState.players.size
    }, playerId);

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            handleMessage(playerId, message);
        } catch (error) {
            console.error(`[GameServer] Invalid message from player ${playerId}:`, error.message);
        }
    });

    ws.on('close', () => {
        serverState.players.delete(playerId);
        console.log(`[GameServer] Player ${playerId} disconnected. Total: ${serverState.players.size}`);

        broadcast({
            type: 'playerLeft',
            playerId: playerId,
            totalPlayers: serverState.players.size
        });
    });

    ws.on('error', (error) => {
        console.error(`[GameServer] WebSocket error for player ${playerId}:`, error.message);
    });
});

function handleMessage(playerId, message) {
    const player = serverState.players.get(playerId);
    if (!player) return;

    switch (message.type) {
        case 'ping':
            player.ws.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString(),
                serverName: config.serverName
            }));
            break;

        case 'move':
            player.x = message.x || player.x;
            player.y = message.y || player.y;

            broadcast({
                type: 'playerMoved',
                playerId: playerId,
                x: player.x,
                y: player.y
            });
            break;

        case 'chat':
            broadcast({
                type: 'chat',
                playerId: playerId,
                message: message.text?.substring(0, 200) || ''
            });
            break;

        default:
            player.ws.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type'
            }));
    }
}

function broadcast(message, excludePlayerId = null) {
    const data = JSON.stringify(message);
    serverState.players.forEach((player, id) => {
        if (id !== excludePlayerId && player.ws.readyState === 1) {
            player.ws.send(data);
        }
    });
}

const gameLoop = setInterval(() => {
    if (serverState.players.size > 0) {
        const gameState = {
            type: 'gameState',
            timestamp: Date.now(),
            players: Array.from(serverState.players.values()).map(p => ({
                id: p.id,
                x: p.x,
                y: p.y
            }))
        };
        broadcast(gameState);
    }
}, config.tickRate);

function gracefulShutdown(signal) {
    console.log(`\n[GameServer] Received ${signal}, shutting down gracefully...`);

    clearInterval(gameLoop);

    broadcast({
        type: 'serverShutdown',
        message: 'Server is shutting down'
    });

    serverState.players.forEach((player) => {
        player.ws.close(1001, 'Server shutting down');
    });

    wss.close(() => {
        console.log('[GameServer] WebSocket server closed');

        httpServer.close(() => {
            console.log('[GameServer] HTTP server closed');
            console.log('[GameServer] Goodbye!');
            process.exit(0);
        });
    });

    setTimeout(() => {
        console.error('[GameServer] Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`[GameServer] ${config.serverName} is running!`);
    console.log(`[GameServer] HTTP: http://0.0.0.0:${config.port}`);
    console.log(`[GameServer] WebSocket: ws://0.0.0.0:${config.port}`);
    console.log(`[GameServer] Environment: ${config.nodeEnv}`);
});
