const express = require("express");
const FirebaseManager = require("../firebase");

const router = express.Router();
const firebase = new FirebaseManager();

// Get PIR data from Firebase for a specific user and date
router.get("/firebase/pir/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { date } = req.query; // Optional date parameter (YYYY-MM-DD format)

    const pirData = await firebase.getUserPirData(username, date);

    res.json({
      success: true,
      username: username,
      date: date || new Date().toISOString().split("T")[0],
      data: pirData,
    });
  } catch (error) {
    console.error("Error fetching PIR data from Firebase:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching PIR data from Firebase",
    });
  }
});

// Get password history from Firebase for a specific user and date
router.get("/firebase/password-history/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { date } = req.query; // Optional date parameter (YYYY-MM-DD format)

    const passwordHistory = await firebase.getUserPasswordHistory(
      username,
      date
    );

    res.json({
      success: true,
      username: username,
      date: date || new Date().toISOString().split("T")[0],
      data: passwordHistory,
    });
  } catch (error) {
    console.error("Error fetching password history from Firebase:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching password history from Firebase",
    });
  }
});

// Get all data from Firebase for a specific user
router.get("/firebase/all/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const allData = await firebase.getAllUserData(username);

    res.json({
      success: true,
      username: username,
      data: allData,
    });
  } catch (error) {
    console.error("Error fetching all user data from Firebase:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data from Firebase",
    });
  }
});

// Get today's summary for a user (both PIR and password history)
router.get("/firebase/today/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const [pirData, passwordHistory] = await Promise.all([
      firebase.getUserPirData(username, today),
      firebase.getUserPasswordHistory(username, today),
    ]);

    res.json({
      success: true,
      username: username,
      date: today,
      data: {
        PIR: pirData,
        historyCheckPassword: passwordHistory,
      },
    });
  } catch (error) {
    console.error("Error fetching today's data from Firebase:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching today's data from Firebase",
    });
  }
});

// Test Firebase connection
router.get("/firebase/test", async (req, res) => {
  try {
    const connected = await firebase.testConnection();

    res.json({
      success: true,
      connected: connected,
      message: connected
        ? "Firebase connection is active"
        : "Firebase connection failed",
    });
  } catch (error) {
    console.error("Error testing Firebase connection:", error);
    res.status(500).json({
      success: false,
      message: "Error testing Firebase connection",
    });
  }
});

// Manual write test data to Firebase
router.post("/firebase/test-write/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { type, value } = req.body;

    if (type === "pir") {
      await firebase.writePirData(username, value || 1);
      res.json({
        success: true,
        message: `Test PIR data written for user ${username}`,
      });
    } else if (type === "password") {
      await firebase.writePasswordHistory(
        username,
        value === "true" || value === true
      );
      res.json({
        success: true,
        message: `Test password history written for user ${username}`,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Use "pir" or "password"',
      });
    }
  } catch (error) {
    console.error("Error writing test data to Firebase:", error);
    res.status(500).json({
      success: false,
      message: "Error writing test data to Firebase",
    });
  }
});

module.exports = router;
