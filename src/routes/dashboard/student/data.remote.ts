import { query, form } from '$app/server';
import { sql } from '$lib/server/db';
import { invalid } from '@sveltejs/kit';
import { getStudent } from '$lib/auth.remote';
import { enrollInClassSchema, type Class } from '$lib/types';

export const getClasses = query(async () => {
	const user = await getStudent();

	return await sql<Class[]>`
		SELECT c.*,
			(SELECT attendance_rate
			 FROM class_attendance_summary
			 WHERE class_id = c.id
			   AND student_id = ${user.id}) AS attendance_rate
		FROM enrollments e
		JOIN classes c
			ON e.class_id = c.id
		WHERE e.student_id = ${user.id}
		ORDER BY e.enrolled_at DESC
	`;
});

export const enrollInClass = form(enrollInClassSchema, async ({ classCode }, issue) => {
	const user = await getStudent();

	try {
		await sql`
				CALL enroll_student(
					${classCode},
					${user.id}
				)
			`;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);

		if (message.includes('Class not found')) {
			invalid(issue.classCode('Class not found'));
		}

		if (message.includes('Already enrolled in this class')) {
			invalid(issue.classCode('Already enrolled in this class'));
		}

		throw err;
	}

	void getClasses().refresh();
});
