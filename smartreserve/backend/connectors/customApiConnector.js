function buildUrl(apiBaseUrl) {
  const value = (apiBaseUrl || "").trim();
  if (!value) {
    throw new Error("apiBaseUrl is required for custom_api provider");
  }
  return value;
}

async function sendBooking(restaurant, payload) {
  const url = buildUrl(restaurant.apiBaseUrl || restaurant.api_base_url);
  const headers = {
    "Content-Type": "application/json",
  };

  const apiKey = restaurant.apiKey || restaurant.api_key;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
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
  const url = buildUrl(restaurant.apiBaseUrl || restaurant.api_base_url);
  const headers = {};

  const apiKey = restaurant.apiKey || restaurant.api_key;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const body = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

module.exports = { sendBooking, testConnection };
