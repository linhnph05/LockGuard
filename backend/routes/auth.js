const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const db = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const authRoutes = express.Router();

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log("Email User:", emailUser);
  console.log("Email Pass:", emailPass);

  if (!emailUser || !emailPass) {
    console.warn(
      "Wrong email config. Please contact the admin to fix this issue."
    );
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

authRoutes.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existingUsers.length == 0) {
      return res.status(400).json({ error: "Username not exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result] = await db.query(
      "UPDATE users SET email = ?, password = ? WHERE username = ?",
      [email, hashedPassword, username]
    );

    res
      .status(201)
      .json({ message: "User created successfully", userId: result.insertId });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRoutes.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, username]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRoutes.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }
    const user = users[0];

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [resetToken, resetTokenExpires, user.id]
    );

    const transporter = createTransporter();
    if (!transporter) {
      return res.json({
        message:
          "Something wrong with email config. Please contact the admin to fix this issue.",
        resetToken: resetToken,
      });
    }

    const resetUrl = `http://localhost/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "LockGuard - Password Reset",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your LockGuard account.</p>
        <p>Here is the link to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Password reset email sent" });
    } catch (emailError) {
      console.error("Email sending fail:", emailError);
      res.json({
        message:
          "Email sending failed, but reset token generated. Check server logs.",
        resetToken: resetToken,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRoutes.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const user = users[0];

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change passwordKey for IoT device
authRoutes.post("/change-password-key", async (req, res) => {
  try {
    const { newPasswordKey } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    if (!newPasswordKey) {
      return res.status(400).json({ error: "New password key is required" });
    }

    if (newPasswordKey.length !== 6) {
      return res
        .status(400)
        .json({ error: "Password key must be exactly 6 characters" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Get current user data
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Update password key directly (no current password verification needed)
    await db.query("UPDATE users SET passwordKey = ? WHERE id = ?", [
      newPasswordKey,
      userId,
    ]);

    res.json({
      message: "Password key updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Change password key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {authRoutes, createTransporter};
