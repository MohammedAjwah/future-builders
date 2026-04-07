async function sendWebhook({ webhookUrl, payload, timeoutMs = 15000 }) {
  if (!webhookUrl) {
    throw new Error("webhookUrl is required");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  sendWebhook,
  sendPayload: async (webhookUrl, payload, timeoutMs = 15000) =>
    sendWebhook({ webhookUrl, payload, timeoutMs }),
};
