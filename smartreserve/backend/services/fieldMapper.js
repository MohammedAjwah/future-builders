const { safeJsonParse } = require("../utils/validators");

function parseFieldMapping(fieldMapping) {
  if (!fieldMapping) return {};
  if (typeof fieldMapping === "object") return fieldMapping;
  return safeJsonParse(fieldMapping, {});
}

function mapFields(internalBooking, fieldMapping) {
  const mapping = parseFieldMapping(fieldMapping);
  const payload = {};

  Object.entries(internalBooking).forEach(([key, value]) => {
    const mappedKey = mapping[key] || key;
    payload[mappedKey] = value;
  });

  return payload;
}

function applyFieldMapping(internalBooking, fieldMapping) {
  return mapFields(internalBooking, fieldMapping);
}

module.exports = {
  parseFieldMapping,
  mapFields,
  applyFieldMapping,
};
