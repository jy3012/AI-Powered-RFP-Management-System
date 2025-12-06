import express from "express";
const router = express.Router();

// Example webhook route
router.post("/", (req, res) => {
  res.json({ message: "Webhook received!" });
});

export default router; // <-- VERY IMPORTANT
