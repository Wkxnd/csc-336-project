import postgres from 'postgres';
import { env } from '$env/dynamic/private';

const databaseUrl = env.DATABASE_URL || 'postgres://root:mysecretpassword@localhost:5432/local';

export const sql = postgres(databaseUrl, {
	max: 10,
	idle_timeout: 20
});
