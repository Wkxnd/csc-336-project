import type { Handle } from '@sveltejs/kit';
import { sql } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');
	event.locals.user = null;

	if (sessionId) {
		try {
			const [session] = await sql`
				SELECT us.expires_at, u.id, u.email, u.first_name, u.last_name, u.role
				FROM user_sessions us
				JOIN users u ON us.user_id = u.id
				WHERE us.id = ${sessionId}
			`;

			if (session) {
				if (new Date(session.expires_at) > new Date()) {
					event.locals.user = {
						id: session.id,
						email: session.email,
						firstName: session.first_name,
						lastName: session.last_name,
						role: session.role
					};
				} else {
					// Session expired, delete from DB and cookie
					await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
					event.cookies.delete('session_id', { path: '/' });
				}
			} else {
				// Invalid session ID, delete cookie
				event.cookies.delete('session_id', { path: '/' });
			}
		} catch (error) {
			console.error('Session lookup error in hooks.server.ts:', error);
		}
	}

	return resolve(event);
};
