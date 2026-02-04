FROM alpine:3.20

LABEL maintainer="Docker Cloud Project"
LABEL description="Frontend web server with Nginx"
LABEL version="1.0"

RUN apk update && \
    apk add --no-cache \
        nginx \
        curl && \
    rm -rf /var/cache/apk/*

RUN mkdir -p /var/www/html && \
    mkdir -p /run/nginx && \
    mkdir -p /var/log/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY src/ /var/www/html/

RUN chown -R nginx:nginx /var/www/html && \
    chown -R nginx:nginx /run/nginx && \
    chown -R nginx:nginx /var/log/nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
