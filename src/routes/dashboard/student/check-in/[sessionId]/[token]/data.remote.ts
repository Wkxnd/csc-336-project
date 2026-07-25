import { query, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { getStudent } from '$lib/auth.remote';
import { getAttendanceWindowStatus, isQrTokenValid } from '$lib/server/attendance';
import { requireStudentEnrollment } from '$lib/server/authorization';
import { uuidSchema, verifyQrCheckInSchema } from '$lib/types';
import { error } from '@sveltejs/kit';
import { resolveAsnFromIp } from '$lib/server/plans';

export const verifyQrCheckIn = query(verifyQrCheckInSchema, async ({sessionId, token}) => {
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

	const attendanceWindow = getAttendanceWindowStatus(session.attendance_expires_at);
	if (attendanceWindow === 'not-started') {
		error(403, 'Attendance session has not started');
	}

	if (attendanceWindow === 'closed') {
		error(403, 'Attendance session has closed');
	}

	await requireStudentEnrollment(user.id, session.class_id);

	if (!session.qr_secret) {
		error(403, 'QR code not available for this session');
	}

	if (!isQrTokenValid(session.qr_secret, token)) {
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
		error(403, `Check-in blocked: your network ASN (${asn}) is not on this class allowlist.`);
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
		{
			class_id: string;
			class_name: string;
			session_date: string;
			verified_at: string | null;
			status: string | null;
		}[]
	>`
		SELECT c.id AS class_id, c.name AS class_name, cs.session_date, ar.verified_at, ar.status
		FROM class_sessions cs
		JOIN classes c ON cs.class_id = c.id
		LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = ${user.id}
		WHERE cs.id = ${sessionId}
	`;

	if (!record) {
		return null;
	}

	await requireStudentEnrollment(user.id, record.class_id);
	return {
		class_name: record.class_name,
		session_date: record.session_date,
		verified_at: record.verified_at,
		status: record.status
	};
});
