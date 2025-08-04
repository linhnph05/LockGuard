#!/bin/bash
set -e

# Function to check if database is initialized
check_db_initialized() {
    # Try with the created user first, fall back to root if needed
    mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -h localhost -e "USE ${MYSQL_DATABASE}; SHOW TABLES;" 2>/dev/null | grep -q "pir_logs" || \
    mysql -u root -p${MYSQL_ROOT_PASSWORD} -h localhost -e "USE ${MYSQL_DATABASE}; SHOW TABLES;" 2>/dev/null | grep -q "pir_logs"
}

# Start MySQL with standard entrypoint
docker-entrypoint.sh mysqld &
MYSQL_PID=$!

echo "Waiting for MySQL to start..."
sleep 5

if mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -h localhost ${MYSQL_DATABASE} < /docker-entrypoint-initdb.d/01-init.sql 2>/dev/null; then
    echo "Manual initialization completed with user!"
elif mysql -u root -p${MYSQL_ROOT_PASSWORD} -h localhost ${MYSQL_DATABASE} < /docker-entrypoint-initdb.d/01-init.sql 2>/dev/null; then
    echo "Manual initialization completed with root!"
else
    echo "Manual initialization failed!"
    exit 1
fi

# Keep MySQL running
wait $MYSQL_PID
