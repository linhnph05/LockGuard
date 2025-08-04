#!/bin/sh

echo "Waiting for database to be ready..."

until nc -z db 3306; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready"
echo "Starting backend application..."
