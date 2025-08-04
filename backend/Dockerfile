FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

RUN apk add --no-cache netcat-openbsd

# Make the wait script executable
RUN chmod +x /app/waitDB.sh

# Define the command to run the application
CMD ["/bin/sh", "-c", "/app/waitDB.sh && node index.js"]
