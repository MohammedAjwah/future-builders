import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RestaurantForm from "../components/RestaurantForm";

export default function RestaurantDetails({ apiRequest, setGlobalMessage }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = id === undefined;
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isCreate) return;
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(`/api/restaurants/${id}`);
        if (active) setRestaurant(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, isCreate, apiRequest]);

  const title = useMemo(
    () => (isCreate ? "Add Restaurant" : `Restaurant Setup: ${restaurant?.restaurantName || ""}`),
    [isCreate, restaurant]
  );

  async function handleSave(payload) {
    setSaving(true);
    setError("");
    try {
      if (isCreate) {
        await apiRequest("/api/restaurants", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setGlobalMessage("Restaurant created");
      } else {
        await apiRequest(`/api/restaurants/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setGlobalMessage("Restaurant updated");
      }
      navigate("/restaurants");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (isCreate) {
      setError("Save restaurant first before testing connection");
      return;
    }
    setTesting(true);
    setError("");
    try {
      const result = await apiRequest(`/api/restaurants/${id}/test`, {
        method: "POST",
      });
      setGlobalMessage(
        result.success ? "Connection test succeeded" : "Connection test returned error"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <div className="card">Loading restaurant...</div>;
  }

  return (
    <section>
      <div className="page-header">
        <h2>{title}</h2>
        <p className="muted">Configure provider routing and field mapping.</p>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <RestaurantForm
        initialValue={restaurant}
        onSubmit={handleSave}
        onTestConnection={handleTest}
        loading={saving}
        testing={testing}
      />
    </section>
  );
}
