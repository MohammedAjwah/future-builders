const { get } = require("../db/sqlite");
const {
  sendBooking: sendMake,
  testConnection: testMake,
} = require("../connectors/makeConnector");
const {
  sendBooking: sendCustomApi,
  testConnection: testCustomApi,
} = require("../connectors/customApiConnector");
const {
  sendBooking: sendSquare,
  testConnection: testSquare,
} = require("../connectors/squareConnector");
const {
  sendBooking: sendSheets,
  testConnection: testSheets,
} = require("../connectors/sheetsConnector");
const { sendPayload: sendWebhookPayload } = require("../connectors/webhookConnector");

function normalizeRestaurant(restaurant = {}) {
  return {
    id: restaurant.id,
    restaurantName: restaurant.restaurantName || restaurant.restaurant_name || "",
    phoneNumber: restaurant.phoneNumber || restaurant.phone_number || "",
    providerType: restaurant.providerType || restaurant.provider_type || "",
    webhookUrl: restaurant.webhookUrl || restaurant.webhook_url || "",
    apiBaseUrl: restaurant.apiBaseUrl || restaurant.api_base_url || "",
    apiKey: restaurant.apiKey || restaurant.api_key || "",
    restaurantExternalId:
      restaurant.restaurantExternalId || restaurant.restaurant_external_id || "",
    timezone: restaurant.timezone || "UTC",
    fieldMapping: restaurant.fieldMapping || restaurant.field_mapping || "{}",
    isActive:
      restaurant.isActive !== undefined
        ? Boolean(restaurant.isActive)
        : Boolean(restaurant.is_active),
    createdAt: restaurant.createdAt || restaurant.created_at,
  };
}

function toPhoneVariants(phoneRaw) {
  const raw = String(phoneRaw || "").trim();
  if (!raw) {
    return [];
  }
  const digits = raw.replace(/\D/g, "");
  const variants = new Set([raw, digits]);
  if (digits.length === 10) {
    variants.add(`+1${digits}`);
  }
  if (digits.length > 10) {
    variants.add(`+${digits}`);
    variants.add(digits.slice(-10));
  }
  return Array.from(variants).filter(Boolean);
}

function mapRestaurantRow(row) {
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    phoneNumber: row.phone_number,
    providerType: row.provider_type,
    webhookUrl: row.webhook_url,
    apiBaseUrl: row.api_base_url,
    apiKey: row.api_key,
    restaurantExternalId: row.restaurant_external_id,
    timezone: row.timezone,
    fieldMapping: row.field_mapping,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

async function getRestaurantByPhone(phoneNumber) {
  const variants = toPhoneVariants(phoneNumber);
  if (!variants.length) {
    return null;
  }

  for (const phone of variants) {
    const row = await get(
      "SELECT * FROM restaurants WHERE phone_number = ? AND is_active = 1 LIMIT 1",
      [phone]
    );
    if (row) {
      return mapRestaurantRow(row);
    }
  }
  return null;
}

async function getRestaurantById(id) {
  const row = await get("SELECT * FROM restaurants WHERE id = ?", [id]);
  if (!row) return null;
  return mapRestaurantRow(row);
}

async function routeBookingToConnector(restaurant, payload) {
  const normalized = normalizeRestaurant(restaurant);
  // If a webhook is configured, it is the primary SmartReserve integration channel.
  if (normalized.webhookUrl) {
    return sendWebhookPayload(normalized.webhookUrl, payload);
  }
  switch (normalized.providerType) {
    case "make":
      return sendMake(normalized, payload);
    case "custom_api":
      return sendCustomApi(normalized, payload);
    case "square":
      return sendSquare(normalized, payload);
    case "sheets":
      return sendSheets(normalized, payload);
    default:
      throw new Error(`Unsupported provider type: ${normalized.providerType}`);
  }
}

async function sendTestBooking(restaurant, payload) {
  const normalized = normalizeRestaurant(restaurant);
  if (normalized.webhookUrl) {
    return sendWebhookPayload(normalized.webhookUrl, payload);
  }
  switch (normalized.providerType) {
    case "make":
      return testMake(normalized, payload);
    case "custom_api":
      return testCustomApi(normalized, payload);
    case "square":
      return testSquare(normalized, payload);
    case "sheets":
      return testSheets(normalized, payload);
    default:
      throw new Error(`Unsupported provider type: ${normalized.providerType}`);
  }
}

async function testRestaurantConnection(restaurant) {
  const normalized = normalizeRestaurant(restaurant);
  return sendTestBooking(restaurant, {
    event: "connection_test",
    restaurantId: normalized.id,
    restaurantName: normalized.restaurantName,
    timestamp: new Date().toISOString(),
  });
}

const findRestaurantByPhone = getRestaurantByPhone;

module.exports = {
  getRestaurantById,
  getRestaurantByPhone,
  findRestaurantByPhone,
  routeBookingToConnector,
  sendTestBooking,
  testRestaurantConnection,
  mapRestaurantRow,
  normalizeRestaurant,
};
