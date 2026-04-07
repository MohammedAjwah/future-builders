async function getElevenLabsConversationToken(agentId) {
  const apiKey = process.env.ELEVENLABS_API_KEY || "";
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is required");
  }
  if (!agentId) {
    throw new Error("agentId is required for ElevenLabs token generation");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(
      agentId
    )}`,
    {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    }
  );

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_err) {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Failed to get ElevenLabs token (${response.status})`
    );
  }

  return data?.token || null;
}

async function verifyElevenLabsSignature(_req) {
  // Placeholder for signature validation if webhook signing is enabled later.
  return true;
}

module.exports = {
  getElevenLabsConversationToken,
  verifyElevenLabsSignature,
};
