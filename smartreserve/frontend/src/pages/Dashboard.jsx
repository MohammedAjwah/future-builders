import { useEffect, useState } from "react";

export default function Dashboard({ apiRequest }) {
  const [stats, setStats] = useState({
    restaurants: 0,
    interactions: 0,
    records: 0,
    recentInteractions: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setError("");
        const [restaurants, interactions, records] = await Promise.all([
          apiRequest("/api/restaurants"),
          apiRequest("/api/interactions"),
          apiRequest("/api/records"),
        ]);
        if (!mounted) return;
        setStats({
          restaurants: restaurants.length,
          interactions: interactions.length,
          records: records.length,
          recentInteractions: interactions.slice(0, 8),
        });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load dashboard");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [apiRequest]);

  return (
    <section>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p className="muted">Overview of SmartReserve internal operations.</p>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="stats-grid">
        <article className="stat-card">
          <h3>Total Restaurants</h3>
          <p>{stats.restaurants}</p>
        </article>
        <article className="stat-card">
          <h3>Total Interactions</h3>
          <p>{stats.interactions}</p>
        </article>
        <article className="stat-card">
          <h3>Total Records</h3>
          <p>{stats.records}</p>
        </article>
      </div>
      <div className="card">
        <h3>Recent Interaction Activity</h3>
        {stats.recentInteractions.length === 0 ? (
          <p className="muted">No interaction activity yet.</p>
        ) : (
          <ul className="list">
            {stats.recentInteractions.map((interaction) => (
              <li key={interaction.id}>
                <strong>#{interaction.id}</strong> {interaction.restaurantName} -{" "}
                {interaction.aiIntent || "unknown"} - {interaction.connectorStatus} -{" "}
                {interaction.smsStatus}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
