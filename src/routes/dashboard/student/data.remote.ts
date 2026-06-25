import { query, form, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { invalid } from '@sveltejs/kit';
import { uuidSchema, enrollInClassSchema, type Class } from '$lib/types';

export const getClasses = query(async (): Promise<Class[]> => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'student') return [];

	return await sql<Class[]>`
		SELECT c.*,
			(SELECT attendance_rate FROM class_attendance_summary
			 WHERE class_id = c.id AND student_id = ${locals.user.id}) as attendance_rate
		FROM enrollments e
		JOIN classes c ON e.class_id = c.id
		WHERE e.student_id = ${locals.user.id}
		ORDER BY e.enrolled_at DESC
	`;
});

export const enrollInClass = form(enrollInClassSchema, async ({ classCode }, issue) => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'student') {
		throw new Error('Unauthorized');
	}

	const [targetClass] = await sql<{ id: string }[]>`SELECT id FROM classes WHERE code = ${classCode}`;
	if (!targetClass) {
		invalid(issue.classCode('Class not found'));
	}

	const [existingEnrollment] = await sql<{ class_id: string }[]>`
		SELECT class_id FROM enrollments
		WHERE class_id = ${targetClass.id} AND student_id = ${locals.user.id}
	`;

	if (existingEnrollment) {
		invalid(issue.classCode('Already enrolled in this class'));
	}

	await sql`
		INSERT INTO enrollments (class_id, student_id)
		VALUES (${targetClass.id}, ${locals.user.id})
	`;

	const sessions = await sql<{ id: string }[]>`
		SELECT id FROM class_sessions WHERE class_id = ${targetClass.id}
	`;
	for (const s of sessions) {
		await sql`
			INSERT INTO attendance_records (session_id, student_id, status)
			VALUES (${s.id}, ${locals.user.id}, 'absent')
			ON CONFLICT DO NOTHING
		`;
	}

	void getClasses().refresh();
});

export const getStudentAttendanceHistory = query(uuidSchema, async (classId) => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'student') return [];

	return await sql<{ session_date: string; status: 'present' | 'absent' | 'late' | 'excused'; verified_at: string | null }[]>`
		SELECT cs.session_date, COALESCE(ar.status, 'absent') as status, ar.verified_at
		FROM class_sessions cs
		LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = ${locals.user.id}
		WHERE cs.class_id = ${classId}
		ORDER BY cs.session_date DESC
	`;
});
