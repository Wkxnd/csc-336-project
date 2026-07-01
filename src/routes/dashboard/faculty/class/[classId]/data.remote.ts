import { query, form } from '$app/server';
import { sql } from '$lib/server/db';
import { randomBytes } from 'crypto';
import { getFaculty } from '$lib/auth.remote';
import {
	createSessionSchema,
	uuidSchema,
	type ClassSession,
	type Class,
	type Student
} from '$lib/types';

export const getClass = query(uuidSchema, async (classId) => {
	const user = await getFaculty();

	const [row] = await sql<Class[]>`
		SELECT * FROM classes
		WHERE id = ${classId} AND faculty_id = ${user.id}
	`;
	// TODO: use error boundaries and throw 404 if row is null
	return row ?? null;
});

export const getSessions = query(uuidSchema, async (classId) => {
	// TODO: scope classes to faculty
	await getFaculty();

	return await sql<ClassSession[]>`
		SELECT * FROM class_sessions
		WHERE class_id = ${classId}
		ORDER BY session_date DESC
	`;
});

export const createSession = form(createSessionSchema, async ({ classId, sessionDate }) => {
	// const user =
	await getFaculty();

	const qrSecret = randomBytes(16).toString('hex');
	const [session] = await sql<ClassSession[]>`
		INSERT INTO class_sessions (class_id, session_date, qr_secret)
		VALUES (${classId}, ${sessionDate}, ${qrSecret})
		RETURNING *
	`;

	const students = await sql<{ student_id: string }[]>`
		SELECT student_id FROM enrollments WHERE class_id = ${classId}
	`;
	for (const s of students) {
		await sql`
			INSERT INTO attendance_records (session_id, student_id, status)
			VALUES (${session.id}, ${s.student_id}, 'absent')
			ON CONFLICT DO NOTHING
		`;
	}

	void getSessions(classId).refresh();
});

export const getClassRoster = query(uuidSchema, async (classId) => {
	// const user =
	await getFaculty();

	return await sql<Student[]>`
		SELECT u.id, u.first_name, u.last_name, u.email, e.enrolled_at
		FROM enrollments e
		JOIN users u ON e.student_id = u.id
		WHERE e.class_id = ${classId}
		ORDER BY u.last_name ASC, u.first_name ASC
	`;
});
