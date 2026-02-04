#!/bin/sh

set -e

echo "=== Backend Container Starting ==="
echo "FLASK_ENV: ${FLASK_ENV}"
echo "GUNICORN_WORKERS: ${GUNICORN_WORKERS}"
echo "GUNICORN_THREADS: ${GUNICORN_THREADS}"
echo "GUNICORN_BIND: ${GUNICORN_BIND}"
echo "LOG_LEVEL: ${LOG_LEVEL}"

echo "Starting Gunicorn..."
exec gunicorn \
    --workers ${GUNICORN_WORKERS} \
    --threads ${GUNICORN_THREADS} \
    --bind ${GUNICORN_BIND} \
    --log-level ${LOG_LEVEL} \
    --access-logfile - \
    --error-logfile - \
    --graceful-timeout 30 \
    --timeout 60 \
    "src.app:app"
