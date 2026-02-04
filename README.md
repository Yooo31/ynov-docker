# Projet Docker Cloud

## 📋 Description

Ce projet met en place une architecture cloud personnalisée basée sur Docker, comprenant :
- **Frontend** : Serveur web Nginx servant une page HTML statique
- **Backend** : API REST Node.js minimaliste
- **Game Server** : Serveur de jeu Node.js
- **Portainer** : Interface de gestion Docker (image officielle)
- **Atlas** : Visualisation réseau et containers en temps réel (image officielle)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Docker Network (cloud-network)                    │
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐                  │
│  │   Frontend   │     │   Backend    │    │  Game Server │                  │
│  │   (Nginx)    │───▶│   (Node.js)  │    │   (Node.js)  │                  │
│  │   :8080      │     │   :5000      │    │   :3000      │                  │
│  └──────────────┘     └──────────────┘    └──────────────┘                  │
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
│   └── src/
│       └── index.html
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── server.js
└── gameserver/
    ├── Dockerfile
    ├── package.json
    └── src/
        └── server.js
```

---

## 🖼️ Image Frontend (Nginx)

### Dépendances installées
| Dépendance | Raison |
|------------|--------|
| `alpine:3.20` | Image de base légère (~5MB) |
| `nginx` | Serveur web haute performance |
| `curl` | Pour les health checks |

### Ports exposés
| Port | Usage |
|------|-------|
| 80 | HTTP - Serveur web |

### Manipulations OS
- Création des répertoires `/var/www/html`, `/run/nginx`, `/var/log/nginx`
- Configuration des permissions pour l'utilisateur `nginx`
- Copie de la configuration Nginx personnalisée

### CMD
```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```
Nginx s'exécute en mode foreground (PID 1) pour :
- Recevoir directement les signaux SIGTERM
- Permettre un arrêt gracieux des connexions

---

## 🔧 Image Backend (Node.js)

### Dépendances installées
| Dépendance | Raison |
|------------|--------|
| `alpine:3.20` | Image de base légère |
| `nodejs` | Runtime JavaScript |
| `npm` | Gestionnaire de paquets |
| `curl` | Pour les health checks |

### Ports exposés
| Port | Usage |
|------|-------|
| 5000 | API REST HTTP |

### Manipulations OS
- Création d'un utilisateur non-root `appuser:appgroup`
- Installation des dépendances npm en mode production
- Configuration du répertoire de travail `/app`

### Arguments au run
| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement Node | `production` |
| `PORT` | Port d'écoute | `5000` |

### CMD
```dockerfile
CMD ["node", "src/server.js"]
```
Node.js s'exécute directement (PID 1) pour :
- Recevoir les signaux SIGTERM/SIGINT
- Afficher `[Backend] UP` au démarrage
- Afficher `[Backend] DOWN` à l'arrêt

---

## 🎮 Image Game Server (Node.js)

### Dépendances installées
| Dépendance | Raison |
|------------|--------|
| `alpine:3.20` | Image de base légère |
| `nodejs` | Runtime JavaScript |
| `npm` | Gestionnaire de paquets |
| `curl` | Pour les health checks |

### Ports exposés
| Port | Usage |
|------|-------|
| 3000 | HTTP - Serveur de jeu |

### Manipulations OS
- Création d'un utilisateur non-root `gameuser:gamegroup`
- Installation des dépendances npm en mode production
- Nettoyage du cache npm

### Arguments au run
| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement Node | `production` |
| `PORT` | Port d'écoute | `3000` |

### CMD
```dockerfile
CMD ["node", "src/server.js"]
```
Node.js s'exécute directement (PID 1) pour :
- Recevoir les signaux SIGTERM/SIGINT
- Afficher `[GameServer] UP` au démarrage
- Afficher `[GameServer] DOWN` à l'arrêt

---

## 🐳 Orchestration Docker Compose

### Limitations de ressources

| Container | CPU Limit | Memory Limit | Memory Reservation | Justification |
|-----------|-----------|--------------|-------------------|---------------|
| frontend | 0.5 | 128MB | 64MB | Fichiers statiques uniquement |
| backend | 1.0 | 256MB | 128MB | API REST avec traitement modéré |
| gameserver | 1.5 | 512MB | 256MB | Serveur de jeu, potentiellement plus gourmand |
| portainer | 0.5 | 256MB | 128MB | Interface de gestion |
| atlas | 0.5 | 256MB | 128MB | Collecte de métriques |

### Gestion des SIGTERM

Chaque container gère proprement les signaux d'arrêt :
- `stop_grace_period: 30s` pour les services principaux
- `stop_grace_period: 10s` pour les outils de monitoring
- Les processus Node.js/Nginx sont en PID 1 (pas de script entrypoint)
- Logs `UP` au démarrage, `DOWN` à l'arrêt

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

### Build et lancement

```bash
docker compose up -d --build
```

### Vérification des services

```bash
docker compose ps
docker compose logs -f
```

### Test de l'arrêt gracieux

```bash
docker compose down
```

### Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:8080 | Interface web |
| Backend API | http://localhost:5000 | API REST |
| Game Server | http://localhost:3000 | Serveur de jeu |
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
 │ (HTTP)   │            │ (HTTP)   │            │ Server   │
 └────┬─────┘            └──────────┘            └──────────┘
      │                        ▲
      │   /api/*               │
      └────────────────────────┘
               (proxy)
```

---

## 🔒 Sécurité

- ✅ Tous les containers applicatifs tournent avec des utilisateurs non-root
- ✅ Aucune image utilisée directement sans personnalisation
- ✅ Limitation des ressources pour éviter les attaques DoS
- ✅ Health checks pour détecter les anomalies
- ✅ Volumes Docker socket en lecture seule pour Portainer
