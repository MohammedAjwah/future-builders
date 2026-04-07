const { processVoiceInputWithOpenAI } = require("./openaiService");
const { parseBookingTranscript } = require("./bookingParser");
const { routeBookingToConnector } = require("./restaurantRouter");
const { sendConfirmationSms } = require("./smsService");
const {
  saveInteraction,
  saveRecord,
  interactionNeedsAction,
  buildSmsText,
} = require("./interactionService");
const { info } = require("../utils/logger");

function normalizeIntent(intent = "") {
  const value = String(intent).toLowerCase().trim();
  if (value === "reservation" || value === "order" || value === "faq") {
    return value;
  }
  return "faq";
}

function normalizeData(intent, aiData = {}, fallback) {
  const base = {
    customerName:
      aiData.customer_name ||
      aiData.customerName ||
      fallback.customerName ||
      "Guest",
    customerPhone: aiData.customer_phone || aiData.customerPhone || "",
    bookingTime:
      aiData.booking_time || aiData.bookingTime || fallback.bookingTime || "unspecified",
    guestCount:
      Number.parseInt(
        String(aiData.guest_count || aiData.guestCount || fallback.guestCount || 0),
        10
      ) || fallback.guestCount || 2,
    orderItems: Array.isArray(aiData.order_items || aiData.orderItems)
      ? aiData.order_items || aiData.orderItems
      : [],
    question: aiData.question || "",
    notes: aiData.notes || "",
  };

  if (intent === "order") {
    return {
      ...base,
      bookingTime: "unspecified",
      guestCount: Math.max(1, base.guestCount),
    };
  }

  return base;
}

function buildConnectorPayload(intent, normalizedData, aiResult, restaurant) {
  const base = {
    intent,
    restaurantId: restaurant.id,
    restaurantName: restaurant.restaurantName,
    status: "CONFIRMED",
    source: "voice_input",
    aiResponse: aiResult.response || "",
  };

  if (intent === "reservation") {
    return {
      ...base,
      customerName: normalizedData.customerName,
      bookingTime: normalizedData.bookingTime,
      guestCount: normalizedData.guestCount,
      table: normalizedData.guestCount > 6 ? "large_table" : "standard_table",
      notes: normalizedData.notes,
    };
  }

  if (intent === "order") {
    return {
      ...base,
      customerName: normalizedData.customerName,
      customerPhone: normalizedData.customerPhone,
      orderItems: normalizedData.orderItems,
      notes: normalizedData.notes,
    };
  }

  return {
    ...base,
    question: normalizedData.question,
  };
}

async function orchestrateVoiceInput({
  restaurant,
  text,
  phoneNumber,
  source = "voice_input",
  sourceSessionId = "",
}) {
  const transcriptFallback = parseBookingTranscript(text);
  const aiResult = await processVoiceInputWithOpenAI({
    text,
    restaurant,
    fallbackData: transcriptFallback,
  });

  const intent = normalizeIntent(aiResult.intent);
  const normalizedData = normalizeData(intent, aiResult.data || {}, transcriptFallback);

  const actionRequired = interactionNeedsAction(aiResult, intent, restaurant);
  let connectorResponse = null;
  let connectorStatus = "skipped";
  let smsResponse = null;
  let smsStatus = "skipped";
  let record = null;

  if (actionRequired) {
    try {
      const connectorPayload = buildConnectorPayload(intent, normalizedData, aiResult, restaurant);
      connectorResponse = await routeBookingToConnector(restaurant, connectorPayload);
      connectorStatus = connectorResponse.ok ? "sent" : "failed";
      info("Connector dispatched", {
        restaurantId: restaurant.id,
        intent,
        connectorStatus,
      });
    } catch (err) {
      connectorStatus = "failed";
      connectorResponse = { ok: false, status: 500, body: err.message };
    }

    record = await saveRecord({
      restaurantId: restaurant.id,
      type: intent,
      customerName: normalizedData.customerName,
      customerPhone: normalizedData.customerPhone || phoneNumber || "",
      bookingTime: normalizedData.bookingTime,
      guestCount: normalizedData.guestCount,
      orderItems: normalizedData.orderItems,
      notes: normalizedData.notes,
      status: connectorStatus === "sent" ? "confirmed" : "failed",
    });

    const smsText = buildSmsText({
      restaurant,
      intent,
      data: normalizedData,
      aiResult,
    });
    smsResponse = await sendConfirmationSms({
      to: normalizedData.customerPhone || phoneNumber,
      body: smsText,
      enabled: restaurant.smsEnabled,
    });
    smsStatus = smsResponse.ok ? "sent" : smsResponse.skipped ? "skipped" : "failed";
  }

  const interaction = await saveInteraction({
    restaurantId: restaurant.id,
    customerPhone: phoneNumber || normalizedData.customerPhone,
    sourceChannel: source,
    sourceSessionId,
    inputText: text,
    aiIntent: intent,
    aiData: normalizedData,
    aiResponseText: aiResult.response || "",
    isComplete: Boolean(aiResult.is_complete),
    actionRequired: actionRequired,
    connectorStatus,
    connectorResponse,
    smsStatus,
    smsResponse,
  });

  return {
    interaction,
    record,
    ai: aiResult,
    connectorStatus,
    smsStatus,
    routedPayload:
      actionRequired && intent !== "faq"
        ? buildConnectorPayload(intent, normalizedData, aiResult, restaurant)
        : null,
    connectorResponse,
    smsResponse,
    actionRequired,
  };
}

module.exports = {
  orchestrateVoiceInput,
};
