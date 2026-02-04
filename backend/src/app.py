"""
=============================================================================
Backend API - Flask Application
=============================================================================
API REST simple pour démontrer l'architecture Docker Cloud.
Endpoints:
  - GET /health : Health check
  - GET /       : Hello World
  - GET /info   : Informations sur le serveur
=============================================================================
"""

import os
import signal
import sys
from datetime import datetime
from flask import Flask, jsonify

# =============================================================================
# Initialisation de l'application Flask
# =============================================================================
app = Flask(__name__)

# Variable pour suivre l'état du serveur
server_start_time = datetime.now()


# =============================================================================
# Gestion des signaux SIGTERM/SIGINT
# -----------------------------------------------------------------------------
# Permet un arrêt gracieux du serveur
# =============================================================================
def signal_handler(signum, frame):
    """Gestionnaire de signaux pour arrêt gracieux."""
    print(f"Received signal {signum}, shutting down gracefully...")
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


# =============================================================================
# Routes de l'API
# =============================================================================

@app.route('/health')
def health():
    """
    Health check endpoint.
    Utilisé par Docker pour vérifier que le container est healthy.
    """
    return jsonify({
        'status': 'healthy',
        'service': 'backend',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/')
def hello():
    """
    Route principale - Hello World.
    """
    return jsonify({
        'message': 'Hello from Docker Cloud Backend!',
        'service': 'Flask API',
        'version': '1.0.0'
    })


@app.route('/info')
def info():
    """
    Informations sur le serveur et sa configuration.
    Affiche les variables d'environnement configurées.
    """
    uptime = datetime.now() - server_start_time
    
    return jsonify({
        'service': 'backend',
        'framework': 'Flask',
        'python_version': sys.version,
        'environment': os.environ.get('FLASK_ENV', 'production'),
        'workers': os.environ.get('GUNICORN_WORKERS', '2'),
        'threads': os.environ.get('GUNICORN_THREADS', '4'),
        'uptime_seconds': int(uptime.total_seconds()),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/status')
def status():
    """
    Statut de tous les services (simulé).
    """
    return jsonify({
        'services': {
            'frontend': 'online',
            'backend': 'online',
            'gameserver': 'online'
        },
        'timestamp': datetime.now().isoformat()
    })


# =============================================================================
# Point d'entrée pour le développement
# -----------------------------------------------------------------------------
# En production, Gunicorn importe directement l'objet 'app'
# =============================================================================
if __name__ == '__main__':
    # Mode développement uniquement
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
