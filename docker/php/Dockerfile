FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git curl zip unzip \
    libpng-dev libonig-dev libxml2-dev libicu-dev libpq-dev libzip-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# btree_gist / EXCLUDE / RLS live in Postgres; the PHP side just needs pdo_pgsql.
RUN docker-php-ext-install pdo pdo_pgsql mbstring pcntl bcmath gd intl zip
RUN pecl install redis && docker-php-ext-enable redis

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
RUN git config --global --add safe.directory /var/www
