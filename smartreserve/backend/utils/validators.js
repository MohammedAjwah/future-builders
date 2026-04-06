const PROVIDER_TYPES = ["make", "custom_api", "square", "sheets"];

function isSupportedProvider(providerType) {
  return PROVIDER_TYPES.includes(providerType);
}

function safeJsonParse(value, fallback = {}) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function validateLoginPayload(body) {
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";
  const errors = [];

  if (!email) errors.push("email is required");
  if (!password) errors.push("password is required");

  return {
    valid: errors.length === 0,
    errors,
    data: { email, password },
  };
}

function normalizeRestaurantPayload(body = {}) {
  return {
    restaurantName: (body.restaurantName || "").trim(),
    phoneNumber: (body.phoneNumber || "").trim(),
    providerType: (body.providerType || "").trim(),
    webhookUrl: (body.webhookUrl || "").trim(),
    apiBaseUrl: (body.apiBaseUrl || "").trim(),
    apiKey: (body.apiKey || "").trim(),
    restaurantExternalId: (body.restaurantExternalId || "").trim(),
    timezone: (body.timezone || "UTC").trim(),
    fieldMapping: safeJsonParse(body.fieldMapping, {}),
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  };
}

function validateRestaurantPayload(body) {
  const data = normalizeRestaurantPayload(body);
  if (!data.restaurantName) {
    return {
      valid: false,
      error: "restaurantName is required",
      errors: ["restaurantName is required"],
    };
  }
  if (!data.phoneNumber) {
    return {
      valid: false,
      error: "phoneNumber is required",
      errors: ["phoneNumber is required"],
    };
  }
  if (!isSupportedProvider(data.providerType)) {
    return {
      valid: false,
      error: `providerType must be one of: ${PROVIDER_TYPES.join(", ")}`,
      errors: [`providerType must be one of: ${PROVIDER_TYPES.join(", ")}`],
    };
  }
  if (data.providerType === "make" && !data.webhookUrl) {
    return {
      valid: false,
      error: "webhookUrl is required for make provider",
      errors: ["webhookUrl is required for make provider"],
    };
  }
  if (data.providerType === "custom_api" && !data.apiBaseUrl) {
    return {
      valid: false,
      error: "apiBaseUrl is required for custom_api provider",
      errors: ["apiBaseUrl is required for custom_api provider"],
    };
  }
  return { valid: true, data };
}

function validateBookingInput(input = {}) {
  const customerName = (input.customerName || "").trim();
  const bookingTime = (input.bookingTime || "").trim();
  const guestCount = Number.parseInt(String(input.guestCount || ""), 10);

  if (!customerName) {
    return { valid: false, message: "customerName is required.", error: "customerName is required." };
  }
  if (!bookingTime) {
    return { valid: false, message: "bookingTime is required.", error: "bookingTime is required." };
  }
  if (!Number.isFinite(guestCount) || guestCount <= 0) {
    return {
      valid: false,
      message: "guestCount must be a positive number.",
      error: "guestCount must be a positive number.",
    };
  }
  return { valid: true, data: { customerName, bookingTime, guestCount } };
}

function parseFieldMapping(value) {
  return safeJsonParse(value, {});
}

function sanitizePhoneNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

module.exports = {
  isSupportedProvider,
  safeJsonParse,
  validateLoginPayload,
  validateRestaurantPayload,
  validateBookingInput,
  parseFieldMapping,
  sanitizePhoneNumber,
};
