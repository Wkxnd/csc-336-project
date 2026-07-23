import * as v from 'valibot';

// --- DB Row Types ---

export interface UserRow {
	id: string;
	email: string;
	password_hash: string;
	first_name: string;
	last_name: string;
	role: 'faculty' | 'student';
	created_at: string;
}

export interface ClassRow {
	id: string;
	faculty_id: string;
	name: string;
	code: string;
	description: string | null;
	created_at: string;
}

export interface ClassSessionRow {
	id: string;
	class_id: string;
	session_date: string;
	qr_secret: string | null;
	attendance_expires_at: string | null;
	created_at: string;
}

export interface EnrollmentRow {
	class_id: string;
	student_id: string;
	enrolled_at: string;
}

export interface AttendanceRecordRow {
	session_id: string;
	student_id: string;
	status: 'present' | 'absent' | 'late' | 'excused';
	verified_at: string | null;
	ip_address: string | null;
	asn: number | null;
	user_agent: string | null;
}

export interface UserSessionRow {
	id: string;
	user_id: string;
	expires_at: string;
	created_at: string;
}

export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';
export type RevenueSource = 'subscription' | 'service_fee' | 'ads' | 'data_sale';

export interface SubscriptionRow {
	id: string;
	user_id: string;
	plan: SubscriptionPlan;
	status: string;
	starts_at: string;
	ends_at: string | null;
	created_at: string;
}

export interface PaymentRow {
	id: string;
	user_id: string | null;
	amount: string | number;
	currency: string;
	source: RevenueSource;
	description: string | null;
	created_at: string;
}

export interface ClassNetworkRestrictionRow {
	class_id: string;
	allowed_asn: number;
	created_at: string;
}

// --- Derived Types ---

export type User = Omit<UserRow, 'created_at' | 'password_hash'>;

export type Subscription = Omit<SubscriptionRow, 'created_at'>;

export type Payment = PaymentRow;

export type Class = ClassRow & { attendance_rate?: number };

export type ClassSession = ClassSessionRow;

export type Student = Pick<UserRow, 'id' | 'first_name' | 'last_name' | 'email'> & {
	enrolled_at?: string;
};

/** Joined roster view for faculty session attendance UI */
export interface AttendanceRecord {
	student_id: string;
	first_name: string;
	last_name: string;
	email: string;
	status: AttendanceRecordRow['status'];
	verified_at: string | null;
	ip_address: string | null;
	user_agent: string | null;
}

export interface AttendanceCount {
	present: number;
	total: number;
}

export interface AttendanceTrendPoint {
	session_date: string;
	present_count: number;
	total_count: number;
	attendance_rate: number;
}

export interface StudentAttendanceSummary {
	student_name: string;
	student_email: string;
	total_sessions: number;
	present_count: number;
	absent_count: number;
	late_count: number;
	excused_count: number;
	attendance_rate: number;
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

export const subscriptionPlanSchema = v.picklist(['free', 'premium', 'enterprise']);

export const upgradePlanSchema = v.object({
	plan: subscriptionPlanSchema
});

export const addNetworkRestrictionSchema = v.object({
	classId: v.pipe(v.string(), v.uuid()),
	allowedAsn: v.pipe(v.number(), v.integer(), v.minValue(1, 'ASN must be a positive integer'))
});

export const removeNetworkRestrictionSchema = v.object({
	classId: v.pipe(v.string(), v.uuid()),
	allowedAsn: v.pipe(v.number(), v.integer(), v.minValue(1))
});

export const revenueDateRangeSchema = v.object({
	startDate: v.nullable(v.pipe(v.string(), v.isoDate('Invalid start date'))),
	endDate: v.nullable(v.pipe(v.string(), v.isoDate('Invalid end date')))
});

export type RevenueDateRange = v.InferOutput<typeof revenueDateRangeSchema>;
