async function sendBooking(restaurant, payload) {
  const webhookUrl = restaurant.webhookUrl || restaurant.webhook_url;
  if (!webhookUrl) {
    throw new Error("webhookUrl is required for make provider");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function testConnection(restaurant) {
  return sendBooking(restaurant, {
    event: "connection_test",
    restaurantId: restaurant.id,
    restaurantName: restaurant.restaurantName || restaurant.restaurant_name,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  sendBooking,
  testConnection,
};
