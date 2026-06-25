import * as v from 'valibot';

// --- Shared Type Interfaces ---

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: 'faculty' | 'student';
}

export interface Class {
	id: string;
	faculty_id: string;
	name: string;
	code: string;
	description: string;
	created_at: string;
	attendance_rate?: number;
}

export interface ClassSession {
	id: string;
	class_id: string;
	session_date: string;
	qr_secret: string;
	attendance_expires_at: string | null;
}

export interface AttendanceRecord {
	student_id: string;
	first_name: string;
	last_name: string;
	email: string;
	status: 'present' | 'absent' | 'late' | 'excused';
	verified_at: string | null;
	ip_address: string | null;
	user_agent: string | null;
}

export interface Student {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	enrolled_at?: string;
}

export interface AttendanceCount {
	present: number;
	total: number;
}

// --- DB Row Types (snake_case as returned by postgres) ---

export interface UserRow {
	id: string;
	email: string;
	password_hash: string;
	first_name: string;
	last_name: string;
	role: 'faculty' | 'student';
	created_at: string;
}

export interface SessionRow {
	id: string;
	class_id: string;
	session_date: string;
	qr_secret: string;
	attendance_expires_at: string | null;
	created_at: string;
}

// --- Shared Validation Schemas ---

export const uuidSchema = v.pipe(v.string(), v.uuid('Invalid UUID identifier'));

export const loginSchema = v.object({
	email: v.pipe(v.string(), v.email('Invalid email address')),
	password: v.pipe(v.string(), v.minLength(1, 'Password is required'))
});

export const registerSchema = v.object({
	email: v.pipe(v.string(), v.email('Invalid email address')),
	password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters')),
	firstName: v.pipe(v.string(), v.minLength(1, 'First name is required')),
	lastName: v.pipe(v.string(), v.minLength(1, 'Last name is required')),
	role: v.picklist(['faculty', 'student'])
});

export const createClassSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Class name is required')),
	code: v.pipe(v.string(), v.minLength(1, 'Class code is required')),
	description: v.optional(v.string(), '')
});

export const enrollInClassSchema = v.object({
	classCode: v.pipe(v.string(), v.minLength(1, 'Class code is required'))
});

export const createSessionSchema = v.object({
	classId: v.pipe(v.string(), v.uuid()),
	sessionDate: v.pipe(v.string(), v.minLength(1, 'Session date is required'))
});

export const startAttendanceSchema = v.object({
	sessionId: v.pipe(v.string(), v.uuid()),
	durationMinutes: v.pipe(v.number(), v.minValue(1, 'Duration must be at least 1 minute'))
});

export const verifyQrCheckInSchema = v.object({
	sessionId: v.pipe(v.string(), v.uuid()),
	token: v.pipe(v.string(), v.minLength(1, 'Token is required'))
});

export const updateAttendanceStatusSchema = v.object({
	sessionId: v.pipe(v.string(), v.uuid()),
	studentId: v.pipe(v.string(), v.uuid()),
	status: v.picklist(['present', 'absent', 'late', 'excused'])
});
