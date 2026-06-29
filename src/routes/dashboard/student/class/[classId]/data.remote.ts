import { query, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { uuidSchema, type Class } from '$lib/types';

export const getClass = query(uuidSchema, async (classId): Promise<Class | null> => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'student') return null;

	const [row] = await sql<Class[]>`
		SELECT c.*,
			(SELECT attendance_rate FROM class_attendance_summary
			 WHERE class_id = c.id AND student_id = ${locals.user.id}) as attendance_rate
		FROM enrollments e
		JOIN classes c ON e.class_id = c.id
		WHERE c.id = ${classId} AND e.student_id = ${locals.user.id}
	`;
	return row ?? null;
});

export const getStudentAttendanceHistory = query(uuidSchema, async (classId) => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'student') return [];

	return await sql<
		{
			session_date: string;
			status: 'present' | 'absent' | 'late' | 'excused';
			verified_at: string | null;
		}[]
	>`
		SELECT cs.session_date, COALESCE(ar.status, 'absent') as status, ar.verified_at
		FROM class_sessions cs
		LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = ${locals.user.id}
		WHERE cs.class_id = ${classId}
		ORDER BY cs.session_date DESC
	`;
});
