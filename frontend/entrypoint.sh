#!/bin/sh

set -e

echo "=== Frontend Container Starting ==="
echo "NGINX_WORKER_PROCESSES: ${NGINX_WORKER_PROCESSES}"
echo "NGINX_WORKER_CONNECTIONS: ${NGINX_WORKER_CONNECTIONS}"
echo "BACKEND_HOST: ${BACKEND_HOST}"
echo "BACKEND_PORT: ${BACKEND_PORT}"

echo "Generating Nginx configuration..."
envsubst '${NGINX_WORKER_PROCESSES} ${NGINX_WORKER_CONNECTIONS} ${BACKEND_HOST} ${BACKEND_PORT}' \
    < /etc/nginx/nginx.conf.template \
    > /etc/nginx/nginx.conf

echo "Validating Nginx configuration..."
nginx -t

cleanup() {
    echo "Received shutdown signal, stopping Nginx gracefully..."
    nginx -s quit
    wait $NGINX_PID
    echo "Nginx stopped."
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "Starting Nginx..."
exec nginx -g 'daemon off;'
