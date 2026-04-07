const twilio = require("twilio");
const { info } = require("../utils/logger");

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  if (!sid || !token) {
    throw new Error("Twilio credentials are not configured");
  }
  return twilio(sid, token);
}

function applyTemplate(template, data) {
  return String(template || "")
    .replaceAll("{name}", data.name || "Guest")
    .replaceAll("{intent}", data.intent || "request")
    .replaceAll("{restaurant}", data.restaurant || "restaurant")
    .replaceAll("{time}", data.time || "your requested time")
    .replaceAll("{guests}", String(data.guests ?? ""));
}

async function sendConfirmationSms({
  to,
  body,
  restaurantName,
  intent,
  customerName,
  bookingTime,
  guestCount,
  smsTemplate,
}) {
  const enabled = String(process.env.TWILIO_SMS_ENABLED || "true") === "true";
  if (!enabled) {
    return {
      ok: false,
      skipped: true,
      reason: "TWILIO_SMS_ENABLED=false",
    };
  }

  if (!to) {
    return {
      ok: false,
      skipped: true,
      reason: "missing recipient phone number",
    };
  }

  const from = process.env.TWILIO_FROM_NUMBER || "";
  if (!from) {
    throw new Error("TWILIO_FROM_NUMBER is not configured");
  }

  const finalBody =
    body ||
    applyTemplate(smsTemplate, {
      name: customerName,
      intent,
      restaurant: restaurantName,
      time: bookingTime,
      guests: guestCount,
    });

  const client = getTwilioClient();
  const message = await client.messages.create({
    from,
    to,
    body: finalBody,
  });

  info("twilio_sms_sent", { sid: message.sid, to });

  return {
    ok: true,
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
  };
}

module.exports = {
  sendConfirmationSms,
};
