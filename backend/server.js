require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Routes
const rfpRoutes = require("./routes/rfpRoutes");
const vendorRoutes = require("./routes/vendors");

// Create Express app FIRST
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/rfp", rfpRoutes);
app.use("/api/vendors", vendorRoutes);

// Port
const PORT = process.env.PORT || 5000;

/* -------------------- MongoDB Connection -------------------- */
(async function connectDB() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected");
    } else {
      console.warn("MONGO_URI not set — skipping DB connection");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
})();

/* -------------------- Start Server -------------------- */
app.listen(PORT, () => console.log("Server started on", PORT));

/* -------------------- Optional: IMAP Listener -------------------- */
if (process.env.DISABLE_IMAP !== "true") {
  const { startImap, getImapStatus } = require("./services/imapListener");
  console.log("Attempting to start IMAP listener...");
  startImap().catch((err) => {
    console.error("IMAP initialization error:", err.message || err);
  });
  
  // Add IMAP status endpoint for debugging
  app.get("/api/imap/status", (req, res) => {
    const status = getImapStatus();
    res.json(status);
  });
} else {
  console.log("IMAP disabled (DISABLE_IMAP=true)");
  app.get("/api/imap/status", (req, res) => {
    res.json({ status: 'disabled', message: 'IMAP is disabled via DISABLE_IMAP=true' });
  });
}
