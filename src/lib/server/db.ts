import postgres from 'postgres';
import { env } from '$env/dynamic/private';

const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is required');
}

export const sql = postgres(databaseUrl, {
	max: 10,
	idle_timeout: 20
});
