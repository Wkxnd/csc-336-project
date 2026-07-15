import { query, form } from '$app/server';
import { sql } from '$lib/server/db';
import { invalid } from '@sveltejs/kit';
import { createClassSchema, type Class } from '$lib/types';
import { getFaculty } from '$lib/auth.remote';
import { getFacultyPlan, PLAN_FEATURES } from '$lib/server/plans';

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
	const plan = await getFacultyPlan(user.id);
	const maxClasses = PLAN_FEATURES[plan].maxClasses;

	if (Number.isFinite(maxClasses)) {
		const [{ count }] = await sql<[{ count: string }]>`
			SELECT COUNT(*)::text AS count FROM classes WHERE faculty_id = ${user.id}
		`;
		if (Number(count) >= maxClasses) {
			invalid(
				issue.name(
					`Free plan is limited to ${maxClasses} class. Upgrade to Premium for unlimited classes.`
				)
			);
		}
	}

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
