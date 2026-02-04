FROM alpine:3.20

LABEL maintainer="Docker Cloud Project"
LABEL description="Backend API REST with Flask and Gunicorn"
LABEL version="1.0"

RUN apk update && \
    apk add --no-cache \
        python3 \
        py3-pip \
        curl && \
    rm -rf /var/cache/apk/*

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY src/ ./src/
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    chown -R appuser:appgroup /app

ENV FLASK_ENV=production
ENV GUNICORN_WORKERS=2
ENV GUNICORN_THREADS=4
ENV GUNICORN_BIND=0.0.0.0:5000
ENV LOG_LEVEL=info

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
