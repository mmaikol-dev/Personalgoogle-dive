FROM php:8.3-cli-alpine AS base

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    unzip \
    curl \
    nginx \
    supervisor \
    && docker-php-ext-install pdo_pgsql pdo_mysql zip bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan config:cache

FROM node:22-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM base AS final

COPY --from=frontend /app/public/build /app/public/build

RUN ln -s /app/storage/app/drive /app/public/drive

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
