#!/bin/bash
set -e

# Function to check if database is initialized
check_db_initialized() {
    # Try with the created user first, fall back to root if needed
    mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -h localhost -e "USE ${MYSQL_DATABASE}; SHOW TABLES;" 2>/dev/null | grep -q "pir_logs" || \
    mysql -u root -p${MYSQL_ROOT_PASSWORD} -h localhost -e "USE ${MYSQL_DATABASE}; SHOW TABLES;" 2>/dev/null | grep -q "pir_logs"
}

# Function to wait for user to be created
wait_for_user() {
    echo "Waiting for user '${MYSQL_USER}' to be created..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -h localhost -e "SELECT 1;" 2>/dev/null; then
            echo "User '${MYSQL_USER}' is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo "User creation timeout, falling back to root user"
    return 1
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

# Wait for user creation and database setup
wait_for_user
sleep 5

# Check if initialization ran, if not run it manually
if ! check_db_initialized; then
    echo "Tables not found, running manual initialization..."
    
    # Try with the user first, then root
    if mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -h localhost ${MYSQL_DATABASE} < /docker-entrypoint-initdb.d/01-init.sql 2>/dev/null; then
        echo "Manual initialization completed with user!"
    elif mysql -u root -p${MYSQL_ROOT_PASSWORD} -h localhost ${MYSQL_DATABASE} < /docker-entrypoint-initdb.d/01-init.sql 2>/dev/null; then
        echo "Manual initialization completed with root!"
    else
        echo "Manual initialization failed!"
        exit 1
    fi
else
    echo "Database already initialized!"
fi

# Keep MySQL running
wait $MYSQL_PID
