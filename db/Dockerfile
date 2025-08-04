FROM mysql:8.0

# Copy initialization script to the proper directory
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

EXPOSE 3306
