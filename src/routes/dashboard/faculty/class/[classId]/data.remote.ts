import { query, form, command } from '$app/server';
import { sql } from '$lib/server/db';
import { randomBytes } from 'crypto';
import { getFaculty } from '$lib/auth.remote';
import {
	createSessionSchema,
	uuidSchema,
	addNetworkRestrictionSchema,
	removeNetworkRestrictionSchema,
	type ClassSession,
	type Class,
	type Student,
	type AttendanceTrendPoint,
	type StudentAttendanceSummary,
	type ClassNetworkRestrictionRow
} from '$lib/types';
import { error } from '@sveltejs/kit';
import { getFacultyPlan, requirePlan } from '$lib/server/plans';

export const getClass = query(uuidSchema, async (classId) => {
	const user = await getFaculty();

	const [row] = await sql<Class[]>`
		SELECT * FROM classes
		WHERE id = ${classId} AND faculty_id = ${user.id}
	`;
	return row ?? error(404, 'Class not found');
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

export const getClassAttendanceTrend = query(uuidSchema, async (classId) => {
	await getFaculty();

	return await sql<AttendanceTrendPoint[]>`
		SELECT
			cs.session_date,
			COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::integer AS present_count,
			COUNT(*)::integer AS total_count,
			ROUND(
				COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::numeric
				/ NULLIF(COUNT(*), 0)::numeric * 100,
				1
			) AS attendance_rate
		FROM class_sessions cs
		JOIN enrollments e ON e.class_id = cs.class_id
		LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = e.student_id
		WHERE cs.class_id = ${classId}
		GROUP BY cs.id, cs.session_date
		ORDER BY cs.session_date ASC
	`;
});

export const getClassStudentSummary = query(uuidSchema, async (classId) => {
	await getFaculty();

	return await sql<StudentAttendanceSummary[]>`
		SELECT student_name, student_email, total_sessions,
			present_count, absent_count, late_count,
			excused_count, attendance_rate
		FROM class_attendance_summary
		WHERE class_id = ${classId}
		ORDER BY attendance_rate ASC
	`;
});

export const getNetworkRestrictions = query(uuidSchema, async (classId) => {
	const user = await getFaculty();
	await getClass(classId);

	const plan = await getFacultyPlan(user.id);
	const restrictions = await sql<ClassNetworkRestrictionRow[]>`
		SELECT class_id, allowed_asn, created_at
		FROM class_network_restrictions
		WHERE class_id = ${classId}
		ORDER BY allowed_asn ASC
	`;

	return { plan, canManage: plan === 'enterprise', restrictions };
});

export const addNetworkRestriction = command(
	addNetworkRestrictionSchema,
	async ({ classId, allowedAsn }) => {
		const user = await getFaculty();
		await requirePlan(user.id, 'enterprise');
		await getClass(classId);

		await sql`
			INSERT INTO class_network_restrictions (class_id, allowed_asn)
			VALUES (${classId}, ${allowedAsn})
			ON CONFLICT DO NOTHING
		`;

		void getNetworkRestrictions(classId).refresh();
	}
);

export const removeNetworkRestriction = command(
	removeNetworkRestrictionSchema,
	async ({ classId, allowedAsn }) => {
		const user = await getFaculty();
		await requirePlan(user.id, 'enterprise');
		await getClass(classId);

		await sql`
			DELETE FROM class_network_restrictions
			WHERE class_id = ${classId} AND allowed_asn = ${allowedAsn}
		`;

		void getNetworkRestrictions(classId).refresh();
	}
);
