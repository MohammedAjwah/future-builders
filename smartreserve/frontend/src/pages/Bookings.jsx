import { useEffect, useState } from "react";
import BookingTable from "../components/BookingTable";

export default function Bookings({ apiRequest }) {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/api/bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
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
        <h2>Bookings</h2>
        <button className="secondary" type="button" onClick={load}>
          Refresh
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading bookings...</p> : <BookingTable bookings={bookings} />}
    </section>
  );
}
