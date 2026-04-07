import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Restaurants({ apiRequest, setGlobalMessage }) {
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  async function loadRestaurants() {
    setError("");
    try {
      const data = await apiRequest("/api/restaurants");
      setRestaurants(data);
    } catch (err) {
      setError(err.message || "Failed to load restaurants");
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function toggleRestaurant(id) {
    setLoadingId(id);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/restaurants/${id}/toggle`, { method: "POST" });
      setMessage("Restaurant status updated");
      setGlobalMessage("Restaurant status updated");
      await loadRestaurants();
    } catch (err) {
      setError(err.message || "Failed to toggle restaurant");
    } finally {
      setLoadingId(null);
    }
  }

  async function testConnection(id) {
    setLoadingId(id);
    setError("");
    setMessage("");
    try {
      const result = await apiRequest(`/api/restaurants/${id}/test`, { method: "POST" });
      const text = result.success ? "Connection test succeeded" : "Connection test failed";
      setMessage(text);
      setGlobalMessage(text);
    } catch (err) {
      setError(err.message || "Failed to run test connection");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="card">
      <div className="page-header">
        <div>
          <h2>Restaurants</h2>
          <p className="muted">Manage SmartReserve restaurant integrations.</p>
        </div>
        <Link className="button" to="/restaurants/new">
          Add restaurant
        </Link>
      </div>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id}>
                <td>{restaurant.restaurantName}</td>
                <td>{restaurant.phoneNumber}</td>
                <td>{restaurant.providerType}</td>
                <td>{restaurant.isActive ? "Active" : "Disabled"}</td>
                <td className="actions">
                  <Link className="link-button" to={`/restaurants/${restaurant.id}`}>
                    Edit
                  </Link>
                  <button
                    className="link-button"
                    type="button"
                    disabled={loadingId === restaurant.id}
                    onClick={() => toggleRestaurant(restaurant.id)}
                  >
                    {restaurant.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="link-button"
                    type="button"
                    disabled={loadingId === restaurant.id}
                    onClick={() => testConnection(restaurant.id)}
                  >
                    Test connection
                  </button>
                </td>
              </tr>
            ))}
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan="5">No restaurants added yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
