const express = require("express");
const twilio = require("twilio");
const { parseBookingTranscript } = require("../services/bookingParser");
const { processBooking } = require("../services/bookingProcessor");
const { getRestaurantByPhone } = require("../services/restaurantRouter");
const { error } = require("../utils/logger");

const router = express.Router();

router.post("/voice", (req, res) => {
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

router.post("/gather", async (req, res) => {
  const transcript = req.body.SpeechResult || "";
  const calledNumber = req.body.To || req.body.Called || "";
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const restaurant = await getRestaurantByPhone(calledNumber);
    if (!restaurant || !restaurant.isActive) {
      twiml.say("Sorry, we could not find an active restaurant for this number");
      res.type("text/xml");
      return res.send(twiml.toString());
    }

    const parsed = parseBookingTranscript(transcript);
    const result = await processBooking({
      restaurant,
      bookingData: parsed,
      source: "twilio_voice",
    });

    if (result.success) {
      twiml.say("Your booking is confirmed");
    } else {
      twiml.say("Sorry, something went wrong");
    }
  } catch (err) {
    error("Voice gather processing failed", { error: err.message });
    twiml.say("Sorry, something went wrong");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

module.exports = router;
