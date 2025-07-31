FROM mysql:8.0

# Copy the initialization script and custom entrypoint
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY ensure-init.sh /ensure-init.sh

# Make the script executable
RUN chmod +x /ensure-init.sh

# Use the custom initialization script
ENTRYPOINT ["/ensure-init.sh"]

# Expose MySQL port
EXPOSE 3306
