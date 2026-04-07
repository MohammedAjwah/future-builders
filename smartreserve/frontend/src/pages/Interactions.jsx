import { useEffect, useState } from "react";

function CellJson({ value }) {
  return <pre className="mini-pre">{JSON.stringify(value || {}, null, 2)}</pre>;
}

export default function Interactions({ apiRequest }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/api/interactions");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load interactions");
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
        <h2>Interactions</h2>
        <button className="secondary" type="button" onClick={load}>
          Refresh
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? (
        <p>Loading interactions...</p>
      ) : (
        <div className="overflow">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Restaurant</th>
                <th>Phone</th>
                <th>Intent</th>
                <th>Input</th>
                <th>AI Data</th>
                <th>Connector</th>
                <th>SMS</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.restaurantName}</td>
                  <td>{item.customerPhone}</td>
                  <td>{item.aiIntent}</td>
                  <td>{item.inputText}</td>
                  <td>
                    <CellJson value={item.aiData} />
                  </td>
                  <td>{item.connectorStatus}</td>
                  <td>{item.smsStatus}</td>
                  <td>{item.createdAt}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="9">No interactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
