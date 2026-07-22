FROM php:8.4-cli-alpine AS base
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    unzip \
    curl \
    nginx \
    supervisor \
    nodejs \
    npm \
    && docker-php-ext-install pdo_pgsql pdo_mysql zip bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN npm ci && npm run build && rm -rf node_modules

RUN php artisan route:cache \
    && php artisan view:cache \
    && php artisan config:cache

RUN ln -s /app/storage/app/drive /app/public/drive

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 8080
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]