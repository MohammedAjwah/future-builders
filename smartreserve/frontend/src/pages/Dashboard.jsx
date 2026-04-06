import { useEffect, useState } from "react";

export default function Dashboard({ apiRequest }) {
  const [stats, setStats] = useState({
    restaurants: 0,
    bookings: 0,
    recent: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setError("");
        const [restaurants, bookings] = await Promise.all([
          apiRequest("/api/restaurants"),
          apiRequest("/api/bookings"),
        ]);
        if (!mounted) return;
        setStats({
          restaurants: restaurants.length,
          bookings: bookings.length,
          recent: bookings.slice(0, 8),
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
          <h3>Total Bookings</h3>
          <p>{stats.bookings}</p>
        </article>
      </div>
      <div className="card">
        <h3>Recent Booking Activity</h3>
        {stats.recent.length === 0 ? (
          <p className="muted">No booking activity yet.</p>
        ) : (
          <ul className="list">
            {stats.recent.map((booking) => (
              <li key={booking.id}>
                <strong>#{booking.id}</strong> {booking.restaurantName} -{" "}
                {booking.customerName} - {booking.bookingTime} - {booking.guestCount} guests
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
