const { mapFields } = require("./fieldMapper");
const { routeBookingToConnector } = require("./restaurantRouter");
const { normalizeBookingTime } = require("./bookingParser");
const { run, get } = require("../db/sqlite");
const { logger } = require("../utils/logger");

function normalizeBooking(rawBooking = {}) {
  const guestCount = Number.parseInt(rawBooking.guestCount, 10) || 2;
  const table = guestCount > 6 ? "large_table" : "standard_table";

  return {
    customerName: String(rawBooking.customerName || "Guest").trim() || "Guest",
    bookingTime: normalizeBookingTime(rawBooking.bookingTime),
    guestCount,
    table,
    status: "CONFIRMED",
  };
}

async function saveBooking(restaurantId, booking, connectorResponse) {
  const insert = await run(
    `INSERT INTO bookings (
      restaurant_id,
      customer_name,
      booking_time,
      guest_count,
      table_type,
      status,
      connector_response
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      restaurantId,
      booking.customerName,
      booking.bookingTime,
      booking.guestCount,
      booking.table,
      booking.status,
      JSON.stringify(connectorResponse),
    ]
  );

  return get(
    `SELECT
      b.id,
      b.restaurant_id AS restaurantId,
      r.restaurant_name AS restaurantName,
      b.customer_name AS customerName,
      b.booking_time AS bookingTime,
      b.guest_count AS guestCount,
      b.table_type AS tableType,
      b.status,
      b.connector_response AS connectorResponse,
      b.created_at AS createdAt
    FROM bookings b
    JOIN restaurants r ON r.id = b.restaurant_id
    WHERE b.id = ?`,
    [insert.id]
  );
}

async function processBooking({ restaurant, bookingData, source = "manual_api" }) {
  const normalized = normalizeBooking(bookingData);
  const mappedPayload = mapFields(normalized, restaurant.fieldMapping);

  logger.info("Routing booking to connector", {
    restaurantId: restaurant.id,
    providerType: restaurant.providerType,
    source,
  });

  const connectorResponse = await routeBookingToConnector(restaurant, mappedPayload);
  const savedBooking = await saveBooking(restaurant.id, normalized, connectorResponse);

  return {
    success: Boolean(connectorResponse.ok),
    booking: {
      id: savedBooking.id,
      restaurantId: savedBooking.restaurantId,
      restaurantName: savedBooking.restaurantName,
      customerName: savedBooking.customerName,
      bookingTime: savedBooking.bookingTime,
      guestCount: savedBooking.guestCount,
      table: savedBooking.tableType,
      status: savedBooking.status,
      connectorResponse: JSON.parse(savedBooking.connectorResponse || "{}"),
      createdAt: savedBooking.createdAt,
    },
    normalizedBooking: normalized,
    mappedPayload,
    connectorResponse,
  };
}

module.exports = {
  normalizeBooking,
  processBooking,
  processIncomingBooking: processBooking,
};
