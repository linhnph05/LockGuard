const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { authRoutes } = require("./routes/auth");
const { servoRoutes, setMqttManager } = require("./routes/servo");
const MQTTManager = require("./mqtt");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/servo", servoRoutes);

// Initialize MQTT Manager
console.log("Initializing MQTT Manager...");
const mqttManager = new MQTTManager();

// Set MQTT manager reference for servo routes
setMqttManager(mqttManager);

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
