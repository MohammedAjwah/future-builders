const express = require("express");
const { requireAuth } = require("../utils/auth");
const { listRecords, getRecordById } = require("../services/interactionService");
const { error } = require("../utils/logger");

const router = express.Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await listRecords();
    return res.json(rows);
  } catch (err) {
    error("List records failed", { error: err.message });
    return res.status(500).json({ error: "Failed to list records" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const item = await getRecordById(req.params.id);
    if (!item) return res.status(404).json({ error: "Record not found" });
    return res.json(item);
  } catch (err) {
    error("Get record failed", { error: err.message });
    return res.status(500).json({ error: "Failed to load record" });
  }
});

module.exports = router;
