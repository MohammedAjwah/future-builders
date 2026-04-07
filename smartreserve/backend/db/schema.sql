CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_name TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  address TEXT,
  working_hours_json TEXT NOT NULL DEFAULT '{}',
  reservations_enabled INTEGER NOT NULL DEFAULT 1,
  orders_enabled INTEGER NOT NULL DEFAULT 1,
  menu_text_or_url TEXT,
  faq_json TEXT NOT NULL DEFAULT '[]',
  provider_type TEXT NOT NULL CHECK (provider_type IN ('webhook', 'make', 'custom_api', 'square', 'sheets')),
  webhook_url TEXT,
  api_base_url TEXT,
  api_key TEXT,
  restaurant_external_id TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  field_mapping TEXT NOT NULL DEFAULT '{}',
  sms_enabled INTEGER NOT NULL DEFAULT 1,
  sms_template TEXT NOT NULL DEFAULT 'Hi {name}, your {intent} request at {restaurant} is confirmed.',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  table_type TEXT NOT NULL,
  status TEXT NOT NULL,
  connector_response TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  customer_phone TEXT,
  source_channel TEXT NOT NULL DEFAULT 'voice',
  source_session_id TEXT,
  input_text TEXT NOT NULL,
  ai_intent TEXT,
  ai_data_json TEXT NOT NULL DEFAULT '{}',
  ai_response_text TEXT,
  is_complete INTEGER NOT NULL DEFAULT 0,
  action_required INTEGER NOT NULL DEFAULT 0,
  connector_status TEXT NOT NULL DEFAULT 'skipped',
  connector_response_json TEXT,
  sms_status TEXT NOT NULL DEFAULT 'skipped',
  sms_response_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interaction_id INTEGER NOT NULL,
  restaurant_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reservation', 'order', 'faq')),
  customer_name TEXT,
  customer_phone TEXT,
  booking_time TEXT,
  guest_count INTEGER,
  table_type TEXT,
  order_items_json TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  external_delivery_status TEXT NOT NULL DEFAULT 'pending',
  external_response_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interaction_id) REFERENCES interactions(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
