# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Add a script to wait for the database to be ready
RUN apk add --no-cache netcat-openbsd

# Make the wait script executable
RUN chmod +x /app/wait-for-db.sh

# Define the command to run the application
CMD ["/bin/sh", "-c", "/app/wait-for-db.sh && node index.js"]
