require("dotenv").config();
const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(express.static("public")); // serve files from ./public

// Root route to serve the UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Avoid favicon 404s and CSP noise
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// CleverTap API endpoint to fetch user data (server proxy)
app.get("/api/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get CleverTap credentials from environment
    const PROJECT_ID = process.env.CLEVERTAP_PROJECT_ID;
    const PASSCODE = process.env.CLEVERTAP_PASSCODE;
    const REGION = process.env.CLEVERTAP_REGION || "eu1";
    
    if (!PROJECT_ID || !PASSCODE) {
      return res.status(500).json({
        error: "Missing CleverTap credentials. Please check your .env file."
      });
    }
    
    const BASE_URL = `https://${REGION}.api.clevertap.com/1`;
    
    // Use Project ID as Account ID (as per CleverTap docs)
    const headers = {
      "X-CleverTap-Account-Id": PROJECT_ID,  // Using Project ID as Account ID
      "X-CleverTap-Passcode": PASSCODE,
      "Content-Type": "application/json"
    };
    
    console.log(`Fetching user data for: ${userId}`);
    console.log(`API URL: ${BASE_URL}/profile.json?identity=${userId}`);
    console.log(`Using Project ID as Account ID: ${PROJECT_ID}`);
    console.log(`Headers:`, { ...headers, "X-CleverTap-Passcode": "***REDACTED***" });
    
    // Use GET method with query parameter (as per CleverTap docs)
    const response = await axios.get(`${BASE_URL}/profile.json?identity=${userId}`, {
      headers,
      timeout: 10000 // 10 second timeout
    });
    
    console.log("--- CleverTap API Response ---");
    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, response.data);
    
    res.json(response.data);
    
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    
    if (error.response) {
      // Server responded with error status
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
      
      res.status(error.response.status).json({
        error: "Failed to fetch user data from CleverTap",
        details: error.response.data,
        status: error.response.status
      });
    } else if (error.request) {
      // Request was made but no response received
      res.status(500).json({
        error: "No response from CleverTap API. Please check your network connection."
      });
    } else {
      // Something else happened
      res.status(500).json({
        error: "Error fetching user data",
        details: error.message
      });
    }
  }
});

// Web Inbox API endpoint to fetch inbox messages (server proxy)
app.get("/api/inbox/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get CleverTap credentials from environment
    const PROJECT_ID = process.env.CLEVERTAP_PROJECT_ID;
    const PASSCODE = process.env.CLEVERTAP_PASSCODE;
    const REGION = process.env.CLEVERTAP_REGION || "eu1";
    
    if (!PROJECT_ID || !PASSCODE) {
      return res.status(500).json({
        error: "Missing CleverTap credentials. Please check your .env file."
      });
    }
    
    const BASE_URL = `https://${REGION}.api.clevertap.com/1`;
    
    // Use Project ID as Account ID (as per CleverTap docs)
    const headers = {
      "X-CleverTap-Account-Id": PROJECT_ID,  // Using Project ID as Account ID
      "X-CleverTap-Passcode": PASSCODE,
      "Content-Type": "application/json"
    };
    
    console.log(`Fetching inbox messages for: ${userId}`);
    console.log(`API URL: ${BASE_URL}/inbox.json?identity=${userId}`);
    console.log(`Using Project ID as Account ID: ${PROJECT_ID}`);
    console.log(`Headers:`, { ...headers, "X-CleverTap-Passcode": "***REDACTED***" });
    
    // Use GET method with query parameter for Web Inbox
    const response = await axios.get(`${BASE_URL}/inbox.json?identity=${userId}`, {
      headers,
      timeout: 10000 // 10 second timeout
    });
    
    console.log("--- CleverTap Web Inbox API Response ---");
    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, response.data);
    
    res.json(response.data);
    
  } catch (error) {
    console.error("Error fetching inbox messages:", error.message);
    
    if (error.response) {
      // Server responded with error status
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
      
      res.status(error.response.status).json({
        error: "Failed to fetch inbox messages from CleverTap",
        details: error.response.data,
        status: error.response.status
      });
    } else if (error.request) {
      // Request was made but no response received
      res.status(500).json({
        error: "No response from CleverTap API. Please check your network connection."
      });
    } else {
      // Something else happened
      res.status(500).json({
        error: "Error fetching inbox messages",
        details: error.message
      });
    }
  }
});

// ---- Start server ----
app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
