const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const { User, Alert } = require("../models");
const { sendVerificationEmail, sendAlertEmail, sendWelcomeEmail } = require("../services/emailService");
const logger = require("../utils/logger");

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isVerified && !user.isAdmin) {
      return res.status(401).json({ error: "Please verify your email first" });
    }

    // Set session
    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;
    req.session.userEmail = user.email;

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await User.create({
      email,
      password,
      verificationToken,
      isVerified: false,
      isAdmin: false
    });

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account."
    });

  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Register with Alert - UPDATED TO USE PENDING DATA
router.post("/register-with-alert", async (req, res) => {
  try {
    const { email, password, alertName, keywords } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (!alertName || !keywords) {
      return res.status(400).json({ error: "Alert name and keywords required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Store alert data in pendingAlertData - will be created AFTER verification
    const pendingAlertData = {
      alertName,
      keywords,
      frequency: "weekly"
    };

    // Create user with verification token and pending alert data
    const user = await User.create({
      email,
      password,
      verificationToken,
      pendingAlertData,
      isVerified: false,
      isAdmin: false
    });

    logger.info(`Created user ${user.email} with pending alert data, awaiting verification`);

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account and activate your alert.",
      requiresVerification: true
    });

  } catch (error) {
    logger.error("Registration with alert error:", error);
    res.status(500).json({ error: "Registration failed: " + error.message });
  }
});

// Verify email - UPDATED TO CREATE ALERT AFTER VERIFICATION
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send("<h1>Error</h1><p>Verification token is missing.</p>");
    }

    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).send("<h1>Error</h1><p>Invalid or expired verification token.</p>");
    }

    // Mark email as verified
    await user.update({
      isVerified: true,
      verificationToken: null
    });

    logger.info(`Email verified for user ${user.email}`);

    // NOW create the alert if there is pending data
    if (user.pendingAlertData) {
      try {
        const alertData = user.pendingAlertData;
        
        const alert = await Alert.create({
          userId: user.id,
          name: alertData.alertName,
          keywords: alertData.keywords,
          query: alertData.keywords,
          frequency: alertData.frequency || "weekly",
          isActive: true
        });

        logger.info(`Created alert ${alert.id} for verified user ${user.email}`);

        // Send immediate welcome email with alert info
        try {
          logger.info(`Sending welcome alert email for alert ${alert.id}`);
          await sendAlertEmail(user, alert, [], null);
          logger.info(`Welcome alert email sent for alert ${alert.id}`);
          
          // Mark alert as sent
          await alert.update({ lastSentAt: new Date() });
        } catch (emailError) {
          logger.error(`Error sending welcome alert email for ${alert.id}:`, emailError);
        }

        // Clear pending data
        await user.update({ pendingAlertData: null });

        const siteUrl = process.env.SITE_URL || "http://51.178.253.51:3000";

        // Redirect to success page with message
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verified!</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              h1 { color: #3b82f6; }
              .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; }
              a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
            </style>
          </head>
          <body>
            <h1>✅ Email Verified Successfully!</h1>
            <div class="success">
              Your email has been verified and your alert is now active.
            </div>
            <div class="info">
              <strong>Alert Created:</strong> ${alert.name}<br>
              <strong>Keywords:</strong> ${alert.keywords}<br>
              <strong>Frequency:</strong> ${alert.frequency}
            </div>
            <p>You should receive a welcome email shortly with your first alert digest.</p>
            <a href="${siteUrl}">Go to Dashboard</a>
          </body>
          </html>
        `);

      } catch (alertError) {
        logger.error(`Error creating alert after verification:`, alertError);
        const siteUrl = process.env.SITE_URL || "http://51.178.253.51:3000";
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verified</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Email Verified</h1>
            <p>Your email has been verified, but there was an error creating your alert. Please log in to create a new alert.</p>
            <a href="${siteUrl}">Go to Dashboard</a>
          </body>
          </html>
        `);
      }
    } else {
      const siteUrl = process.env.SITE_URL || "http://51.178.253.51:3000";
      // No pending alert, just verified email
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified!</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            h1 { color: #3b82f6; }
            a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <h1>✅ Email Verified!</h1>
          <p>Your email has been verified successfully. You can now log in and create alerts.</p>
          <a href="${siteUrl}">Go to Dashboard</a>
        </body>
        </html>
      `);
    }

  } catch (error) {
    logger.error("Email verification error:", error);
    res.status(500).send("<h1>Error</h1><p>Verification failed. Please try again or contact support.</p>");
  }
});

// Old verify-email endpoint for backwards compatibility
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  if (token) {
    // Redirect to new endpoint
    res.redirect(`/api/auth/verify-email/${token}`);
  } else {
    res.status(400).json({ error: "Token required" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Check auth status
router.get("/status", (req, res) => {
  res.json({
    isAuthenticated: !!req.session.userId,
    isAdmin: !!req.session.isAdmin,
    email: req.session.userEmail || null
  });
});

module.exports = router;
