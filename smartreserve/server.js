require("dotenv").config();
const express = require("express");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = "https://hook.us2.make.com/mg7pdfdd9p49n2lmabwnmlyowgycjbvs";

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function extractBookingData(transcript) {
  const text = (transcript || "").trim();
  const normalized = text.toLowerCase();

  let guestCount = 2;
  let guestMatch = normalized.match(/\bfor\s+(\d{1,2})\b/i);
  if (!guestMatch) {
    guestMatch = normalized.match(/\b(\d{1,2})\s*(?:guests?|people|persons?)\b/i);
  }
  if (!guestMatch) {
    guestMatch = normalized.match(/\b(\d{1,2})\b/);
  }
  if (guestMatch) {
    guestCount = Number.parseInt(guestMatch[1], 10);
  }

  let bookingTime = "unspecified";
  // Prefer explicit times with am/pm, then values following "at".
  let timeMatch = normalized.match(/\b((?:[1-9]|1[0-2])(?::[0-5]\d)?\s*(?:am|pm))\b/i);
  if (!timeMatch) {
    timeMatch = normalized.match(/\bat\s*((?:[01]?\d|2[0-3])(?::[0-5]\d)?)\b/i);
  }
  if (timeMatch && timeMatch[1]) {
    bookingTime = timeMatch[1];
  }

  let customerName = "Guest";
  let cleaned = text;

  // Remove extracted time and guest count from the transcript first,
  // then strip filler words so the remaining text is mostly the name.
  if (timeMatch && timeMatch[1]) {
    cleaned = cleaned.replace(new RegExp(timeMatch[1], "i"), " ");
  }
  if (guestMatch && guestMatch[1]) {
    cleaned = cleaned.replace(new RegExp(`\\b${guestMatch[1]}\\b`, "i"), " ");
  }

  cleaned = cleaned
    .replace(/\b(my name is|i am|this is)\b/gi, " ")
    .replace(/\b(book|booking|reserve|reservation|table|for|at|around|please)\b/gi, " ")
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned) {
    customerName = cleaned;
  }

  return { customerName, bookingTime, guestCount };
}

app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Hello, welcome to SmartReserve. Please tell me your booking request");

  twiml.gather({
    input: "speech",
    action: "/gather",
    method: "POST",
    speechTimeout: "auto",
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/gather", async (req, res) => {
  const transcript = req.body.SpeechResult || "";
  console.log("Speech transcript:", transcript);

  const { customerName, bookingTime, guestCount } = extractBookingData(transcript);
  const table = guestCount > 6 ? "large_table" : "standard_table";
  const status = "CONFIRMED";

  const payload = {
    name: customerName,
    time: bookingTime,
    guests: guestCount,
    table,
    status,
  };

  console.log("Extracted booking data:", payload);

  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await webhookResponse.text();
    console.log("Webhook response:", {
      ok: webhookResponse.ok,
      status: webhookResponse.status,
      body: responseBody,
    });

    if (webhookResponse.ok) {
      twiml.say("Your booking is confirmed");
    } else {
      twiml.say("Sorry, something went wrong");
    }
  } catch (error) {
    console.error("Webhook call failed:", error);
    twiml.say("Sorry, something went wrong");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(PORT, () => {
  console.log(`SmartReserve voice server running on port ${PORT}`);
});
