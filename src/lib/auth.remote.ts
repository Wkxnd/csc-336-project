import { query, command, form, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { invalid } from '@sveltejs/kit';
import { loginSchema, registerSchema, type User, type UserRow } from '$lib/types';

// --- Password Hashing Helpers ---

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash] = stored.split(':');
	const computedHash = scryptSync(password, salt, 64).toString('hex');
	return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

// --- Authentication ---

export const getCurrentUser = query(async (): Promise<User | null> => {
	const { locals, cookies } = getRequestEvent();
	if (locals.user) {
		return locals.user;
	}
	const sessionId = cookies.get('session_id');
	if (sessionId) {
		try {
			const [session] = await sql<UserRow[]>`
				SELECT u.id, u.email, u.first_name, u.last_name, u.role
				FROM user_sessions us
				JOIN users u ON us.user_id = u.id
				WHERE us.id = ${sessionId} AND us.expires_at > NOW()
			`;
			if (session) {
				return {
					id: session.id,
					email: session.email,
					firstName: session.first_name,
					lastName: session.last_name,
					role: session.role
				};
			}
		} catch (error) {
			console.error('Error fetching user in getCurrentUser:', error);
		}
	}
	return null;
});

export const login = form(loginSchema, async ({ email, password }, issue) => {
	const { cookies } = getRequestEvent();

	const [user] = await sql<UserRow[]>`SELECT * FROM users WHERE email = ${email}`;
	if (!user || !verifyPassword(password, user.password_hash)) {
		invalid(issue.email('Invalid email or password'));
	}

	const sessionId = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

	await sql`
		INSERT INTO user_sessions (id, user_id, expires_at)
		VALUES (${sessionId}, ${user.id}, ${expiresAt})
	`;

	cookies.set('session_id', sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24 * 7
	});

	void getCurrentUser().refresh();
});

export const register = form(
	registerSchema,
	async ({ email, password, firstName, lastName, role }, issue) => {
		const { cookies } = getRequestEvent();

		const [existingUser] = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`;
		if (existingUser) {
			invalid(issue.email('Email already registered'));
		}

		const passwordHash = hashPassword(password);
		const [user] = await sql<{ id: string; role: string }[]>`
			INSERT INTO users (email, password_hash, first_name, last_name, role)
			VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${role})
			RETURNING id, role
		`;

		const sessionId = randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

		await sql`
			INSERT INTO user_sessions (id, user_id, expires_at)
			VALUES (${sessionId}, ${user.id}, ${expiresAt})
		`;

		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 7
		});

		void getCurrentUser().refresh();
	}
);

export const logout = command(async () => {
	const { cookies } = getRequestEvent();
	const sessionId = cookies.get('session_id');

	if (sessionId) {
		await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
		cookies.delete('session_id', { path: '/' });
	}

	void getCurrentUser().refresh();
	return { success: true };
});
