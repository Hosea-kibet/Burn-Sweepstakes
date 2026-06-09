import { neon } from "@neondatabase/serverless";

const email = process.argv[2]?.trim().toLowerCase();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/grant-admin.mjs email@domain.com");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const result = await sql.query(
  `update participants
   set is_admin = true,
       assigned_team = null,
       assignment_rank = null,
       status = 'pending',
       elimination_message = null
   where lower(email) = $1
   returning email, full_name`,
  [email],
  { fullResults: true },
);

if (!result.rows[0]) {
  console.error(`No account found for ${email}. Ask that person to sign up first.`);
  process.exit(1);
}

console.log(`Granted admin access to ${result.rows[0].full_name} <${result.rows[0].email}>.`);
