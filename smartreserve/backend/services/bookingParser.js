function parseBookingTranscript(transcript = "") {
  const text = String(transcript).trim();
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
  let timeMatch = normalized.match(/\b((?:[1-9]|1[0-2])(?::[0-5]\d)?\s*(?:am|pm))\b/i);
  if (!timeMatch) {
    timeMatch = normalized.match(/\bat\s*((?:[01]?\d|2[0-3])(?::[0-5]\d)?)\b/i);
  }
  if (timeMatch && timeMatch[1]) {
    bookingTime = timeMatch[1];
  }

  let customerName = "Guest";
  let cleaned = text;

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

  return {
    customerName,
    bookingTime,
    guestCount,
  };
}

function normalizeBookingTime(bookingTime) {
  if (!bookingTime || bookingTime === "unspecified") return "unspecified";
  return String(bookingTime).trim().toLowerCase();
}

module.exports = {
  parseBookingTranscript,
  normalizeBookingTime,
};
