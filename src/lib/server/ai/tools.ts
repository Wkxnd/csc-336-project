import { tool, jsonSchema } from 'ai';
import { sql } from '$lib/server/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const classIdSchema = jsonSchema<{ classId: string }>({
	type: 'object',
	properties: { classId: { type: 'string', description: 'The UUID of the class' } },
	required: ['classId'],
	additionalProperties: false
});

/**
 * Confirms the given class belongs to the professor. Returns the class row or
 * null. Every data tool calls this first so a professor can only ever read
 * their own classes' data.
 */
async function ownedClass(facultyId: string, classId: string) {
	if (!UUID_RE.test(classId)) return null;
	const [row] = await sql<{ id: string; name: string; code: string; description: string | null }[]>`
		SELECT id, name, code, description
		FROM classes
		WHERE id = ${classId} AND faculty_id = ${facultyId}
	`;
	return row ?? null;
}

const NOT_OWNED = { error: 'Class not found or not owned by this professor.' } as const;

export function createFacultyTools(facultyId: string) {
	return {
		listCourses: tool({
			description:
				"List all of the professor's classes. Use this to map a spoken class name or code to its id before calling other tools.",
			inputSchema: jsonSchema<Record<string, never>>({
				type: 'object',
				properties: {},
				additionalProperties: false
			}),
			execute: async () => {
				const classes = await sql<{ id: string; code: string; name: string }[]>`
					SELECT id, code, name
					FROM classes
					WHERE faculty_id = ${facultyId}
					ORDER BY code ASC
				`;
				return { classes };
			}
		}),

		getCourseOverview: tool({
			description:
				'Get a high-level overview of a single class: name, code, description, number of enrolled students, number of sessions, and the average attendance rate across students.',
			inputSchema: classIdSchema,
			execute: async ({ classId }) => {
				const cls = await ownedClass(facultyId, classId);
				if (!cls) return NOT_OWNED;

				const [{ student_count }] = await sql<{ student_count: number }[]>`
					SELECT COUNT(*)::int AS student_count FROM enrollments WHERE class_id = ${classId}
				`;
				const [{ session_count }] = await sql<{ session_count: number }[]>`
					SELECT COUNT(*)::int AS session_count FROM class_sessions WHERE class_id = ${classId}
				`;
				const [{ avg_attendance_rate }] = await sql<{ avg_attendance_rate: number | null }[]>`
					SELECT ROUND(AVG(attendance_rate), 2)::float AS avg_attendance_rate
					FROM class_attendance_summary
					WHERE class_id = ${classId}
				`;

				return {
					id: cls.id,
					name: cls.name,
					code: cls.code,
					description: cls.description,
					studentCount: student_count,
					sessionCount: session_count,
					averageAttendanceRate: avg_attendance_rate ?? 0
				};
			}
		}),

		listSessions: tool({
			description: 'List all class sessions (with their dates) for a class.',
			inputSchema: classIdSchema,
			execute: async ({ classId }) => {
				const cls = await ownedClass(facultyId, classId);
				if (!cls) return NOT_OWNED;

				const sessions = await sql<{ id: string; session_date: string }[]>`
					SELECT id, session_date
					FROM class_sessions
					WHERE class_id = ${classId}
					ORDER BY session_date DESC
				`;
				return { sessions };
			}
		}),

		getSessionAttendance: tool({
			description:
				'Get the attendance breakdown (present/absent/late/excused counts) for a single class session.',
			inputSchema: jsonSchema<{ sessionId: string }>({
				type: 'object',
				properties: { sessionId: { type: 'string', description: 'The UUID of the session' } },
				required: ['sessionId'],
				additionalProperties: false
			}),
			execute: async ({ sessionId }) => {
				if (!UUID_RE.test(sessionId)) {
					return { error: 'Session not found or not owned by this professor.' };
				}
				const [row] = await sql<
					{
						session_id: string;
						session_date: string;
						class_name: string;
						class_code: string;
						present: number;
						absent: number;
						late: number;
						excused: number;
					}[]
				>`
					SELECT
						cs.id AS session_id,
						cs.session_date,
						c.name AS class_name,
						c.code AS class_code,
						COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::int AS present,
						COUNT(CASE WHEN ar.status = 'absent' THEN 1 END)::int AS absent,
						COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::int AS late,
						COUNT(CASE WHEN ar.status = 'excused' THEN 1 END)::int AS excused
					FROM class_sessions cs
					JOIN classes c ON cs.class_id = c.id
					LEFT JOIN attendance_records ar ON ar.session_id = cs.id
					WHERE cs.id = ${sessionId} AND c.faculty_id = ${facultyId}
					GROUP BY cs.id, cs.session_date, c.name, c.code
				`;
				if (!row) return { error: 'Session not found or not owned by this professor.' };

				return {
					sessionId: row.session_id,
					sessionDate: row.session_date,
					className: row.class_name,
					classCode: row.class_code,
					present: row.present,
					absent: row.absent,
					late: row.late,
					excused: row.excused
				};
			}
		}),

		getStudentAttendance: tool({
			description:
				'Get per-student attendance stats for a class (session counts and attendance rate per student). Optionally filter by a student name substring.',
			inputSchema: jsonSchema<{ classId: string; studentName?: string }>({
				type: 'object',
				properties: {
					classId: { type: 'string', description: 'The UUID of the class' },
					studentName: {
						type: 'string',
						description: 'Optional case-insensitive substring to filter students by name'
					}
				},
				required: ['classId'],
				additionalProperties: false
			}),
			execute: async ({ classId, studentName }) => {
				const cls = await ownedClass(facultyId, classId);
				if (!cls) return NOT_OWNED;

				const nameFilter = studentName ? `%${studentName}%` : null;
				const students = await sql<
					{
						student_name: string;
						student_email: string;
						total_sessions: number;
						present_count: number;
						absent_count: number;
						late_count: number;
						excused_count: number;
						attendance_rate: number;
					}[]
				>`
					SELECT student_name, student_email, total_sessions, present_count,
						absent_count, late_count, excused_count, attendance_rate
					FROM class_attendance_summary
					WHERE class_id = ${classId}
					${nameFilter ? sql`AND student_name ILIKE ${nameFilter}` : sql``}
					ORDER BY attendance_rate ASC
				`;
				return { students };
			}
		}),

		getAtRiskStudents: tool({
			description:
				'List students in a class whose attendance rate is below a threshold (default 70 percent).',
			inputSchema: jsonSchema<{ classId: string; threshold?: number }>({
				type: 'object',
				properties: {
					classId: { type: 'string', description: 'The UUID of the class' },
					threshold: {
						type: 'number',
						description: 'Attendance rate percentage cutoff (0-100). Defaults to 70.'
					}
				},
				required: ['classId'],
				additionalProperties: false
			}),
			execute: async ({ classId, threshold }) => {
				const cls = await ownedClass(facultyId, classId);
				if (!cls) return NOT_OWNED;

				const cutoff = threshold ?? 70;
				const students = await sql<
					{
						student_name: string;
						student_email: string;
						total_sessions: number;
						present_count: number;
						attendance_rate: number;
					}[]
				>`
					SELECT student_name, student_email, total_sessions, present_count, attendance_rate
					FROM class_attendance_summary
					WHERE class_id = ${classId} AND attendance_rate < ${cutoff}
					ORDER BY attendance_rate ASC
				`;
				return { threshold: cutoff, students };
			}
		})
	};
}
