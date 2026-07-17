import { query, command, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { createHmac } from 'crypto';
import { getStudent } from '$lib/auth.remote';
import { uuidSchema, verifyQrCheckInSchema } from '$lib/types';
import { error } from '@sveltejs/kit';
import { resolveAsnFromIp } from '$lib/server/plans';

function getQrToken(secret: string, offset: number = 0): string {
	const timeWindow = Math.floor(Date.now() / 15000) + offset;
	return createHmac('sha256', secret).update(timeWindow.toString()).digest('hex');
}

export const verifyQrCheckIn = command(verifyQrCheckInSchema, async ({ sessionId, token }) => {
	const { request } = getRequestEvent();
	const user = await getStudent();

	const [session] = await sql<
		{
			qr_secret: string | null;
			attendance_expires_at: string | null;
			class_id: string;
			class_name: string;
			session_date: string;
		}[]
	>`
		SELECT cs.qr_secret, cs.attendance_expires_at, cs.class_id,
			c.name AS class_name, cs.session_date
		FROM class_sessions cs
		JOIN classes c ON cs.class_id = c.id
		WHERE cs.id = ${sessionId}
	`;

	if (!session) {
		error(404, 'Session not found');
	}

	if (session.attendance_expires_at && new Date(session.attendance_expires_at) < new Date()) {
		error(403, 'Attendance session has closed');
	}

	if (!session.qr_secret) {
		error(403, 'QR code not available for this session');
	}

	const expectedCurrent = getQrToken(session.qr_secret, 0);
	const expectedPrevious = getQrToken(session.qr_secret, -1);

	if (token !== expectedCurrent && token !== expectedPrevious) {
		error(400, 'Invalid or expired QR code');
	}

	const ipHeader = request.headers.get('x-forwarded-for') || '127.0.0.1';
	const ip = ipHeader.split(',')[0]?.trim() || '127.0.0.1';
	const userAgent = request.headers.get('user-agent') || 'Unknown';
	const asn = resolveAsnFromIp(ip);

	const allowed = await sql<{ allowed_asn: number }[]>`
		SELECT allowed_asn FROM class_network_restrictions WHERE class_id = ${session.class_id}
	`;

	if (allowed.length > 0 && !allowed.some((r) => r.allowed_asn === asn)) {
		error(
			403,
			`Check-in blocked: your network ASN (${asn}) is not on this class allowlist.`
		);
	}

	await sql`
		INSERT INTO attendance_records (session_id, student_id, status, verified_at, ip_address, asn, user_agent)
		VALUES (${sessionId}, ${user.id}, 'present', NOW(), ${ip}, ${asn}, ${userAgent})
		ON CONFLICT (session_id, student_id)
		DO UPDATE SET status = 'present', verified_at = NOW(), ip_address = ${ip}, asn = ${asn}, user_agent = ${userAgent}
	`;

	return {
		class_name: session.class_name,
		session_date: session.session_date,
		verified_at: new Date().toISOString(),
		status: 'present'
	};
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
