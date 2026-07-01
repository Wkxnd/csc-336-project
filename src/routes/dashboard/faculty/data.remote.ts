import { query, form } from '$app/server';
import { sql } from '$lib/server/db';
import { invalid } from '@sveltejs/kit';
import { createClassSchema, type Class } from '$lib/types';
import { getFaculty } from '$lib/auth.remote';

export const getClasses = query(async () => {
	const user = await getFaculty();

	return await sql<Class[]>`
		SELECT * FROM classes
		WHERE faculty_id = ${user.id}
		ORDER BY created_at DESC
	`;
});

export const createClass = form(createClassSchema, async ({ name, code, description }, issue) => {
	const user = await getFaculty();

	const [existingClass] = await sql<{ id: string }[]>`SELECT id FROM classes WHERE code = ${code}`;
	if (existingClass) {
		invalid(issue.code('Class code already exists'));
	}

	await sql`
		INSERT INTO classes (faculty_id, name, code, description)
		VALUES (${user.id}, ${name}, ${code}, ${description})
	`;

	void getClasses().refresh();
});
