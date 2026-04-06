const { logger } = require("../utils/logger");

async function sendBooking(restaurant, payload) {
  logger.info("sheets_connector_scaffold_send", {
    restaurantId: restaurant.id,
    restaurantName: restaurant.restaurantName,
    payload,
  });

  return {
    ok: true,
    status: 200,
    provider: "sheets",
    body: "Sheets connector scaffold placeholder succeeded",
  };
}

async function testConnection(restaurant) {
  logger.info("sheets_connector_scaffold_test", {
    restaurantId: restaurant.id,
    restaurantName: restaurant.restaurantName,
  });

  return {
    ok: true,
    status: 200,
    provider: "sheets",
    body: "Sheets test scaffold successful",
  };
}

module.exports = {
  sendBooking,
  testConnection,
};
