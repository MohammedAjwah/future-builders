const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const { info, error } = require("../utils/logger");

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(__dirname, "smartreserve.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

const db = new sqlite3.Database(DB_PATH);

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function seedAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@smartreserve.local")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await get("SELECT id FROM admin_users WHERE email = ?", [adminEmail]);
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await run("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)", [
    adminEmail,
    passwordHash,
  ]);
  info("Seeded default admin user", { email: adminEmail });
}

async function initDatabase() {
  try {
    const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
    await new Promise((resolve, reject) => {
      db.exec(schema, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    await seedAdminUser();
    info("SQLite initialized", { dbPath: DB_PATH });
  } catch (err) {
    error("Failed to initialize database", { error: err.message });
    throw err;
  }
}

module.exports = {
  run,
  get,
  all,
  initDatabase,
};
