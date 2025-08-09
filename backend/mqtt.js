const mqtt = require("mqtt");
const db = require("./db");
const {createTransporter} = require("./routes/auth");
const FirebaseManager = require("./firebase");


class MQTTManager {
  constructor() {
    this.client = null;
    this.subscribedTopics = new Set();
    this.mqttBrokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
    this.mqttUsername = process.env.MQTT_USERNAME || "";
    this.mqttPassword = process.env.MQTT_PASSWORD || "";
    this.firebase = new FirebaseManager();

    this.init();
  }

  init() {
    console.log("Initializing MQTT connection...");

    const options = {
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      keepalive: 60,
    };

    // Add credentials if provided
    if (this.mqttUsername && this.mqttPassword) {
      options.username = this.mqttUsername;
      options.password = this.mqttPassword;
    }

    this.client = mqtt.connect(this.mqttBrokerUrl, options);

    this.client.on("connect", () => {
      console.log("Connected to MQTT broker");
      this.subscribeToAllUserTopics();
    });

    this.client.on("message", (topic, message) => {
      this.handleMessage(topic, message.toString());
    });

    this.client.on("error", (error) => {
      console.error("MQTT connection error:", error);
    });

    this.client.on("offline", () => {
      console.log("MQTT client is offline");
    });

    this.client.on("reconnect", () => {
      console.log("MQTT client reconnecting...");
    });
  }

  async getAllUsers() {
    try {
      const [rows] = await db.execute("SELECT username FROM users");
      return rows.map((row) => row.username);
    } catch (error) {
      console.error("Error fetching users from database:", error);
      return [];
    }
  }

  async subscribeToAllUserTopics() {
    try {
      const usernames = await this.getAllUsers();
      console.log(`Found ${usernames.length} users in database`);

      for (const username of usernames) {
        await this.subscribeToUserTopics(username);
      }
    } catch (error) {
      console.error("Error subscribing to user topics:", error);
    }
  }

  async subscribeToUserTopics(username) {
    const topics = [`${username}/esp32/pir`, `${username}/esp32/password`, `${username}/esp32/notify`];

    for (const topic of topics) {
      if (!this.subscribedTopics.has(topic)) {
        this.client.subscribe(topic, (err) => {
          if (!err) {
            console.log(`Subscribed to topic: ${topic}`);
            this.subscribedTopics.add(topic);
          } else {
            console.error(`Failed to subscribe to topic ${topic}:`, err);
          }
        });
      }
    }
  }

  async handleMessage(topic, message) {
    console.log(`Received message on topic ${topic}: ${message}`);

    const topicParts = topic.split("/");
    if (topicParts.length < 3) {
      console.error("Invalid topic format:", topic);
      return;
    }

    const username = topicParts[0];
    const sensorType = topicParts[2];

    try {
      switch (sensorType) {
        case "pir":
          await this.handlePirData(username, message);
          break;
        case "password":
          await this.handlePasswordData(username, message);
          break;
        case "notify":
          await this.handleNotification(username, message);
          break;
        default:
          console.log(`Unknown sensor type: ${sensorType}`);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  async handlePirData(username, pirValue) {
    try {
      // Write to Firebase
      await this.firebase.writePirData(username, pirValue);
      console.log(`PIR data stored for user ${username}: ${pirValue}`);
    } catch (error) {
      console.error("Error handling PIR data:", error);
    }
  }

  async handlePasswordData(username, password) {
    try {
      const isValid = await this.verifyUserPassword(username, password);

      if (isValid) {
        console.log(`Valid password received for user ${username}`);
        // Write success to Firebase
        await this.firebase.writePasswordHistory(username, true);

        this.publishToUserTopic(username, "led", "green");
        this.publishToUserTopic(username, "buzzer", "buzzer_success");
        this.publishToUserTopic(username, "servo", "open");
      } else {
        console.log(`Invalid password received for user ${username}`);
        // Write failure to Firebase
        await this.firebase.writePasswordHistory(username, false);

        this.publishToUserTopic(username, "led", "red");
        this.publishToUserTopic(username, "buzzer", "buzzer_fail");
      }
    } catch (error) {
      console.error("Error handling password data:", error);
    }
  }

  async verifyUserPassword(username, password) {
    try {
      const [rows] = await db.execute(
        "SELECT passwordKey FROM users WHERE username = ?",
        [username]
      );

      if (rows.length === 0) {
        console.log(`User ${username} not found`);
        return false;
      }

      return rows[0].passwordKey === password;
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }

  publishToUserTopic(username, device, message) {
    const topic = `${username}/esp32/${device}`;

    this.client.publish(topic, message, (err) => {
      if (!err) {
        console.log(`Published to ${topic}: ${message}`);
      } else {
        console.error(`Failed to publish to ${topic}:`, err);
      }
    });
  }

  async handleNotification(username, notificationValue) {
    if(notificationValue === "1") {
      try {
        const [users] = await db.query("SELECT email FROM users WHERE username = ?", [username]);
        if (users.length > 0) {
          const userEmail = users[0].email;
          console.log(`Sending notification to ${userEmail}: Someone is at the door!`);
          const transporter = createTransporter();
          const dashboardUrl = "http://localhost/";
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `LockGuard - Ai đó đang cố gắng đột nhập nhà của bạn ${username} ơi!`,
            html: `
              <h1>Thông báo từ LockGuard</h1>
              <p>Hệ thống phát hiện có người đang cố gắng đột nhập vào nhà của bạn! Vui lòng kiểm tra ngay lập tức!</p>
              <p>Hãy đăng nhập dashboard ngay: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
            `,
          };
          try {
            await transporter.sendMail(mailOptions);
          } catch (emailError) {
            console.error("Gửi thông báo email thất bại:", emailError);
          }
        }
        await fetch(`https://www.pushsafer.com/api?k=i0aigx951gH6kX0mtQfD&m=%5Bcolor%3D%23000000%5DLockGuard%20-%20Ai%20%C4%91%C3%B3%20%C4%91ang%20c%E1%BB%91%20g%E1%BA%AFng%20%C4%91%E1%BB%99t%20nh%E1%BA%ADp%20nh%C3%A0%20c%E1%BB%A7a%20b%E1%BA%A1n%20${username}%20%C6%A1i!%5B%2Fcolor%5D`, {
          method: "GET",
        });
      } catch (error) {
        console.error("Error handling notification:", error);
      }
    }
  }
}

module.exports = MQTTManager;
