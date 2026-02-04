#!/bin/sh
set -e

echo "Hadolint"
hadolint backend/Dockerfile
hadolint frontend/Dockerfile
hadolint gameserver/Dockerfile

echo "Build images"
docker build -t my-backend backend
docker build -t my-frontend frontend
docker build -t my-gameserver gameserver

echo "Dockle"
dockle my-backend
dockle my-frontend
dockle my-gameserver
