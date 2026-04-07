const express = require("express");
const { requireAuth } = require("../utils/auth");
const { get, all, run } = require("../db/sqlite");
const {
  validateRestaurantPayload,
  validateRestaurantOnboardingPayload,
  parseFieldMapping,
  sanitizePhoneNumber,
} = require("../utils/validators");
const { testRestaurantConnection } = require("../services/restaurantRouter");
const { info, error } = require("../utils/logger");

const router = express.Router();

function toRestaurantDto(row) {
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    phoneNumber: row.phone_number,
    address: row.address,
    workingHours: parseFieldMapping(row.working_hours_json),
    reservationsEnabled: Boolean(row.reservations_enabled),
    ordersEnabled: Boolean(row.orders_enabled),
    menu: row.menu_text_or_url,
    faq: parseFieldMapping(row.faq_json),
    smsEnabled: Boolean(row.sms_enabled),
    smsTemplate: row.sms_template,
    providerType: row.provider_type,
    webhookUrl: row.webhook_url,
    apiBaseUrl: row.api_base_url,
    apiKey: row.api_key,
    restaurantExternalId: row.restaurant_external_id,
    timezone: row.timezone,
    fieldMapping: parseFieldMapping(row.field_mapping),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

router.post("/", requireAuth, async (req, res) => {
  const validation = validateRestaurantOnboardingPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: "Validation failed", details: validation.errors });
  }

  const payload = validation.data;
  try {
    const result = await run(
      `INSERT INTO restaurants
      (
        restaurant_name, phone_number, address, working_hours_json, reservations_enabled,
        orders_enabled, menu_text_or_url, faq_json, sms_enabled, sms_template,
        provider_type, webhook_url, api_base_url, api_key, restaurant_external_id,
        timezone, field_mapping, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.restaurantName,
        sanitizePhoneNumber(payload.phoneNumber),
        payload.address,
        JSON.stringify(payload.workingHours),
        payload.reservationsEnabled ? 1 : 0,
        payload.ordersEnabled ? 1 : 0,
        payload.menu,
        JSON.stringify(payload.faq),
        payload.smsEnabled ? 1 : 0,
        payload.smsTemplate,
        payload.providerType,
        payload.webhookUrl,
        payload.apiBaseUrl,
        payload.apiKey,
        payload.restaurantExternalId,
        payload.timezone,
        JSON.stringify(payload.fieldMapping),
        payload.isActive ? 1 : 0,
      ]
    );
    const created = await get("SELECT * FROM restaurants WHERE id = ?", [result.id]);
    return res.status(201).json(toRestaurantDto(created));
  } catch (err) {
    error("Failed to create restaurant", { error: err.message });
    if (String(err.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "Phone number already exists" });
    }
    return res.status(500).json({ error: "Failed to create restaurant" });
  }
});

router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await all("SELECT * FROM restaurants ORDER BY created_at DESC, id DESC");
    return res.json(rows.map(toRestaurantDto));
  } catch (err) {
    error("Failed to list restaurants", { error: err.message });
    return res.status(500).json({ error: "Failed to list restaurants" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const row = await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
    if (!row) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    return res.json(toRestaurantDto(row));
  } catch (err) {
    error("Failed to get restaurant", { error: err.message });
    return res.status(500).json({ error: "Failed to get restaurant" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const merged = {
      restaurantName: req.body.restaurantName ?? existing.restaurant_name,
      phoneNumber: req.body.phoneNumber ?? existing.phone_number,
      address: req.body.address ?? existing.address,
      workingHours:
        req.body.workingHours !== undefined
          ? parseFieldMapping(req.body.workingHours)
          : parseFieldMapping(existing.working_hours_json),
      reservationsEnabled:
        req.body.reservationsEnabled !== undefined
          ? Boolean(req.body.reservationsEnabled)
          : Boolean(existing.reservations_enabled),
      ordersEnabled:
        req.body.ordersEnabled !== undefined
          ? Boolean(req.body.ordersEnabled)
          : Boolean(existing.orders_enabled),
      menu: req.body.menu ?? existing.menu_text_or_url,
      faq:
        req.body.faq !== undefined
          ? parseFieldMapping(req.body.faq)
          : parseFieldMapping(existing.faq_json),
      smsEnabled:
        req.body.smsEnabled !== undefined
          ? Boolean(req.body.smsEnabled)
          : Boolean(existing.sms_enabled),
      smsTemplate: req.body.smsTemplate ?? existing.sms_template,
      providerType: req.body.providerType ?? existing.provider_type,
      webhookUrl: req.body.webhookUrl ?? existing.webhook_url,
      apiBaseUrl: req.body.apiBaseUrl ?? existing.api_base_url,
      apiKey: req.body.apiKey ?? existing.api_key,
      restaurantExternalId:
        req.body.restaurantExternalId ?? existing.restaurant_external_id,
      timezone: req.body.timezone ?? existing.timezone,
      fieldMapping:
        req.body.fieldMapping !== undefined
          ? parseFieldMapping(req.body.fieldMapping)
          : parseFieldMapping(existing.field_mapping),
      isActive:
        req.body.isActive !== undefined
          ? Boolean(req.body.isActive)
          : Boolean(existing.is_active),
    };

    const validation = validateRestaurantOnboardingPayload(merged);
    if (!validation.valid) {
      return res.status(400).json({ error: "Validation failed", details: validation.errors });
    }

    const payload = validation.data;
    await run(
      `UPDATE restaurants SET
      restaurant_name = ?,
      phone_number = ?,
      address = ?,
      working_hours_json = ?,
      reservations_enabled = ?,
      orders_enabled = ?,
      menu_text_or_url = ?,
      faq_json = ?,
      sms_enabled = ?,
      sms_template = ?,
      provider_type = ?,
      webhook_url = ?,
      api_base_url = ?,
      api_key = ?,
      restaurant_external_id = ?,
      timezone = ?,
      field_mapping = ?,
      is_active = ?
      WHERE id = ?`,
      [
        payload.restaurantName,
        sanitizePhoneNumber(payload.phoneNumber),
        payload.address,
        JSON.stringify(payload.workingHours),
        payload.reservationsEnabled ? 1 : 0,
        payload.ordersEnabled ? 1 : 0,
        payload.menu,
        JSON.stringify(payload.faq),
        payload.smsEnabled ? 1 : 0,
        payload.smsTemplate,
        payload.providerType,
        payload.webhookUrl,
        payload.apiBaseUrl,
        payload.apiKey,
        payload.restaurantExternalId,
        payload.timezone,
        JSON.stringify(payload.fieldMapping),
        payload.isActive ? 1 : 0,
        req.params.id,
      ]
    );

    const updated = await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
    return res.json(toRestaurantDto(updated));
  } catch (err) {
    error("Failed to update restaurant", { error: err.message });
    if (String(err.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "Phone number already exists" });
    }
    return res.status(500).json({ error: "Failed to update restaurant" });
  }
});

router.post("/:id/test", requireAuth, async (req, res) => {
  try {
    const restaurant = await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const result = await testRestaurantConnection(restaurant);
    return res.json({
      success: Boolean(result.ok),
      providerType: restaurant.provider_type,
      result,
    });
  } catch (err) {
    error("Failed restaurant test connection", { error: err.message });
    return res.status(500).json({
      success: false,
      error: "Connection test failed",
      details: err.message,
    });
  }
});

router.post("/:id/toggle", requireAuth, async (req, res) => {
  try {
    const existing = await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const nextActive = existing.is_active ? 0 : 1;
    await run("UPDATE restaurants SET is_active = ? WHERE id = ?", [nextActive, req.params.id]);
    const updated = await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
    info("Toggled restaurant status", { restaurantId: req.params.id, isActive: Boolean(nextActive) });
    return res.json(toRestaurantDto(updated));
  } catch (err) {
    error("Failed to toggle restaurant", { error: err.message });
    return res.status(500).json({ error: "Failed to toggle restaurant" });
  }
});

module.exports = router;
