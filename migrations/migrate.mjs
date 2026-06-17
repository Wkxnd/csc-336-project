import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	cyan: '\x1b[36m',
	dim: '\x1b[2m'
};

const command = process.argv[2];

if (!command || !['create', 'up', 'reset'].includes(command)) {
	console.error(
		`${colors.red}Error: Invalid command. Use "create", "up", or "reset".${colors.reset}`
	);
	console.error(`Usage:`);
	console.error(`  pnpm migrate:create <name>`);
	console.error(`  pnpm migrate:up`);
	console.error(`  pnpm migrate:reset`);
	process.exit(1);
}

if (command === 'create') {
	const name = process.argv[3];
	if (!name) {
		console.error(`${colors.red}Error: Please provide a migration name.${colors.reset}`);
		console.error(`Example: pnpm migrate:create init-db`);
		process.exit(1);
	}

	const sanitizedName = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

	const now = new Date();
	const timestamp = now
		.toISOString()
		.replace(/[-:.ZT]/g, '')
		.slice(0, 14);
	const filename = `${timestamp}-${sanitizedName}.sql`;
	const filepath = path.join(__dirname, filename);

	const template = `-- Migration: ${sanitizedName}\n-- Created at: ${now.toISOString()}\n\n`;

	fs.writeFileSync(filepath, template, 'utf8');
	console.log(`${colors.green}Created migration file:${colors.reset} migrations/${filename}`);
	process.exit(0);
}

// Database-interacting commands: 'up' and 'reset'
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error(
		`${colors.red}Error: DATABASE_URL environment variable is not defined.${colors.reset}`
	);
	console.error(
		`Make sure you run with node --env-file=.env or set the DATABASE_URL environment variable.`
	);
	process.exit(1);
}

let sql;
try {
	sql = postgres(databaseUrl, { max: 1 });

	// Acquire a session-level advisory lock to prevent concurrent migration runs
	await sql`SELECT pg_advisory_lock(1337336);`;

	if (command === 'reset') {
		console.log(
			`${colors.yellow}Resetting database schema (dropping public schema)...${colors.reset}`
		);
		await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
		await sql`CREATE SCHEMA public;`;
		await sql`GRANT ALL ON SCHEMA public TO public;`;
		console.log(`${colors.green}Database schema reset successfully.${colors.reset}`);
	}

	// Ensure migrations table exists
	await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

	// Read all sql migration files
	const files = fs
		.readdirSync(__dirname)
		.filter((file) => file.endsWith('.sql'))
		.sort();

	// Get already applied migrations
	const appliedMigrations = await sql`
    SELECT name FROM _migrations ORDER BY id ASC;
  `;
	const appliedSet = new Set(appliedMigrations.map((m) => m.name));

	// Determine pending migrations
	const pending = files.filter((file) => !appliedSet.has(file));

	if (pending.length === 0) {
		console.log(`${colors.green}No pending migrations. Database is up to date.${colors.reset}`);
	} else {
		console.log(
			`${colors.cyan}Found ${pending.length} pending migration(s) to apply.${colors.reset}`
		);
		for (const file of pending) {
			const filePath = path.join(__dirname, file);
			const content = fs.readFileSync(filePath, 'utf8');

			if (!content.trim()) {
				console.log(`${colors.yellow}Skipping empty migration file: ${file}${colors.reset}`);
				// Record empty migrations anyway to avoid re-evaluation
				await sql`
          INSERT INTO _migrations (name) VALUES (${file});
        `;
				continue;
			}

			console.log(`${colors.cyan}Applying migration: ${colors.reset}${file}`);

			try {
				await sql.begin(async (sqlTrans) => {
					await sqlTrans.unsafe(content);
					await sqlTrans`
            INSERT INTO _migrations (name) VALUES (${file});
          `;
				});
				console.log(`${colors.green}Successfully applied: ${colors.reset}${file}`);
			} catch (err) {
				console.error(`${colors.red}Error applying migration ${file}:${colors.reset}`);
				console.error(err);
				process.exit(1);
			}
		}
		console.log(`${colors.green}All pending migrations applied successfully.${colors.reset}`);
	}
} catch (error) {
	console.error(`${colors.red}Migration runner encountered an error:${colors.reset}`);
	console.error(error);
	process.exit(1);
} finally {
	if (sql) {
		await sql.end();
	}
}
