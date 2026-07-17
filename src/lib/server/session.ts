import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { sql } from '$lib/server/db';
import { randomBytes } from 'crypto';

export const SESSION_COOKIE_NAME = 'session_id';
export const SESSION_EXPIRATION_TIME = 60 * 60 * 24 * 7; // 7 days

export function setSessionCookie(cookies: Cookies, sessionId: string): void {
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		// Secure cookies require HTTPS; Safari (unlike Chrome) drops them on http://localhost,
		// so only enforce Secure outside dev.
		secure: !dev,
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
