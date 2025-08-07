const admin = require("firebase-admin");
var serviceAccount = require("./firebase.json");

const firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://door-lock-d2b3b-default-rtdb.firebaseio.com",
};

// Initialize Firebase Admin (without service account for public database)
let db = null;

try {
  // Check if Firebase is already initialized
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

  async writePasswordHistory(username, success) {
    if (!this.db) {
      console.error("Firebase database not initialized");
      return;
    }

    try {
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0]; // Format: 2025-07-29
      const timestamp = now.toISOString(); // Format: 2025-07-29T16:00:30.257Z

      const historyData = {
        success: success,
        time: timestamp,
      };

      const ref = this.db.ref(`${username}/${dateKey}/historyCheckPassword`);
      await ref.push(historyData);

      console.log(
        `Password history written to Firebase for user ${username}:`,
        historyData
      );
    } catch (error) {
      console.error("Error writing password history to Firebase:", error);
    }
  }

  async getUserPirData(username, date = null) {
    if (!this.db) {
      console.error("Firebase database not initialized");
      return [];
    }

    try {
      const dateKey = date || new Date().toISOString().split("T")[0];
      const ref = this.db.ref(`${username}/${dateKey}/PIR`);
      const snapshot = await ref.once("value");

      const data = snapshot.val();
      if (!data) return [];

      // Convert object to array with keys
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    } catch (error) {
      console.error("Error reading PIR data from Firebase:", error);
      return [];
    }
  }

  async getUserPasswordHistory(username, date = null) {
    if (!this.db) {
      console.error("Firebase database not initialized");
      return [];
    }

    try {
      const dateKey = date || new Date().toISOString().split("T")[0];
      const ref = this.db.ref(`${username}/${dateKey}/historyCheckPassword`);
      const snapshot = await ref.once("value");

      const data = snapshot.val();
      if (!data) return [];

      // Convert object to array with keys
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    } catch (error) {
      console.error("Error reading password history from Firebase:", error);
      return [];
    }
  }

  async getAllUserData(username) {
    if (!this.db) {
      console.error("Firebase database not initialized");
      return {};
    }

    try {
      const ref = this.db.ref(username);
      const snapshot = await ref.once("value");

      return snapshot.val() || {};
    } catch (error) {
      console.error("Error reading user data from Firebase:", error);
      return {};
    }
  }

}

module.exports = FirebaseManager;
