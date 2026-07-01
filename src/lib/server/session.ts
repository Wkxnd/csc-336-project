import type { Cookies } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import type { User } from '$lib/types';
import { randomBytes } from 'crypto';

export const SESSION_COOKIE_NAME = 'session_id';
export const SESSION_EXPIRATION_TIME = 60 * 60 * 24 * 7; // 7 days

// TODO: get rid of this
export async function resolveSessionUser(cookies: Cookies): Promise<User | null> {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) return null;

	try {
		const [session] = await sql<(User & { expires_at: string })[]>`
			SELECT u.id, u.email, u.first_name, u.last_name, u.role, us.expires_at
			FROM user_sessions us
			JOIN users u ON us.user_id = u.id
			WHERE us.id = ${sessionId}
		`;

		if (!session) {
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
			return null;
		}

		if (new Date(session.expires_at) <= new Date()) {
			await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
			return null;
		}

		return {
			id: session.id,
			email: session.email,
			first_name: session.first_name,
			last_name: session.last_name,
			role: session.role
		};
	} catch (err) {
		console.error('Session lookup error:', err);
		return null;
	}
}

export function setSessionCookie(cookies: Cookies, sessionId: string): void {
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: SESSION_EXPIRATION_TIME
	});
}

export async function createUserSession(cookies: Cookies, userId: string): Promise<void> {
	const sessionId = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_TIME * 1000);

	await sql`
		INSERT INTO user_sessions (id, user_id, expires_at)
		VALUES (${sessionId}, ${userId}, ${expiresAt})
	`;

	setSessionCookie(cookies, sessionId);
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
	}
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
