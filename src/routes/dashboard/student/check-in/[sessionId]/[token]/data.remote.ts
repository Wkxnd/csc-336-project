import { query, command, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { createHmac } from 'crypto';
import { getStudent } from '$lib/auth.remote';
import { uuidSchema, verifyQrCheckInSchema } from '$lib/types';
import { error } from '@sveltejs/kit';

function getQrToken(secret: string, offset: number = 0): string {
	const timeWindow = Math.floor(Date.now() / 15000) + offset;
	return createHmac('sha256', secret).update(timeWindow.toString()).digest('hex');
}

export const verifyQrCheckIn = command(verifyQrCheckInSchema, async ({ sessionId, token }) => {
	const { request } = getRequestEvent();
	const user = await getStudent();

	const [session] = await sql<{ qr_secret: string | null; attendance_expires_at: string | null }[]>`
		SELECT qr_secret, attendance_expires_at
		FROM class_sessions
		WHERE id = ${sessionId}
	`;

	if (!session) {
		// throw new Error('Session not found');
		error(404, 'Session not found');
	}

	if (session.attendance_expires_at && new Date(session.attendance_expires_at) < new Date()) {
		// throw new Error('Attendance session has closed');
		error(403, 'Attendance session has closed');
	}

	if (!session.qr_secret) {
		// throw new Error('QR code not available for this session');
		error(403, 'QR code not available for this session');
	}

	const expectedCurrent = getQrToken(session.qr_secret, 0);
	const expectedPrevious = getQrToken(session.qr_secret, -1);

	if (token !== expectedCurrent && token !== expectedPrevious) {
		// throw new Error('Invalid or expired QR code');
		error(400, 'Invalid or expired QR code');
	}

	const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
	const userAgent = request.headers.get('user-agent') || 'Unknown';

	await sql`
		INSERT INTO attendance_records (session_id, student_id, status, verified_at, ip_address, user_agent)
		VALUES (${sessionId}, ${user.id}, 'present', NOW(), ${ip}, ${userAgent})
		ON CONFLICT (session_id, student_id)
		DO UPDATE SET status = 'present', verified_at = NOW(), ip_address = ${ip}, user_agent = ${userAgent}
	`;

	return {
		class_name: 'test',
		session_date: new Date().toISOString(),
		verified_at: new Date().toISOString(),
		status: 'present'
	};

	// void getStudentLatestCheckInDetails(sessionId).refresh();
});

export const getStudentLatestCheckInDetails = query(uuidSchema, async (sessionId) => {
	const user = await getStudent();

	const [record] = await sql<
		{ class_name: string; session_date: string; verified_at: string; status: string }[]
	>`
		SELECT c.name as class_name, cs.session_date, ar.verified_at, ar.status
		FROM class_sessions cs
		JOIN classes c ON cs.class_id = c.id
		LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = ${user.id}
		WHERE cs.id = ${sessionId}
	`;
	return record || null;
});
