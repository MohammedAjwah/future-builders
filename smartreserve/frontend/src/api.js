const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const TOKEN_KEY = "smartreserve_admin_token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(extraHeaders = {}, withAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (withAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  return request(path, {
    ...options,
    headers: buildHeaders(options.headers || {}, true),
  });
}

export async function apiRequest(path, options = {}) {
  return apiFetch(path, options);
}

export async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    headers: buildHeaders({}, false),
    body: JSON.stringify({ email, password }),
  });
}

export const loginRequest = login;

export async function getRestaurants() {
  return apiFetch("/api/restaurants");
}

export const fetchRestaurants = getRestaurants;

export async function getRestaurant(id) {
  return apiFetch(`/api/restaurants/${id}`);
}

export async function createRestaurant(payload) {
  return apiFetch("/api/restaurants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRestaurant(id, payload) {
  return apiFetch(`/api/restaurants/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function toggleRestaurant(id) {
  return apiFetch(`/api/restaurants/${id}/toggle`, {
    method: "POST",
  });
}

export async function testRestaurantConnection(id) {
  return apiFetch(`/api/restaurants/${id}/test`, {
    method: "POST",
  });
}

export async function getBookings() {
  return apiFetch("/api/bookings");
}

export const fetchBookings = getBookings;

export async function createBooking(payload) {
  return apiFetch("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { API_BASE_URL };
