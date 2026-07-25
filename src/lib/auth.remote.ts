import { query, form, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { error, invalid, redirect } from '@sveltejs/kit';
import { createUserSession, destroySession, SESSION_COOKIE_NAME } from '$lib/server/session';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { loginSchema, registerSchema, type User, type UserRow } from '$lib/types';
import * as v from 'valibot';

// TODO: fix
function authRedirect(url: URL) {
	const qs =
		url.pathname != '/' || url.search
			? `?redirect=${encodeURIComponent(url.pathname + url.search)}`
			: '';
	// console.log('authRedirect', url.pathname, url.search);
	return redirect(307, `/auth${qs}`);
}

function postLoginRedirect(url: URL, role: User['role']): string {
	const redirectParam = url.searchParams.get('redirect');
	if (redirectParam && redirectParam.startsWith('/')) {
		return redirectParam;
	}
	return `/dashboard/${role}`;
}

// --- Authentication ---

export const getCurrentUser = query(async () => {
	const { cookies, url } = getRequestEvent();
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) {
		return authRedirect(url);
	}

	try {
		const [session] = await sql<(User & { expires_at: string })[]>`
				SELECT u.id, u.email, u.first_name, u.last_name, u.role, us.expires_at
				FROM user_sessions us
				JOIN users u ON us.user_id = u.id
				WHERE us.id = ${sessionId}
			`;

		if (!session) {
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
			return authRedirect(url);
		}

		if (new Date(session.expires_at) <= new Date()) {
			await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
			cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
			return authRedirect(url);
		}

		return session;
	} catch (err) {
		console.error('Session lookup error:', err);
		return error(500, 'Internal Server Error');
	}
});

// TODO: maybe also treat these as type guards and return per-role types instead of just User
export const getFaculty = query(async () => {
	const user = await getCurrentUser();
	if (user.role !== 'faculty') {
		return error(403, 'Forbidden');
	}
	return user;
});

export const getStudent = query(async () => {
	const user = await getCurrentUser();
	if (user.role !== 'student') {
		return error(403, 'Forbidden');
	}
	return user;
});

export const login = form(loginSchema, async ({ email, password }, issue) => {
	const { cookies, url } = getRequestEvent();

	const [user] = await sql<UserRow[]>`SELECT * FROM users WHERE email = ${email}`;
	if (!user || !verifyPassword(password, user.password_hash)) {
		invalid(issue.email('Invalid email or password'));
	}

	await createUserSession(cookies, user.id);
	redirect(303, postLoginRedirect(url, user.role));
});

export const register = form(
	registerSchema,
	async ({ email, password, firstName, lastName, role }, issue) => {
		const { cookies, url } = getRequestEvent();

		const [existingUser] = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`;
		if (existingUser) {
			invalid(issue.email('Email already registered'));
		}

		const passwordHash = hashPassword(password);
		const [user] = await sql<{ id: string; role: 'faculty' | 'student' }[]>`
			INSERT INTO users (email, password_hash, first_name, last_name, role)
			VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${role})
			RETURNING id, role
		`;

		if (user.role === 'faculty') {
			await sql`
				INSERT INTO subscriptions (user_id, plan, status)
				VALUES (${user.id}, 'free', 'active')
			`;
		}

		await createUserSession(cookies, user.id);
		redirect(303, postLoginRedirect(url, user.role));
	}
);

export const logout = form(v.object({}), async () => {
	const { cookies } = getRequestEvent();
	await destroySession(cookies);
	redirect(303, '/auth');
});
