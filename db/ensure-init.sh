#!/bin/bash
set -e

# Function to check if database is initialized
check_db_initialized() {
    mysql -u root -p${MYSQL_ROOT_PASSWORD} -h localhost -e "USE ${MYSQL_DATABASE}; SHOW TABLES;" 2>/dev/null | grep -q "pir_logs"
}

# Start MySQL with standard entrypoint
docker-entrypoint.sh mysqld &
MYSQL_PID=$!

# Wait for MySQL to be ready
echo "Waiting for MySQL to start..."
until mysqladmin ping -h localhost --silent; do
    sleep 2
done
echo "MySQL is ready!"

# Wait a bit more for full initialization
sleep 10

# Check if initialization ran, if not run it manually
if ! check_db_initialized; then
    echo "Tables not found, running manual initialization..."
    
    # Execute the init script with root user
    if mysql -u root -p${MYSQL_ROOT_PASSWORD} -h localhost < /docker-entrypoint-initdb.d/01-init.sql; then
        echo "Manual initialization completed!"
    else
        echo "Manual initialization failed!"
        # Show more details for debugging
        echo "Environment variables:"
        echo "MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}"
        echo "MYSQL_DATABASE: ${MYSQL_DATABASE}"
        echo "MYSQL_USER: ${MYSQL_USER}"
        echo "Checking if database exists..."
        mysql -u root -p${MYSQL_ROOT_PASSWORD} -h localhost -e "SHOW DATABASES;" || echo "Cannot connect to MySQL"
        exit 1
    fi
else
    echo "Database already initialized!"
fi

# Keep MySQL running
wait $MYSQL_PID
