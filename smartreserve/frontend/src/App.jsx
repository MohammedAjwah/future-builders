import { useCallback, useMemo, useState } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Restaurants from "./pages/Restaurants";
import RestaurantDetails from "./pages/RestaurantDetails";
import Bookings from "./pages/Bookings";
import Interactions from "./pages/Interactions";
import Records from "./pages/Records";
import Settings from "./pages/Settings";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const TOKEN_KEY = "smartreserve_admin_token";
const ADMIN_KEY = "smartreserve_admin_user";

function ProtectedLayout({ token, admin, onLogout }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <h1>SmartReserve Admin Platform</h1>
            <p>Internal operations dashboard</p>
          </div>
          <div className="topbar-actions">
            <span className="admin-email">{admin?.email || "admin"}</span>
            <button className="ghost-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>
        <section className="content-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  });
  const [globalMessage, setGlobalMessage] = useState("");

  const onLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken("");
    setAdmin(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_err) {
        data = text;
      }

      if (!response.ok) {
        const message =
          (data && (data.error || data.message)) ||
          `Request failed with status ${response.status}`;
        if (response.status === 401) {
          onLogout();
        }
        throw new Error(message);
      }
      return data;
    },
    [token, onLogout]
  );

  const handleLogin = useCallback(
    async ({ email, password }) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }

      setToken(data.token);
      setAdmin(data.admin);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
      setGlobalMessage("Logged in successfully");
      navigate("/dashboard", { replace: true });
    },
    [navigate]
  );

  const pageProps = useMemo(
    () => ({
      apiRequest,
      setGlobalMessage,
    }),
    [apiRequest]
  );

  return (
    <>
      {globalMessage ? <div className="global-message">{globalMessage}</div> : null}
      <Routes>
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} isAuthenticated={Boolean(token)} />}
        />

        <Route
          element={<ProtectedLayout token={token} admin={admin} onLogout={onLogout} />}
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard {...pageProps} />} />
          <Route path="/restaurants" element={<Restaurants {...pageProps} />} />
          <Route path="/restaurants/new" element={<RestaurantDetails {...pageProps} />} />
          <Route path="/restaurants/:id" element={<RestaurantDetails {...pageProps} />} />
          <Route path="/bookings" element={<Bookings {...pageProps} />} />
          <Route path="/interactions" element={<Interactions {...pageProps} />} />
          <Route path="/records" element={<Records {...pageProps} />} />
          <Route
            path="/settings"
            element={<Settings apiBaseUrl={API_BASE_URL} setGlobalMessage={setGlobalMessage} />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
