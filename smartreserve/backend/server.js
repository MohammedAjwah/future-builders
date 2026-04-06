require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDatabase } = require("./db/sqlite");
const authRoutes = require("./routes/auth");
const restaurantRoutes = require("./routes/restaurants");
const bookingRoutes = require("./routes/bookings");
const voiceRoutes = require("./routes/voice");
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
app.use("/", voiceRoutes);

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
