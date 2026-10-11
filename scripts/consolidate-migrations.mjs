import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, "../supabase/migrations");
const outputFile = path.join(migrationsDir, "all_migrations_consolidated.sql");

console.log("Reading migrations from:", migrationsDir);

if (!fs.existsSync(migrationsDir)) {
  console.error("Migrations directory not found:", migrationsDir);
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql") && f !== "all_migrations_consolidated.sql" && !f.startsWith("all_migrations"))
  .sort();

console.log(`Found ${files.length} migration files:`);
files.forEach((f) => console.log(`  - ${f}`));

let consolidatedSql = `-- ==============================================================================
-- NEXORA RESTAURANT PLATFORM — CONSOLIDATED MIGRATIONS (001 - 008)
-- Location: Sathigva, Amauli-Fatehpur Road, 212631
-- Pure-Vegetarian Fine Dining Platform Schema & RBAC Policies
-- Generated automatically on: ${new Date().toISOString()}
-- ==============================================================================

`;

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, "utf-8");
  consolidatedSql += `\n-- ==============================================================================\n`;
  consolidatedSql += `-- MIGRATION: ${file}\n`;
  consolidatedSql += `-- ==============================================================================\n\n`;
  consolidatedSql += content.trim();
  consolidatedSql += `\n\n`;
}

fs.writeFileSync(outputFile, consolidatedSql, "utf-8");
console.log(`\nSuccessfully created consolidated migration file:`);
console.log(`  => ${outputFile} (${(consolidatedSql.length / 1024).toFixed(2)} KB)`);
console.log("You can now run this single SQL file in your Supabase SQL Editor to apply all migrations in one step.");
