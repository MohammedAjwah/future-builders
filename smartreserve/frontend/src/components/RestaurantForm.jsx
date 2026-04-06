import { useMemo, useState } from "react";

const EMPTY_FORM = {
  restaurantName: "",
  phoneNumber: "",
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
    try {
      parsedMapping = JSON.parse(form.fieldMapping || "{}");
    } catch (_err) {
      setError("Field mapping must be valid JSON");
      return;
    }

    onSubmit({
      ...form,
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
