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

RUN chown -R gameuser:gamegroup /app

ENV NODE_ENV=production
ENV PORT=3000

USER gameuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
