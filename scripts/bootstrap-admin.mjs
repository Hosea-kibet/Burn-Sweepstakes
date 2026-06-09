import { randomBytes, scryptSync } from "crypto";
import { neon } from "@neondatabase/serverless";

function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function normalize(value) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEmail(email) {
  return normalize(email).toLowerCase();
}

const [
  fullName,
  email,
  pin,
  department = "Admin",
  phone = "N/A",
  location = "HQ",
] = process.argv.slice(2);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (!fullName || !email || !pin) {
  console.error(
    "Usage: node --env-file=.env.local scripts/bootstrap-admin.mjs \"Full Name\" email@domain.com 1234 [department] [phone] [location]",
  );
  process.exit(1);
}

if (!/^\d{4,8}$/.test(pin.trim())) {
  console.error("PIN must be 4 to 8 digits.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const cleanedEmail = normalizeEmail(email);

const existing = await sql.query(
  `select id, email
   from participants
   where email = $1`,
  [cleanedEmail],
  { fullResults: true },
);

if (existing.rows[0]) {
  console.error(`An account already exists for ${cleanedEmail}.`);
  process.exit(1);
}

const result = await sql.query(
  `insert into participants (
    full_name,
    email,
    department,
    phone,
    location,
    pin_hash,
    team_preferences,
    is_admin
  ) values ($1, $2, $3, $4, $5, $6, $7, true)
  returning full_name, email, is_admin`,
  [
    normalize(fullName),
    cleanedEmail,
    normalize(department),
    normalize(phone),
    normalize(location),
    hashPin(pin.trim()),
    ["Argentina"],
  ],
  { fullResults: true },
);

const account = result.rows[0];
console.log(
  `Created admin account for ${account.full_name} <${account.email}>. You can now log in at /admin/login.`,
);
