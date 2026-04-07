import { useEffect, useState } from "react";
import RecordTable from "../components/RecordTable";

export default function Bookings({ apiRequest }) {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/api/records");
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="card">
      <div className="page-header">
        <h2>Records</h2>
        <button className="secondary" type="button" onClick={load}>
          Refresh
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading records...</p> : <RecordTable records={records} />}
    </section>
  );
}
