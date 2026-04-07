const express = require("express");
const {
  getRestaurantById,
  getRestaurantByPhone,
  normalizeRestaurant,
} = require("../services/restaurantRouter");
const { parseVoiceInputPayload, sanitizePhoneNumber } = require("../utils/validators");
const { orchestrateVoiceInput } = require("../services/orchestratorService");
const { error } = require("../utils/logger");

const router = express.Router();

router.post("/voice-input", async (req, res) => {
  try {
    const parsedInput = parseVoiceInputPayload(req.body);
    if (!parsedInput.valid) {
      return res.status(400).json({ error: parsedInput.error });
    }

    const payload = parsedInput.data;
    const customerPhone = sanitizePhoneNumber(payload.phoneNumber);

    let restaurant = null;
    if (payload.restaurantId) {
      const row = await getRestaurantById(payload.restaurantId);
      restaurant = row ? normalizeRestaurant(row) : null;
    } else if (payload.restaurantPhone) {
      restaurant = await getRestaurantByPhone(payload.restaurantPhone);
    }

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    if (!restaurant.isActive) {
      return res.status(400).json({ error: "Restaurant is disabled" });
    }

    const result = await orchestrateVoiceInput({
      restaurant,
      text: payload.text,
      phoneNumber: customerPhone,
      sourceSessionId: payload.conversationId || "",
      source: "voice_input",
    });

    return res.json({
      success: true,
      interactionId: result.interaction.id,
      recordId: result.record ? result.record.id : null,
      intent: result.ai.intent,
      isComplete: result.ai.isComplete,
      response: result.ai.response,
      action: result.actionRequired ? "routed" : "none",
      connectorStatus: result.connectorStatus,
      connectorResponse: result.connectorResponse,
      smsStatus: result.smsStatus,
      smsResponse: result.smsResponse,
      routedPayload: result.routedPayload,
    });
  } catch (err) {
    error("voice-input processing failed", { error: err.message });
    return res.status(500).json({ error: "Failed to process voice input" });
  }
});

module.exports = router;
