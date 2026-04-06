const jwt = require("jsonwebtoken");
const { error } = require("./logger");

const JWT_SECRET = process.env.JWT_SECRET || "smartreserve-dev-secret";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    error("Invalid auth token", { error: err.message });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  signToken,
  requireAuth,
};
