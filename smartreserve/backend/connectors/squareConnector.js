async function sendBooking(restaurant, payload) {
  return {
    ok: true,
    status: 200,
    provider: "square",
    body: {
      accepted: true,
      note: "Square connector scaffold placeholder",
      restaurantExternalId: restaurant.restaurant_external_id || null,
      payload,
    },
  };
}

async function testConnection(restaurant) {
  return {
    ok: true,
    status: 200,
    provider: "square",
    body: {
      accepted: true,
      note: "Square test scaffold placeholder",
      restaurantExternalId: restaurant.restaurant_external_id || null,
    },
  };
}

module.exports = {
  sendBooking,
  testConnection,
};
