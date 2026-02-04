FROM alpine:3.20

LABEL maintainer="Docker Cloud Project"
LABEL description="Game Server with Node.js and WebSocket"
LABEL version="1.0"

RUN apk update && \
    apk add --no-cache \
        nodejs \
        npm \
        curl && \
    rm -rf /var/cache/apk/*


RUN addgroup -S gamegroup && \
    adduser -S gameuser -G gamegroup

WORKDIR /app

COPY package*.json ./
RUN npm install --production && \
    npm cache clean --force

COPY src/ ./src/
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    chown -R gameuser:gamegroup /app

ENV NODE_ENV=production
ENV PORT=3000
ENV MAX_PLAYERS=100
ENV TICK_RATE=50
ENV SERVER_NAME=DockerCloud-GameServer

USER gameuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
