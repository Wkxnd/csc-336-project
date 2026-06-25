import { query, command, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { createHmac } from 'crypto';
import {
	uuidSchema,
	startAttendanceSchema,
	updateAttendanceStatusSchema,
	type ClassSession,
	type AttendanceRecord,
	type AttendanceCount
} from '$lib/types';
import { getSessions } from '../../data.remote';

function getQrToken(secret: string, offset: number = 0): string {
	const timeWindow = Math.floor(Date.now() / 15000) + offset;
	return createHmac('sha256', secret).update(timeWindow.toString()).digest('hex');
}

export const getSession = query(uuidSchema, async (sessionId): Promise<ClassSession | null> => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'faculty') return null;

	const [row] = await sql<ClassSession[]>`
		SELECT * FROM class_sessions WHERE id = ${sessionId}
	`;
	return row ?? null;
});

export const startAttendance = command(
	startAttendanceSchema,
	async ({ sessionId, durationMinutes }) => {
		const { locals } = getRequestEvent();
		if (!locals.user || locals.user.role !== 'faculty') {
			throw new Error('Unauthorized');
		}

		const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
		const [session] = await sql<ClassSession[]>`
			UPDATE class_sessions
			SET attendance_expires_at = ${expiresAt}
			WHERE id = ${sessionId}
			RETURNING *
		`;

		void getSessions(session.class_id).refresh();
		void getRotatingQrToken(sessionId).refresh();

		return { success: true, session };
	}
);

export const stopAttendance = command(uuidSchema, async (sessionId) => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'faculty') {
		throw new Error('Unauthorized');
	}

	const [session] = await sql<ClassSession[]>`
		UPDATE class_sessions
		SET attendance_expires_at = NOW()
		WHERE id = ${sessionId}
		RETURNING *
	`;

	void getSessions(session.class_id).refresh();
	void getRotatingQrToken(sessionId).refresh();

	return { success: true, session };
});

export const getRotatingQrToken = query(uuidSchema, async (sessionId) => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'faculty') {
		throw new Error('Unauthorized');
	}

	const [session] = await sql<{ qr_secret: string; attendance_expires_at: string | null }[]>`
		SELECT qr_secret, attendance_expires_at
		FROM class_sessions
		WHERE id = ${sessionId}
	`;

	if (
		!session ||
		(session.attendance_expires_at && new Date(session.attendance_expires_at) < new Date())
	) {
		return { active: false, token: null };
	}

	return { active: true, token: getQrToken(session.qr_secret, 0) };
});

export const getSessionAttendance = query(
	uuidSchema,
	async (sessionId): Promise<AttendanceRecord[]> => {
		const { locals } = getRequestEvent();
		if (!locals.user || locals.user.role !== 'faculty') return [];

		return await sql<AttendanceRecord[]>`
			SELECT u.id as student_id, u.first_name, u.last_name, u.email,
				COALESCE(ar.status, 'absent') as status, ar.verified_at, ar.ip_address, ar.user_agent
			FROM class_sessions cs
			JOIN enrollments e ON cs.class_id = e.class_id
			JOIN users u ON e.student_id = u.id
			LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = u.id
			WHERE cs.id = ${sessionId}
			ORDER BY u.last_name ASC, u.first_name ASC
		`;
	}
);

export const updateAttendanceStatus = command(
	updateAttendanceStatusSchema,
	async ({ sessionId, studentId, status }) => {
		const { locals } = getRequestEvent();
		if (!locals.user || locals.user.role !== 'faculty') {
			throw new Error('Unauthorized');
		}

		await sql`
			INSERT INTO attendance_records (session_id, student_id, status, verified_at)
			VALUES (${sessionId}, ${studentId}, ${status}, NOW())
			ON CONFLICT (session_id, student_id)
			DO UPDATE SET status = ${status}, verified_at = NOW()
		`;

		void getSessionAttendance(sessionId).refresh();
		return { success: true };
	}
);

export const getLiveAttendanceCount = query.live(
	uuidSchema,
	async function* (sessionId): AsyncGenerator<AttendanceCount> {
		while (true) {
			const [result] = await sql<[{ present_count: string; total_count: string }]>`
				SELECT
					COUNT(*) FILTER (WHERE ar.status = 'present') as present_count,
					COUNT(*) as total_count
				FROM class_sessions cs
				JOIN enrollments e ON e.class_id = cs.class_id
				LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = e.student_id
				WHERE cs.id = ${sessionId}
			`;
			yield { present: Number(result.present_count), total: Number(result.total_count) };
			await new Promise((f) => setTimeout(f, 3000));
		}
	}
);
