import { useMemo, useState } from "react";

const EMPTY_FORM = {
  restaurantName: "",
  phoneNumber: "",
  address: "",
  workingHours: "{\n  \"mon\": \"09:00-17:00\"\n}",
  reservationsEnabled: true,
  ordersEnabled: true,
  menu: "",
  faq: "[\"What time do you close?\"]",
  smsEnabled: true,
  smsTemplate:
    "Hi {name}, your {intent} at {restaurant} is confirmed for {time}.",
  providerType: "make",
  webhookUrl: "",
  apiBaseUrl: "",
  apiKey: "",
  restaurantExternalId: "",
  timezone: "UTC",
  fieldMapping: "{\n  \"customerName\": \"guest_name\",\n  \"bookingTime\": \"reservation_time\",\n  \"guestCount\": \"party_size\"\n}",
  isActive: true,
};

function stringifyMapping(mapping) {
  if (typeof mapping === "string") return mapping;
  try {
    return JSON.stringify(mapping || {}, null, 2);
  } catch (_err) {
    return "{}";
  }
}

export default function RestaurantForm({
  initialValue,
  onSubmit,
  onTestConnection,
  loading,
  testing,
}) {
  const starting = useMemo(() => {
    if (!initialValue) return EMPTY_FORM;
    return {
      restaurantName: initialValue.restaurantName || "",
      phoneNumber: initialValue.phoneNumber || "",
      address: initialValue.address || "",
      workingHours: stringifyMapping(initialValue.workingHours || {}),
      reservationsEnabled: Boolean(initialValue.reservationsEnabled),
      ordersEnabled: Boolean(initialValue.ordersEnabled),
      menu: initialValue.menu || "",
      faq: stringifyMapping(initialValue.faq || []),
      smsEnabled: Boolean(initialValue.smsEnabled),
      smsTemplate:
        initialValue.smsTemplate ||
        "Hi {name}, your {intent} at {restaurant} is confirmed for {time}.",
      providerType: initialValue.providerType || "make",
      webhookUrl: initialValue.webhookUrl || "",
      apiBaseUrl: initialValue.apiBaseUrl || "",
      apiKey: initialValue.apiKey || "",
      restaurantExternalId: initialValue.restaurantExternalId || "",
      timezone: initialValue.timezone || "UTC",
      fieldMapping: stringifyMapping(initialValue.fieldMapping || {}),
      isActive: Boolean(initialValue.isActive),
    };
  }, [initialValue]);

  const [form, setForm] = useState(starting);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    let parsedMapping = {};
    let parsedWorkingHours = {};
    let parsedFaq = [];
    try {
      parsedMapping = JSON.parse(form.fieldMapping || "{}");
      parsedWorkingHours = JSON.parse(form.workingHours || "{}");
      parsedFaq = JSON.parse(form.faq || "[]");
    } catch (_err) {
      setError("Field mapping, working hours, and FAQ must be valid JSON");
      return;
    }

    onSubmit({
      ...form,
      workingHours: parsedWorkingHours,
      faq: parsedFaq,
      fieldMapping: parsedMapping,
    });
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Restaurant Setup</h2>
      {error ? <p className="error-text">{error}</p> : null}

      <label>
        Restaurant Name
        <input
          value={form.restaurantName}
          onChange={(e) => updateField("restaurantName", e.target.value)}
          required
        />
      </label>

      <label>
        Phone Number
        <input
          value={form.phoneNumber}
          onChange={(e) => updateField("phoneNumber", e.target.value)}
          required
          placeholder="+15551234567"
        />
      </label>

      <label>
        Address
        <input
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
        />
      </label>

      <label className="full-width">
        Working Hours (JSON)
        <textarea
          rows={3}
          value={form.workingHours}
          onChange={(e) => updateField("workingHours", e.target.value)}
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.reservationsEnabled}
          onChange={(e) => updateField("reservationsEnabled", e.target.checked)}
        />
        Reservations Enabled
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.ordersEnabled}
          onChange={(e) => updateField("ordersEnabled", e.target.checked)}
        />
        Orders Enabled
      </label>

      <label className="full-width">
        Menu (text or URL)
        <input
          value={form.menu}
          onChange={(e) => updateField("menu", e.target.value)}
          placeholder="https://restaurant.com/menu or plain text"
        />
      </label>

      <label className="full-width">
        FAQ (JSON array)
        <textarea
          rows={4}
          value={form.faq}
          onChange={(e) => updateField("faq", e.target.value)}
        />
      </label>

      <label>
        Provider Type
        <select
          value={form.providerType}
          onChange={(e) => updateField("providerType", e.target.value)}
        >
          <option value="make">make</option>
          <option value="custom_api">custom_api</option>
          <option value="square">square</option>
          <option value="sheets">sheets</option>
        </select>
      </label>

      <label>
        Webhook URL
        <input
          value={form.webhookUrl}
          onChange={(e) => updateField("webhookUrl", e.target.value)}
          placeholder="https://hook.us2.make.com/..."
        />
      </label>

      <label>
        API Base URL
        <input
          value={form.apiBaseUrl}
          onChange={(e) => updateField("apiBaseUrl", e.target.value)}
          placeholder="https://api.example.com/bookings"
        />
      </label>

      <label>
        API Key
        <input
          value={form.apiKey}
          onChange={(e) => updateField("apiKey", e.target.value)}
          placeholder="secret key"
        />
      </label>

      <label>
        Restaurant External ID
        <input
          value={form.restaurantExternalId}
          onChange={(e) => updateField("restaurantExternalId", e.target.value)}
        />
      </label>

      <label>
        Timezone
        <input
          value={form.timezone}
          onChange={(e) => updateField("timezone", e.target.value)}
          placeholder="UTC"
        />
      </label>

      <label className="full-width">
        Field Mapping (JSON)
        <textarea
          rows={8}
          value={form.fieldMapping}
          onChange={(e) => updateField("fieldMapping", e.target.value)}
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.smsEnabled}
          onChange={(e) => updateField("smsEnabled", e.target.checked)}
        />
        SMS Enabled
      </label>

      <label className="full-width">
        SMS Template
        <textarea
          rows={2}
          value={form.smsTemplate}
          onChange={(e) => updateField("smsTemplate", e.target.value)}
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => updateField("isActive", e.target.checked)}
        />
        Active
      </label>

      <div className="button-row full-width">
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={testing}
          onClick={() => onTestConnection?.(form)}
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
      </div>
    </form>
  );
}
