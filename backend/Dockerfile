FROM alpine:3.20

LABEL maintainer="Docker Cloud Project"
LABEL description="Backend API REST with Node.js"
LABEL version="1.0"

RUN apk update && \
    apk add --no-cache \
        nodejs \
        npm \
        curl && \
    rm -rf /var/cache/apk/*

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json ./
RUN npm install --production && \
    npm cache clean --force

COPY src/ ./src/

RUN chown -R appuser:appgroup /app

ENV NODE_ENV=production
ENV PORT=5000

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
