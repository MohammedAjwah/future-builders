const PROVIDER_TYPES = ["webhook", "make", "custom_api", "square", "sheets"];

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
    address: (body.address || "").trim(),
    workingHours: safeJsonParse(body.workingHours, {}),
    reservationsEnabled:
      body.reservationsEnabled !== undefined
        ? Boolean(body.reservationsEnabled)
        : true,
    ordersEnabled:
      body.ordersEnabled !== undefined ? Boolean(body.ordersEnabled) : true,
    menu: (body.menu || "").trim(),
    faq: safeJsonParse(body.faq, []),
    providerType: (body.providerType || "").trim(),
    webhookUrl: (body.webhookUrl || "").trim(),
    apiBaseUrl: (body.apiBaseUrl || "").trim(),
    apiKey: (body.apiKey || "").trim(),
    restaurantExternalId: (body.restaurantExternalId || "").trim(),
    timezone: (body.timezone || "UTC").trim(),
    fieldMapping: safeJsonParse(body.fieldMapping, {}),
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    smsEnabled: body.smsEnabled !== undefined ? Boolean(body.smsEnabled) : true,
    smsTemplate: (body.smsTemplate || "").trim(),
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
  if ((data.providerType === "make" || data.providerType === "webhook") && !data.webhookUrl) {
    return {
      valid: false,
      error: "webhookUrl is required for webhook/make provider",
      errors: ["webhookUrl is required for webhook/make provider"],
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

function validateRestaurantOnboardingPayload(body = {}) {
  const baseValidation = validateRestaurantPayload(body);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  const data = baseValidation.data;
  const normalized = {
    ...data,
    address: (body.address || "").trim(),
    workingHours: safeJsonParse(body.workingHours, body.working_hours || {}),
    reservationsEnabled:
      body.reservationsEnabled !== undefined
        ? Boolean(body.reservationsEnabled)
        : body.reservations_enabled !== undefined
          ? Boolean(body.reservations_enabled)
          : true,
    ordersEnabled:
      body.ordersEnabled !== undefined
        ? Boolean(body.ordersEnabled)
        : body.orders_enabled !== undefined
          ? Boolean(body.orders_enabled)
          : true,
    menu: (body.menu || "").trim(),
    faq: Array.isArray(body.faq) ? body.faq : safeJsonParse(body.faq, []),
    smsEnabled:
      body.smsEnabled !== undefined
        ? Boolean(body.smsEnabled)
        : body.sms_enabled !== undefined
          ? Boolean(body.sms_enabled)
          : true,
    smsTemplate: (body.smsTemplate || body.sms_template || "").trim(),
  };

  if (!normalized.webhookUrl && !normalized.apiBaseUrl) {
    return {
      valid: false,
      error: "Either webhookUrl or apiBaseUrl is required",
      errors: ["Either webhookUrl or apiBaseUrl is required"],
    };
  }

  if (!Array.isArray(normalized.faq)) {
    return {
      valid: false,
      error: "faq must be an array",
      errors: ["faq must be an array"],
    };
  }

  return { valid: true, data: normalized };
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

function parseVoiceInputPayload(body = {}) {
  const text = String(body.text || "").trim();
  const phoneNumber = sanitizePhoneNumber(body.phone_number || body.phoneNumber || "");
  const restaurantPhone = sanitizePhoneNumber(
    body.restaurant_phone || body.restaurantPhone || ""
  );

  const restaurantIdRaw = body.restaurant_id ?? body.restaurantId ?? null;
  const restaurantId =
    restaurantIdRaw !== null && restaurantIdRaw !== undefined && restaurantIdRaw !== ""
      ? Number.parseInt(String(restaurantIdRaw), 10)
      : null;

  const conversationId = String(body.conversation_id || body.conversationId || "").trim();

  if (!text) {
    return { valid: false, error: "text is required" };
  }
  if (!restaurantId && !restaurantPhone) {
    return {
      valid: false,
      error: "restaurant_id or restaurant_phone is required",
    };
  }
  if (restaurantId !== null && (!Number.isFinite(restaurantId) || restaurantId <= 0)) {
    return { valid: false, error: "restaurant_id must be a positive number" };
  }

  return {
    valid: true,
    data: {
      text,
      phoneNumber,
      restaurantPhone,
      restaurantId,
      conversationId,
    },
  };
}

module.exports = {
  isSupportedProvider,
  safeJsonParse,
  validateLoginPayload,
  validateRestaurantPayload,
  validateRestaurantOnboardingPayload,
  validateBookingInput,
  parseFieldMapping,
  sanitizePhoneNumber,
  parseVoiceInputPayload,
};
