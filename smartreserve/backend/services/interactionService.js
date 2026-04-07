const { run, get, all } = require("../db/sqlite");
const { parseFieldMapping } = require("./fieldMapper");

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return fallback;
  }
}

function mapInteractionRow(row) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    customerPhone: row.customer_phone,
    sourceChannel: row.source_channel,
    inputText: row.input_text,
    aiIntent: row.ai_intent,
    aiData: parseJson(row.ai_data_json, {}),
    aiResponseText: row.ai_response_text,
    isComplete: Boolean(row.is_complete),
    connectorStatus: row.connector_status,
    connectorResponse: parseJson(row.connector_response_json, null),
    smsStatus: row.sms_status,
    smsResponse: parseJson(row.sms_response_json, null),
    createdAt: row.created_at,
  };
}

function mapRecordRow(row) {
  return {
    id: row.id,
    interactionId: row.interaction_id,
    restaurantId: row.restaurant_id,
    type: row.type,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    bookingTime: row.booking_time,
    guestCount: row.guest_count,
    orderItems: parseJson(row.order_items_json, []),
    notes: row.notes,
    status: row.status,
    externalDeliveryStatus: row.external_delivery_status,
    createdAt: row.created_at,
  };
}

function resolveActionType(intent) {
  if (intent === "order") return "order";
  if (intent === "reservation") return "reservation";
  return "faq";
}

function buildNormalizedRecord(aiResult, customerPhone = "") {
  const data = aiResult.data || {};
  const guestCount = Number.parseInt(data.guestCount ?? data.guest_count ?? "0", 10) || 0;
  const bookingTime = String(data.bookingTime ?? data.booking_time ?? "").trim();
  return {
    type: resolveActionType(aiResult.intent),
    customerName: String(data.customerName ?? data.customer_name ?? "Guest").trim() || "Guest",
    customerPhone: customerPhone || String(data.customerPhone ?? data.customer_phone ?? "").trim(),
    bookingTime: bookingTime || null,
    guestCount: guestCount || null,
    tableType: String(data.tableType || data.table || "").trim() || null,
    orderItems: Array.isArray(data.orderItems || data.order_items)
      ? data.orderItems || data.order_items
      : [],
    notes: String(data.notes || "").trim(),
    status: aiResult.isComplete ? "CONFIRMED" : "PENDING",
  };
}

function buildConnectorPayload(restaurant, aiResult, normalizedRecord) {
  const base = {
    intent: aiResult.intent,
    customerName: normalizedRecord.customerName,
    customerPhone: normalizedRecord.customerPhone,
    bookingTime: normalizedRecord.bookingTime,
    guestCount: normalizedRecord.guestCount,
    table: normalizedRecord.tableType,
    orderItems: normalizedRecord.orderItems,
    notes: normalizedRecord.notes,
    status: normalizedRecord.status,
  };

  const fieldMapping = parseFieldMapping(restaurant.fieldMapping || restaurant.field_mapping || {});
  const payload = {};
  Object.entries(base).forEach(([key, value]) => {
    const target = fieldMapping[key] || key;
    payload[target] = value;
  });
  return payload;
}

async function createInteraction({
  restaurantId,
  customerPhone,
  sourceChannel = "voice",
  sourceSessionId = "",
  inputText,
  aiIntent = "",
  aiData = {},
  aiResponseText = "",
  isComplete = false,
  actionRequired = false,
  connectorStatus = "skipped",
  connectorResponse = null,
  smsStatus = "skipped",
  smsResponse = null,
}) {
  const result = await run(
    `INSERT INTO interactions (
      restaurant_id,
      customer_phone,
      source_channel,
      source_session_id,
      input_text,
      ai_intent,
      ai_data_json,
      ai_response_text,
      is_complete,
      action_required,
      connector_status,
      connector_response_json,
      sms_status,
      sms_response_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      restaurantId,
      customerPhone || "",
      sourceChannel,
      sourceSessionId || "",
      inputText || "",
      aiIntent || "",
      JSON.stringify(aiData || {}),
      aiResponseText || "",
      isComplete ? 1 : 0,
      actionRequired ? 1 : 0,
      connectorStatus,
      connectorResponse ? JSON.stringify(connectorResponse) : null,
      smsStatus,
      smsResponse ? JSON.stringify(smsResponse) : null,
    ]
  );
  return result.id;
}

async function createRecord(interactionId, restaurantId, normalizedRecord) {
  const result = await run(
    `INSERT INTO records (
      interaction_id,
      restaurant_id,
      type,
      customer_name,
      customer_phone,
      booking_time,
      guest_count,
      table_type,
      order_items_json,
      notes,
      status,
      external_delivery_status,
      external_response_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      interactionId,
      restaurantId,
      normalizedRecord.type,
      normalizedRecord.customerName,
      normalizedRecord.customerPhone,
      normalizedRecord.bookingTime,
      normalizedRecord.guestCount,
      normalizedRecord.tableType,
      JSON.stringify(normalizedRecord.orderItems || []),
      normalizedRecord.notes || "",
      normalizedRecord.status,
      "pending",
      null,
    ]
  );
  return result.id;
}

async function updateInteractionOutcome(interactionId, updates) {
  const current = await get("SELECT * FROM interactions WHERE id = ?", [interactionId]);
  if (!current) return;

  const connectorStatus = updates.connectorStatus || current.connector_status;
  const connectorResponse =
    updates.connectorResponse !== undefined
      ? JSON.stringify(updates.connectorResponse)
      : current.connector_response_json;
  const smsStatus = updates.smsStatus || current.sms_status;
  const smsResponse =
    updates.smsResponse !== undefined
      ? JSON.stringify(updates.smsResponse)
      : current.sms_response_json;

  await run(
    `UPDATE interactions
     SET connector_status = ?, connector_response_json = ?, sms_status = ?, sms_response_json = ?
     WHERE id = ?`,
    [connectorStatus, connectorResponse, smsStatus, smsResponse, interactionId]
  );
}

async function updateRecordDelivery(recordId, deliveryStatus) {
  await run(
    "UPDATE records SET external_delivery_status = ?, external_response_json = ? WHERE id = ?",
    [deliveryStatus, null, recordId]
  );
}

async function updateRecordExternal(recordId, deliveryStatus, externalResponse) {
  await run(
    "UPDATE records SET external_delivery_status = ?, external_response_json = ? WHERE id = ?",
    [deliveryStatus, externalResponse ? JSON.stringify(externalResponse) : null, recordId]
  );
}

async function listInteractions() {
  const rows = await all(
    `SELECT i.*, r.restaurant_name
     FROM interactions i
     JOIN restaurants r ON r.id = i.restaurant_id
     ORDER BY datetime(i.created_at) DESC, i.id DESC`
  );
  return rows.map((row) => ({
    ...mapInteractionRow(row),
    restaurantName: row.restaurant_name,
  }));
}

async function getInteractionById(id) {
  const row = await get(
    `SELECT i.*, r.restaurant_name
     FROM interactions i
     JOIN restaurants r ON r.id = i.restaurant_id
     WHERE i.id = ?`,
    [id]
  );
  if (!row) return null;
  return {
    ...mapInteractionRow(row),
    restaurantName: row.restaurant_name,
  };
}

async function listRecords() {
  const rows = await all(
    `SELECT rec.*, r.restaurant_name
     FROM records rec
     JOIN restaurants r ON r.id = rec.restaurant_id
     ORDER BY datetime(rec.created_at) DESC, rec.id DESC`
  );
  return rows.map((row) => ({
    ...mapRecordRow(row),
    restaurantName: row.restaurant_name,
  }));
}

async function getRecordById(id) {
  const row = await get(
    `SELECT rec.*, r.restaurant_name
     FROM records rec
     JOIN restaurants r ON r.id = rec.restaurant_id
     WHERE rec.id = ?`,
    [id]
  );
  if (!row) return null;
  return {
    ...mapRecordRow(row),
    restaurantName: row.restaurant_name,
  };
}

module.exports = {
  createInteraction,
  createRecord,
  updateInteractionOutcome,
  updateRecordDelivery,
  updateRecordExternal,
  buildNormalizedRecord,
  buildConnectorPayload,
  listInteractions,
  getInteractionById,
  listRecords,
  getRecordById,
};
