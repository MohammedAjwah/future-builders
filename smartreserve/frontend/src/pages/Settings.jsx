import { useState } from "react";

function Settings({ apiBaseUrl, setGlobalMessage }) {
  const [platformName, setPlatformName] = useState("SmartReserve Internal");
  const [defaultTimezone, setDefaultTimezone] = useState("UTC");
  const [voiceGreeting, setVoiceGreeting] = useState(
    "Hello, welcome to SmartReserve. Please tell me your booking request"
  );
  const [saved, setSaved] = useState(false);

  const onSave = (event) => {
    event.preventDefault();
    setSaved(true);
    setGlobalMessage?.("Platform settings saved locally");
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1>Settings</h1>
      <p className="muted">
        Internal platform settings for SmartReserve operations.
      </p>
      <form className="card form-grid" onSubmit={onSave}>
        <label>
          <span>Platform Name</span>
          <input
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
          />
        </label>
        <label>
          <span>Default Timezone</span>
          <input
            value={defaultTimezone}
            onChange={(e) => setDefaultTimezone(e.target.value)}
          />
        </label>
        <label>
          <span>Voice Greeting</span>
          <textarea
            rows={3}
            value={voiceGreeting}
            onChange={(e) => setVoiceGreeting(e.target.value)}
          />
        </label>
        <label>
          <span>Backend API URL</span>
          <input value={apiBaseUrl} readOnly />
        </label>
        <button className="btn-primary" type="submit">
          Save Settings
        </button>
        {saved && <p className="status success">Settings saved locally.</p>}
      </form>
    </div>
  );
}

export default Settings;
