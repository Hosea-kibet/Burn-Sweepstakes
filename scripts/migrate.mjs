import fs from "fs/promises";
import path from "path";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "db", "migrations");
const files = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const sql = neon(process.env.DATABASE_URL);

function splitSqlStatements(source) {
  const statements = [];
  let current = "";
  let index = 0;
  let inDollarBlock = false;

  while (index < source.length) {
    const pair = source.slice(index, index + 2);

    if (pair === "$$") {
      inDollarBlock = !inDollarBlock;
      current += pair;
      index += 2;
      continue;
    }

    const char = source[index];

    if (char === ";" && !inDollarBlock) {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = "";
      index += 1;
      continue;
    }

    current += char;
    index += 1;
  }

  const tail = current.trim();
  if (tail) {
    statements.push(tail);
  }

  return statements;
}

try {
  for (const file of files) {
    const migrationSql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const statements = splitSqlStatements(migrationSql);

    for (const statement of statements) {
      await sql.query(statement);
    }

    console.log(`Applied ${file}`);
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
