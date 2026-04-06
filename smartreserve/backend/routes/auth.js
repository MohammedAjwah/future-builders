const express = require("express");
const bcrypt = require("bcryptjs");
const { get } = require("../db/sqlite");
const { signToken } = require("../utils/auth");
const { validateLoginPayload } = require("../utils/validators");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const validation = validateLoginPayload(req.body);
    if (!validation.valid) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: validation.errors });
    }

    const { email, password } = validation.data;
    const row = await get("SELECT * FROM admin_users WHERE email = ?", [email]);

    if (!row) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, row.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ id: row.id, email: row.email });
    return res.json({
      token,
      admin: { id: row.id, email: row.email },
    });
  } catch (err) {
    return res.status(500).json({ error: "Login failed", details: err.message });
  }
});

module.exports = router;
