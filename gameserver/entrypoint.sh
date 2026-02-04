#!/bin/sh

set -e

echo "=== Game Server Container Starting ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "MAX_PLAYERS: ${MAX_PLAYERS}"
echo "TICK_RATE: ${TICK_RATE}"
echo "SERVER_NAME: ${SERVER_NAME}"

echo "Starting Game Server..."
exec node src/server.js
