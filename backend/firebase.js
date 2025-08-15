const admin = require("firebase-admin");
var serviceAccount = require("./firebase.json");

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://door-lock-d2b3b-default-rtdb.firebaseio.com",
};

let db = null;

try {
  // Check if Firebase is already init
  if (admin.apps.length === 0) {
    admin.initializeApp(firebaseConfig);
  }
  db = admin.database();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

class FirebaseManager {
  constructor() {
    this.db = db;
  }

  async writePirData(username, pirValue) {
    if (!this.db) {
      console.error("Firebase database not initialized");
      return;
    }

    try {
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0]; // Format: 2025-07-29
      const timestamp = now.toISOString(); // Format: 2025-07-29T16:00:30.257Z

      const pirData = {
        pir: parseInt(pirValue),
        time: timestamp,
      };

      const ref = this.db.ref(`${username}/${dateKey}/PIR`);
      await ref.push(pirData);

      console.log(
        `PIR data written to Firebase for user ${username}:`,
        pirData
      );
    } catch (error) {
      console.error("Error writing PIR data to Firebase:", error);
    }
  }

  async writeDoorHistory(username, doorStatus) {
    if (!this.db) {
      console.error("Firebase database not initialized");
      return;
    }

    try {
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0]; // Format: 2025-07-29
      const timestamp = now.toISOString(); // Format: 2025-07-29T16:00:30.257Z

      const doorData = {
        open: doorStatus === "open" ? 1 : 0,
        time: timestamp,
      };

      const ref = this.db.ref(`${username}/${dateKey}/historyDoor`);
      await ref.push(doorData);

      console.log(
        `Door history written to Firebase for user ${username}:`,
        doorData
      );
    } catch (error) {
      console.error("Error writing door history to Firebase:", error);
    }
  }
}

module.exports = FirebaseManager;
