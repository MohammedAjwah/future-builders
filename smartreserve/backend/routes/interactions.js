const express = require("express");
const { requireAuth } = require("../utils/auth");
const { listInteractions, getInteractionById } = require("../services/interactionService");
const { error } = require("../utils/logger");

const router = express.Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const items = await listInteractions();
    return res.json(items);
  } catch (err) {
    error("List interactions failed", { error: err.message });
    return res.status(500).json({ error: "Failed to list interactions" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const item = await getInteractionById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Interaction not found" });
    }
    return res.json(item);
  } catch (err) {
    error("Get interaction failed", { error: err.message });
    return res.status(500).json({ error: "Failed to load interaction" });
  }
});

module.exports = router;
