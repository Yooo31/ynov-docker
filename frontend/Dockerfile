FROM alpine:3.20

LABEL maintainer="Docker Cloud Project"
LABEL description="Frontend web server with Nginx"
LABEL version="1.0"

RUN apk update && \
    apk add --no-cache \
        nginx \
        curl \
        gettext && \
    rm -rf /var/cache/apk/*

RUN mkdir -p /var/www/html && \
    mkdir -p /run/nginx && \
    mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/www/html && \
    chown -R nginx:nginx /run/nginx && \
    chown -R nginx:nginx /var/log/nginx

ENV NGINX_WORKER_PROCESSES=auto
ENV NGINX_WORKER_CONNECTIONS=1024
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=5000

COPY nginx.conf /etc/nginx/nginx.conf.template
COPY src/ /var/www/html/
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    chown -R nginx:nginx /var/www/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
