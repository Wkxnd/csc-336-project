import { error } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import type { Class, ClassSessionRow } from '$lib/types';

export async function requireOwnedClass(facultyId: string, classId: string): Promise<Class> {
	const [classRecord] = await sql<Class[]>`
		SELECT *
		FROM classes
		WHERE id = ${classId} AND faculty_id = ${facultyId}
	`;

	if (!classRecord) {
		error(404, 'Class not found');
	}

	return classRecord;
}

export async function requireOwnedSession(
	facultyId: string,
	sessionId: string
): Promise<ClassSessionRow> {
	const [session] = await sql<ClassSessionRow[]>`
		SELECT cs.*
		FROM class_sessions cs
		JOIN classes c ON c.id = cs.class_id
		WHERE cs.id = ${sessionId} AND c.faculty_id = ${facultyId}
	`;

	if (!session) {
		error(404, 'Session not found');
	}

	return session;
}

export async function requireStudentEnrollment(studentId: string, classId: string): Promise<void> {
	const [enrollment] = await sql<{ enrolled: boolean }[]>`
		SELECT TRUE AS enrolled
		FROM enrollments
		WHERE student_id = ${studentId} AND class_id = ${classId}
	`;

	if (!enrollment) {
		error(403, 'You are not enrolled in this class');
	}
}
