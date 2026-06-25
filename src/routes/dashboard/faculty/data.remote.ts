import { query, form, getRequestEvent } from '$app/server';
import { sql } from '$lib/server/db';
import { invalid } from '@sveltejs/kit';
import { createClassSchema, type Class } from '$lib/types';

export const getClasses = query(async (): Promise<Class[]> => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'faculty') return [];

	return await sql<Class[]>`
		SELECT * FROM classes
		WHERE faculty_id = ${locals.user.id}
		ORDER BY created_at DESC
	`;
});

export const createClass = form(createClassSchema, async ({ name, code, description }, issue) => {
	const { locals } = getRequestEvent();
	if (!locals.user || locals.user.role !== 'faculty') {
		throw new Error('Unauthorized');
	}

	const [existingClass] = await sql<{ id: string }[]>`SELECT id FROM classes WHERE code = ${code}`;
	if (existingClass) {
		invalid(issue.code('Class code already exists'));
	}

	await sql`
		INSERT INTO classes (faculty_id, name, code, description)
		VALUES (${locals.user.id}, ${name}, ${code}, ${description})
	`;

	void getClasses().refresh();
});
