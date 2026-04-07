const OpenAI = require("openai");
const { error } = require("../utils/logger");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_TIMEOUT_MS = Number.parseInt(process.env.OPENAI_TIMEOUT_MS || "20000", 10);

function buildSystemPrompt(restaurant) {
  return [
    "You are SmartReserve AI assistant for a restaurant operations backend.",
    "Classify intent into one of: reservation, order, faq.",
    "Return only valid JSON matching schema.",
    "If input is incomplete, set is_complete=false and include missing_fields.",
    "Use restaurant context when helpful.",
    `Restaurant name: ${restaurant.restaurantName || "Unknown"}`,
    `Reservations enabled: ${restaurant.reservationsEnabled ? "yes" : "no"}`,
    `Orders enabled: ${restaurant.ordersEnabled ? "yes" : "no"}`,
    `Menu: ${restaurant.menuTextOrUrl || "not provided"}`,
    `FAQ: ${Array.isArray(restaurant.faq) ? restaurant.faq.join(" | ") : "not provided"}`,
  ].join("\n");
}

function normalizeAiResult(parsed) {
  const intent = ["reservation", "order", "faq"].includes(parsed?.intent)
    ? parsed.intent
    : "faq";

  const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : {};
  const response = String(parsed?.response || "").trim() || "Thanks, I have captured your request.";
  const isComplete =
    parsed?.is_complete !== undefined
      ? Boolean(parsed.is_complete)
      : parsed?.isComplete !== undefined
        ? Boolean(parsed.isComplete)
        : false;
  const missingFields = Array.isArray(parsed?.missing_fields)
    ? parsed.missing_fields.map((value) => String(value))
    : [];
  const actionRequired =
    parsed?.action_required !== undefined
      ? Boolean(parsed.action_required)
      : parsed?.actionRequired !== undefined
        ? Boolean(parsed.actionRequired)
        : isComplete;

  return {
    intent,
    data,
    response,
    isComplete,
    missingFields,
    actionRequired,
  };
}

async function processVoiceInputWithOpenAI({ text, restaurant, fallbackData }) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const client = new OpenAI({ apiKey: OPENAI_API_KEY, timeout: OPENAI_TIMEOUT_MS });

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(restaurant),
        },
        {
          role: "user",
          content: JSON.stringify({
            transcript: String(text || ""),
            fallback: fallbackData || {},
            required_output_schema: {
              intent: "reservation | order | faq",
              is_complete: "boolean",
              missing_fields: ["string"],
              action_required: "boolean",
              data: {
                customer_name: "string",
                customer_phone: "string",
                reservation_time: "string",
                guest_count: "number",
                order_items: ["string"],
                question: "string",
                notes: "string",
              },
              response: "string",
            },
          }),
        },
      ],
    });

    const content = completion?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return normalizeAiResult(parsed);
  } catch (err) {
    error("OpenAI processVoiceInputWithOpenAI failed", { error: err.message });
    throw err;
  }
}

module.exports = {
  processVoiceInputWithOpenAI,
};
