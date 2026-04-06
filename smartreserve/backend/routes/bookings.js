const express = require("express");
const { get, all } = require("../db/sqlite");
const { processBooking } = require("../services/bookingProcessor");
const { validateBookingInput } = require("../utils/validators");
const { requireAuth } = require("../utils/auth");
const { logger } = require("../utils/logger");
const { mapRestaurantRow } = require("../services/restaurantRouter");

const router = express.Router();

function parseConnectorResponse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return value;
  }
}

function mapBooking(row) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    customerName: row.customer_name,
    bookingTime: row.booking_time,
    guestCount: row.guest_count,
    table: row.table_type,
    status: row.status,
    connectorResponse: parseConnectorResponse(row.connector_response),
    createdAt: row.created_at,
  };
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const validation = validateBookingInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    const restaurantId = Number.parseInt(req.body.restaurantId, 10);
    const { customerName, bookingTime, guestCount } = validation.data;
    if (!Number.isFinite(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ error: "restaurantId is required" });
    }

    const restaurant = await get("SELECT * FROM restaurants WHERE id = ?", [restaurantId]);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    if (!restaurant.is_active) {
      return res.status(400).json({ error: "Restaurant is disabled" });
    }

    const result = await processBooking({
      restaurant: mapRestaurantRow(restaurant),
      bookingData: { customerName, bookingTime, guestCount },
      source: "admin_manual",
    });

    if (!result.success) {
      return res.status(502).json({
        error: "Failed to route booking to provider",
        details: result.connectorResponse,
      });
    }

    const row = await get(
      `SELECT
        b.*,
        r.restaurant_name
      FROM bookings b
      JOIN restaurants r ON r.id = b.restaurant_id
      WHERE b.id = ?`,
      [result.booking.id]
    );

    return res.status(201).json({
      booking: mapBooking(row),
      routedPayload: result.mappedPayload,
    });
  } catch (err) {
    logger.error("Create booking failed", { error: err.message });
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await all(
      `SELECT
        b.*,
        r.restaurant_name
      FROM bookings b
      JOIN restaurants r ON r.id = b.restaurant_id
      ORDER BY datetime(b.created_at) DESC, b.id DESC`
    );
    return res.json(rows.map(mapBooking));
  } catch (err) {
    logger.error("List bookings failed", { error: err.message });
    return res.status(500).json({ error: "Failed to list bookings" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const row = await get(
      `SELECT
        b.*,
        r.restaurant_name
      FROM bookings b
      JOIN restaurants r ON r.id = b.restaurant_id
      WHERE b.id = ?`,
      [req.params.id]
    );
    if (!row) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.json(mapBooking(row));
  } catch (err) {
    logger.error("Get booking failed", { error: err.message });
    return res.status(500).json({ error: "Failed to load booking" });
  }
});

module.exports = router;
