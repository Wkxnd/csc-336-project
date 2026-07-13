import { query } from '$app/server';
import { getStudent } from '$lib/auth.remote';
import { sql } from '$lib/server/db';
import { uuidSchema, type Class } from '$lib/types';
import { error } from '@sveltejs/kit';


export const getClass = query(uuidSchema, async (classId) => {
	const user = await getStudent();

	const [row] = await sql<Class[]>`
		SELECT c.*,
			(SELECT attendance_rate FROM class_attendance_summary
			 WHERE class_id = c.id AND student_id = ${user.id}) as attendance_rate
		FROM enrollments e
		JOIN classes c ON e.class_id = c.id
		WHERE c.id = ${classId} AND e.student_id = ${user.id}
	`;
	return row ?? error(404, 'Class not found');
});

export const getStudentAttendanceHistory = query(uuidSchema, async (classId) => {
	const user = await getStudent();

	return await sql<
		{
			session_date: string;
			status: 'present' | 'absent' | 'late' | 'excused';
			verified_at: string | null;
		}[]
	>`
		SELECT cs.session_date, COALESCE(ar.status, 'absent') as status, ar.verified_at
		FROM class_sessions cs
		LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = ${user.id}
		WHERE cs.class_id = ${classId}
		ORDER BY cs.session_date DESC
	`;
});
