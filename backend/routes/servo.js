const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");

const servoRoutes = express.Router();
let mqttManager = null;

const setMqttManager = (manager) => {
  mqttManager = manager;
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(500).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Invalid token" });
  }
};

servoRoutes.post("/control", verifyToken, async (req, res) => {
  try {
    const { action } = req.body; 
    const username = req.user.username;

    if (!action || !["open", "close"].includes(action)) {
      return res.status(400).json({error: "Invalid action. Must be 'open' or 'close'",});
    }

    if (!mqttManager) {
      return res.status(500).json({error: "MQTT manager not available",});
    }

    mqttManager.publishToUserTopic(username, "servo", action);
    mqttManager.publishToUserTopic(username, "led", action === "open" ? "green" : "red");
    mqttManager.publishToUserTopic(username, "buzzer", action === "open" ? "buzzer_success" : "buzzer_fail");

    res.json({
      message: `Servo ${action} command sent successfully`,
      action: action,
      username: username,
    });
  } catch (error) {
    console.error("Servo control error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = { servoRoutes, setMqttManager };
