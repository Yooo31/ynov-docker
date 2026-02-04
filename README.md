# Projet Docker Cloud

## 📋 Description

Ce projet met en place une architecture cloud personnalisée basée sur Docker, comprenant :
- **Frontend** : Serveur web Nginx servant une application HTML/JS
- **Backend** : API REST Python/Flask
- **Game Server** : Serveur de jeu Node.js avec WebSocket
- **Portainer** : Interface de gestion Docker (image officielle)
- **Atlas** : Visualisation réseau et containers en temps réel (image officielle)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Docker Network (cloud-network)                    │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Frontend   │    │   Backend    │    │  Game Server │                   │
│  │   (Nginx)    │───▶│   (Flask)    │    │   (Node.js)  │                  │
│  │   :8080      │    │   :5000      │    │   :3000      │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                   │                           │
│         └───────────────────┴───────────────────┘                           │
│                             │                                               │
│  ┌──────────────────────────┴──────────────────────────┐                    │
│  │                   Outils de Monitoring              │                    │
│  │  ┌──────────────┐              ┌──────────────┐     │                    │
│  │  │  Portainer   │              │  Atlas       │     │                    │
│  │  │  :9000       │              │  :4040       │     │                    │
│  │  │  (Gestion)   │              │  (Visu Rés.) │     │                    │
│  │  └──────────────┘              └──────────────┘     │                    │
│  └─────────────────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Structure du Projet

```
projet-final/
├── README.md
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── entrypoint.sh
│   └── src/
│       └── index.html
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── entrypoint.sh
│   └── src/
│       └── app.py
├── gameserver/
│   ├── Dockerfile
│   ├── package.json
│   ├── entrypoint.sh
│   └── src/
│       └── server.js
```

---

## 🖼️ Image Frontend (Nginx)

### Dépendances installées
| Dépendance | Raison |
|------------|--------|
| `alpine:3.19` | Image de base légère (~5MB) |
| `nginx` | Serveur web haute performance |
| `curl` | Pour les health checks |
| `gettext` | Pour envsubst (substitution variables) |

### Ports exposés
| Port | Usage |
|------|-------|
| 80 | HTTP - Serveur web |

### Manipulations OS
- Création des répertoires `/var/www/html`, `/run/nginx`, `/var/log/nginx`
- Configuration des permissions pour l'utilisateur `nginx`
- Copie de la configuration Nginx personnalisée

### Arguments au run
| Variable | Description | Défaut |
|----------|-------------|--------|
| `NGINX_WORKER_PROCESSES` | Nombre de workers Nginx | `auto` |
| `NGINX_WORKER_CONNECTIONS` | Connexions par worker | `1024` |
| `BACKEND_HOST` | Hostname du backend | `backend` |
| `BACKEND_PORT` | Port du backend | `5000` |

### Entrypoint
Le script `entrypoint.sh` :
1. Remplace les variables d'environnement dans la config Nginx via `envsubst`
2. Vérifie la configuration Nginx avec `nginx -t`
3. Lance Nginx en mode foreground (`daemon off`) pour capturer les signaux

---

## 🔧 Image Backend (Flask/Python)

### Dépendances installées
| Dépendance | Raison |
|------------|--------|
| `alpine:3.19` | Image de base légère |
| `python3` | Runtime Python |
| `py3-pip` | Gestionnaire de paquets Python |
| `flask` | Framework web minimaliste |
| `gunicorn` | Serveur WSGI production-ready |
| `curl` | Pour les health checks |

### Ports exposés
| Port | Usage |
|------|-------|
| 5000 | API REST Flask |

### Manipulations OS
- Création d'un utilisateur non-root `appuser:appgroup`
- Installation des dépendances Python via pip avec `--break-system-packages`
- Configuration du répertoire de travail `/app`

### Arguments au run
| Variable | Description | Défaut |
|----------|-------------|--------|
| `FLASK_ENV` | Environnement (development/production) | `production` |
| `GUNICORN_WORKERS` | Nombre de workers Gunicorn | `2` |
| `GUNICORN_THREADS` | Threads par worker | `4` |
| `GUNICORN_BIND` | Adresse d'écoute | `0.0.0.0:5000` |
| `LOG_LEVEL` | Niveau de log | `info` |

### Entrypoint
Le script `entrypoint.sh` :
1. Affiche la configuration au démarrage
2. Lance Gunicorn avec `exec` pour recevoir les signaux SIGTERM directement
3. Configure `--graceful-timeout 30` pour un arrêt propre

---

## 🎮 Image Game Server (Node.js)

### Dépendances installées
| Dépendance | Raison |
|------------|--------|
| `alpine:3.19` | Image de base légère |
| `nodejs` | Runtime JavaScript |
| `npm` | Gestionnaire de paquets Node |
| `ws` | Bibliothèque WebSocket |
| `curl` | Pour les health checks |

### Ports exposés
| Port | Usage |
|------|-------|
| 3000 | WebSocket + HTTP - Serveur de jeu |

### Manipulations OS
- Création d'un utilisateur non-root `gameuser:gamegroup`
- Installation des dépendances npm en mode production
- Nettoyage du cache npm

### Arguments au run
| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement Node | `production` |
| `PORT` | Port d'écoute | `3000` |
| `MAX_PLAYERS` | Nombre max de joueurs | `100` |
| `TICK_RATE` | Taux de rafraîchissement (ms) | `50` |
| `SERVER_NAME` | Nom du serveur | `DockerCloud-GameServer` |

### Entrypoint
Le script `entrypoint.sh` :
1. Affiche la configuration
2. Lance Node.js avec `exec` pour la gestion des signaux
3. Le serveur gère lui-même la fermeture gracieuse des WebSockets

---

## 🐳 Orchestration Docker Compose

### Limitations de ressources

| Container | CPU Limit | Memory Limit | Memory Reservation | Justification |
|-----------|-----------|--------------|-------------------|---------------|
| frontend | 0.5 | 128MB | 64MB | Fichiers statiques uniquement |
| backend | 1.0 | 256MB | 128MB | API REST avec traitement modéré |
| gameserver | 1.5 | 512MB | 256MB | Temps réel, multiples WebSockets |
| portainer | 0.5 | 128MB | 64MB | Interface légère |
| Atlas | 0.5 | 256MB | 128MB | Collecte de métriques |

### Gestion des SIGTERM

Chaque container gère proprement les signaux d'arrêt :
- `stop_grace_period: 30s` pour les services principaux
- `stop_grace_period: 10s` pour les outils de monitoring
- Les entrypoints utilisent `exec` pour recevoir les signaux directement
- Fermeture gracieuse des connexions (WebSocket, HTTP)

### Dépendances et ordre de démarrage

```yaml
depends_on:
  backend:
    condition: service_healthy
```

**Ordre de démarrage :**
1. **Backend** - Doit être healthy en premier
2. **Frontend** - Attend le backend pour le proxy
3. **Game Server** - Indépendant
4. **Portainer** - Indépendant
5. **Atlas** - Indépendant

### Health Checks

| Service | Commande | Intervalle |
|---------|----------|------------|
| frontend | `curl -f http://localhost/health` | 30s |
| backend | `curl -f http://localhost:5000/health` | 30s |
| gameserver | `curl -f http://localhost:3000/health` | 30s |

---

## 🚀 Utilisation

### Build des images

```bash
docker compose build
```

### Lancement

```bash
docker compose up -d
```

### Vérification des services

```bash
docker compose ps
docker compose logs -f
```

### Arrêt

```bash
docker compose down
```

### Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:8080 | Interface web principale |
| Backend API | http://localhost:5000 | API REST |
| Game Server | ws://localhost:3000 | WebSocket |
| Portainer | http://localhost:9000 | Gestion Docker |
| Atlas | http://localhost:4040 | Visualisation réseau |

---

## 📊 Schéma des Communications

```
                         ┌─────────────┐
                         │   Client    │
                         │  (Browser)  │
                         └──────┬──────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
 ┌──────────┐            ┌──────────┐            ┌──────────┐
 │ :8080    │            │ :5000    │            │ :3000    │
 │ Frontend │            │ Backend  │            │ Game     │
 │ (HTTP)   │            │ (HTTP)   │            │ (WS)     │
 └────┬─────┘            └──────────┘            └──────────┘
      │                        ▲
      │   /api/*               │
      └────────────────────────┘
               (proxy)

        ┌───────────────────────────────────────────────┐
        │              Outils de Monitoring              │
        │                                               │
        │  ┌──────────┐                 ┌──────────┐   │
        │  │ :9000    │                 │ :4040    │   │
        │  │Portainer │◄───────────────►│  Scope   │   │
        │  │(Gestion) │  docker.sock    │ (Réseau) │   │
        │  └──────────┘                 └──────────┘   │
        └───────────────────────────────────────────────┘
```

---

## 🔒 Sécurité

- ✅ Tous les containers applicatifs tournent avec des utilisateurs non-root
- ✅ Aucune image provenant directement de Docker Hub sans personnalisation
- ✅ Limitation des ressources pour éviter les attaques DoS
- ✅ Health checks pour détecter les anomalies
- ✅ Volumes Docker socket en lecture seule pour Portainer/Atlas
- ⚠️ Scope nécessite le mode privilégié (à désactiver en production sensible)

