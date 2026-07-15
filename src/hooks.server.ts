import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME } from '$lib/server/session';
import { sql } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	// can't use existing getCurrentUser since it errors out and redirects to auth
	if (event.url.pathname === '/') {
		const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
		if (sessionId) {
			const [session] = await sql<{ role: string; expires_at: string }[]>`
				SELECT u.role, us.expires_at
				FROM user_sessions us
				JOIN users u ON us.user_id = u.id
				WHERE us.id = ${sessionId}
			`;

			if (session && new Date(session.expires_at) > new Date()) {
				return redirect(303, `/dashboard/${session.role}`);
			}
		}
	}

	return await resolve(event);
};
