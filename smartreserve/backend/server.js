require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDatabase } = require("./db/sqlite");
const authRoutes = require("./routes/auth");
const restaurantRoutes = require("./routes/restaurants");
const bookingRoutes = require("./routes/bookings");
const voiceRoutes = require("./routes/voice");
const voiceInputRoutes = require("./routes/voiceInput");
const interactionRoutes = require("./routes/interactions");
const recordRoutes = require("./routes/records");
const { requireAuth } = require("./utils/auth");
const { info, error } = require("./utils/logger");

const app = express();
const PORT = Number.parseInt(process.env.PORT || "3000", 10);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  info(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/api/restaurants", requireAuth, restaurantRoutes);
app.use("/api/bookings", requireAuth, bookingRoutes);
app.use("/api/interactions", requireAuth, interactionRoutes);
app.use("/api/records", requireAuth, recordRoutes);
app.use("/", voiceInputRoutes);
app.use("/", voiceRoutes);
app.get("/api/elevenlabs/token", requireAuth, async (_req, res) => {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID || "";
    if (!agentId) {
      return res.status(400).json({ error: "ELEVENLABS_AGENT_ID is not configured" });
    }
    const { getElevenLabsConversationToken } = require("./services/voiceBridgeService");
    const token = await getElevenLabsConversationToken(agentId);
    return res.json({ token, agentId });
  } catch (err) {
    error("Failed to generate ElevenLabs token", { error: err.message });
    return res.status(500).json({ error: "Failed to generate ElevenLabs token" });
  }
});

app.use((err, _req, res, _next) => {
  error("Unhandled error", { error: err.message });
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    info(`SmartReserve backend running on port ${PORT}`);
  });
}

start();
