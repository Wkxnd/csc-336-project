import { query, command } from '$app/server';
import { sql } from '$lib/server/db';
import { createHmac } from 'crypto';
import {
	uuidSchema,
	startAttendanceSchema,
	updateAttendanceStatusSchema,
	type ClassSessionRow,
	type AttendanceRecord
} from '$lib/types';
import { getFaculty } from '$lib/auth.remote';
import { error } from '@sveltejs/kit';
import { requirePlan } from '$lib/server/plans';

const QR_TOKEN_WINDOW_MS = 15_000;

function getQrToken(secret: string, offset: number = 0, now = Date.now()): string {
	const timeWindow = Math.floor(now / QR_TOKEN_WINDOW_MS) + offset;
	return createHmac('sha256', secret).update(timeWindow.toString()).digest('hex');
}

function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function getNextQrWindowDelay(now = Date.now()) {
	const nextWindow = (Math.floor(now / QR_TOKEN_WINDOW_MS) + 1) * QR_TOKEN_WINDOW_MS;
	return nextWindow - now;
}

export const getSession = query(uuidSchema, async (sessionId) => {
	await getFaculty();

	const [row] = await sql<ClassSessionRow[]>`
		SELECT *
		FROM class_sessions
		WHERE id = ${sessionId}
	`;

	return row ?? error(404, 'Session not found');
});

export const startAttendance = command(
	startAttendanceSchema,
	async ({ sessionId, durationMinutes }) => {
		await getFaculty();

		await sql`
			CALL start_attendance_session(
				${sessionId},
				${durationMinutes}
			)
		`;

		const [session] = await sql<ClassSessionRow[]>`
			SELECT *
			FROM class_sessions
			WHERE id = ${sessionId}
		`;

		if (!session) {
			error(404, 'Session not found');
		}

		void getSession(sessionId).set(session);
		void getLiveRotatingQrToken(sessionId).reconnect();
	}
);

export const stopAttendance = command(uuidSchema, async (sessionId) => {
	await getFaculty();

	const [session] = await sql<ClassSessionRow[]>`
		UPDATE class_sessions
		SET attendance_expires_at = NOW()
		WHERE id = ${sessionId}
		RETURNING *
	`;

	if (!session) {
		error(404, 'Session not found');
	}

	void getSession(sessionId).set(session);
	void getLiveRotatingQrToken(sessionId).reconnect();
});

export const getLiveRotatingQrToken = query.live(uuidSchema, async function* (sessionId) {
	await getFaculty();

	while (true) {
		const [session] = await sql<
			{ qr_secret: string | null; attendance_expires_at: string | null }[]
		>`
			SELECT qr_secret, attendance_expires_at
			FROM class_sessions
			WHERE id = ${sessionId}
		`;

		const expiresAt = session?.attendance_expires_at ?? null;
		const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : null;
		const now = Date.now();

		if (!session?.qr_secret || expiresAtMs === null || expiresAtMs <= now) {
			yield {
				active: false,
				token: null,
				expiresAt
			};

			await sleep(QR_TOKEN_WINDOW_MS);
			continue;
		}

		yield {
			active: true,
			token: getQrToken(session.qr_secret, 0, now),
			expiresAt
		};

		await sleep(Math.min(getNextQrWindowDelay(now), expiresAtMs - now));
	}
});

export const getSessionAttendance = query(uuidSchema, async (sessionId) => {
	await getFaculty();

	return await sql<AttendanceRecord[]>`
		SELECT
			u.id AS student_id,
			u.first_name,
			u.last_name,
			u.email,
			COALESCE(ar.status, 'absent') AS status,
			ar.verified_at,
			ar.ip_address,
			ar.user_agent
		FROM class_sessions cs
		JOIN enrollments e
			ON cs.class_id = e.class_id
		JOIN users u
			ON e.student_id = u.id
		LEFT JOIN attendance_records ar
			ON ar.session_id = cs.id
			AND ar.student_id = u.id
		WHERE cs.id = ${sessionId}
		ORDER BY u.last_name ASC, u.first_name ASC
	`;
});

export const updateAttendanceStatus = command(
	updateAttendanceStatusSchema,
	async ({ sessionId, studentId, status }) => {
		await getFaculty();

		await sql`
			INSERT INTO attendance_records (
				session_id,
				student_id,
				status,
				verified_at
			)
			VALUES (
				${sessionId},
				${studentId},
				${status},
				NOW()
			)
			ON CONFLICT (session_id, student_id)
			DO UPDATE SET
				status = ${status},
				verified_at = NOW()
		`;

		void getSessionAttendance(sessionId).refresh();
	}
);

export const getLiveAttendanceCount = query.live(uuidSchema, async function* (sessionId) {
	while (true) {
		const [result] = await sql<[{ present_count: string; total_count: string }]>`
			SELECT
				COUNT(*) FILTER (
					WHERE ar.status = 'present'
				) AS present_count,
				COUNT(*) AS total_count
			FROM class_sessions cs
			JOIN enrollments e
				ON e.class_id = cs.class_id
			LEFT JOIN attendance_records ar
				ON ar.session_id = cs.id
				AND ar.student_id = e.student_id
			WHERE cs.id = ${sessionId}
		`;

		yield {
			present: Number(result.present_count),
			total: Number(result.total_count)
		};

		await sleep(3000);
	}
});

/** Live-streaming list of only the students who have marked attendance, newest first. */
export const getLiveCheckIns = query.live(uuidSchema, async function* (sessionId) {
	await getFaculty();

	while (true) {
		const checkedIn = await sql<
			{
				first_name: string;
				last_name: string;
				email: string;
				verified_at: string;
			}[]
		>`
			SELECT
				u.first_name,
				u.last_name,
				u.email,
				ar.verified_at
			FROM attendance_records ar
			JOIN users u
				ON ar.student_id = u.id
			WHERE ar.session_id = ${sessionId}
				AND ar.status = 'present'
			ORDER BY ar.verified_at DESC
		`;

		yield checkedIn;
		await sleep(3000);
	}
});

export const exportSessionCsv = query(uuidSchema, async (sessionId) => {
	const user = await getFaculty();
	await requirePlan(user.id, 'premium');

	const rows = await sql<AttendanceRecord[]>`
		SELECT
			u.first_name,
			u.last_name,
			u.email,
			COALESCE(ar.status, 'absent') AS status,
			ar.verified_at,
			ar.ip_address,
			ar.user_agent
		FROM class_sessions cs
		JOIN enrollments e
			ON cs.class_id = e.class_id
		JOIN users u
			ON e.student_id = u.id
		LEFT JOIN attendance_records ar
			ON ar.session_id = cs.id
			AND ar.student_id = u.id
		WHERE cs.id = ${sessionId}
		ORDER BY u.last_name ASC, u.first_name ASC
	`;

	const escape = (value: unknown) => {
		if (value === null || value === undefined) {
			return '""';
		}

		const str = value instanceof Date ? value.toISOString() : String(value);
		return `"${str.replace(/"/g, '""')}"`;
	};

	const header = 'First Name,Last Name,Email,Status,Verified At,IP Address,User Agent';

	const lines = rows.map((row) =>
		[
			row.first_name,
			row.last_name,
			row.email,
			row.status,
			row.verified_at,
			row.ip_address,
			row.user_agent
		]
			.map(escape)
			.join(',')
	);

	return [header, ...lines].join('\n');
});
