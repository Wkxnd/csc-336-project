import { query, form } from '$app/server';
import { sql } from '$lib/server/db';
import { invalid } from '@sveltejs/kit';
import { getStudent } from '$lib/auth.remote';
import { enrollInClassSchema, type Class } from '$lib/types';

export const getClasses = query(async () => {
	const user = await getStudent();

	return await sql<Class[]>`
		SELECT c.*,
			(SELECT attendance_rate FROM class_attendance_summary
			 WHERE class_id = c.id AND student_id = ${user.id}) as attendance_rate
		FROM enrollments e
		JOIN classes c ON e.class_id = c.id
		WHERE e.student_id = ${user.id}
		ORDER BY e.enrolled_at DESC
	`;
});

export const enrollInClass = form(enrollInClassSchema, async ({ classCode }, issue) => {
	const user = await getStudent();

	const [targetClass] = await sql<
		{ id: string }[]
	>`SELECT id FROM classes WHERE code = ${classCode}`;
	if (!targetClass) {
		invalid(issue.classCode('Class not found'));
	}

	const [existingEnrollment] = await sql<{ class_id: string }[]>`
		SELECT class_id FROM enrollments
		WHERE class_id = ${targetClass.id} AND student_id = ${user.id}
	`;

	if (existingEnrollment) {
		invalid(issue.classCode('Already enrolled in this class'));
	}

	await sql`
		INSERT INTO enrollments (class_id, student_id)
		VALUES (${targetClass.id}, ${user.id})
	`;

	const sessions = await sql<{ id: string }[]>`
		SELECT id FROM class_sessions WHERE class_id = ${targetClass.id}
	`;
	for (const s of sessions) {
		await sql`
			INSERT INTO attendance_records (session_id, student_id, status)
			VALUES (${s.id}, ${user.id}, 'absent')
			ON CONFLICT DO NOTHING
		`;
	}

	void getClasses().refresh();
});
