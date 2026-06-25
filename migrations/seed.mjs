import postgres from 'postgres';
import { scryptSync, randomBytes } from 'crypto';

const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	cyan: '\x1b[36m'
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error(
		`${colors.red}Error: DATABASE_URL environment variable is not defined.${colors.reset}`
	);
	console.error(
		`Make sure you run with node --env-file=.env or set the DATABASE_URL environment variable.`
	);
	process.exit(1);
}

function hashPassword(password) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

let sql;
try {
	sql = postgres(databaseUrl, { max: 1 });

	console.log(`${colors.yellow}Seeding database with test data...${colors.reset}`);

	// Clear existing records to ensure fresh state and avoid unique constraints / uuid conflicts
	await sql`TRUNCATE TABLE users, classes, enrollments, class_sessions, attendance_records, user_sessions CASCADE;`;
	console.log(`${colors.green}Cleaned up existing database tables.${colors.reset}`);

	// --- 1. USERS ---
	const commonPasswordHash = hashPassword('Password123');

	// Faculty Newton
	const [faculty] = await sql`
		INSERT INTO users (email, password_hash, first_name, last_name, role)
		VALUES ('prof@university.edu', ${commonPasswordHash}, 'Professor', 'Newton', 'faculty')
		RETURNING id
	`;

	// Student Alice
	const [studentAlice] = await sql`
		INSERT INTO users (email, password_hash, first_name, last_name, role)
		VALUES ('student@university.edu', ${commonPasswordHash}, 'Alice', 'Smith', 'student')
		RETURNING id
	`;

	// Student Bob
	const [studentBob] = await sql`
		INSERT INTO users (email, password_hash, first_name, last_name, role)
		VALUES ('bob@university.edu', ${commonPasswordHash}, 'Bob', 'Johnson', 'student')
		RETURNING id
	`;

	console.log(`${colors.green}Created users:${colors.reset}`);
	console.log(`  - Faculty: prof@university.edu / Password123`);
	console.log(`  - Student Alice: student@university.edu / Password123`);
	console.log(`  - Student Bob: bob@university.edu / Password123`);

	// --- 2. CLASSES ---
	const [cs101] = await sql`
		INSERT INTO classes (faculty_id, name, code, description)
		VALUES (${faculty.id}, 'Introduction to Computer Science', 'CS-101', 'An entry-level overview of algorithms, data structures, and syntax.')
		RETURNING id
	`;

	const [cs336] = await sql`
		INSERT INTO classes (faculty_id, name, code, description)
		VALUES (${faculty.id}, 'Web Development & SaaS Architecture', 'CS-336', 'Fullstack web engineering practices using modern reactive frameworks.')
		RETURNING id
	`;

	console.log(`${colors.green}Created classes:${colors.reset} CS-101, CS-336`);

	// --- 3. ENROLLMENTS ---
	// Alice in both CS-101 and CS-336
	await sql`
		INSERT INTO enrollments (class_id, student_id)
		VALUES (${cs101.id}, ${studentAlice.id}), (${cs336.id}, ${studentAlice.id})
	`;

	// Bob in CS-101 only
	await sql`
		INSERT INTO enrollments (class_id, student_id)
		VALUES (${cs101.id}, ${studentBob.id})
	`;

	console.log(`${colors.green}Enrolled students in classes.${colors.reset}`);

	// --- 4. SESSIONS & ATTENDANCE ---
	const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
	const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
	const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

	// CS-101 Session 1
	const [session101s1] = await sql`
		INSERT INTO class_sessions (class_id, session_date, qr_secret)
		VALUES (${cs101.id}, ${oneWeekAgo}, ${randomBytes(16).toString('hex')})
		RETURNING id
	`;
	await sql`
		INSERT INTO attendance_records (session_id, student_id, status, verified_at, ip_address)
		VALUES 
			(${session101s1.id}, ${studentAlice.id}, 'present', ${oneWeekAgo}, '192.168.1.10'),
			(${session101s1.id}, ${studentBob.id}, 'absent', NULL, NULL)
	`;

	// CS-101 Session 2
	const [session101s2] = await sql`
		INSERT INTO class_sessions (class_id, session_date, qr_secret)
		VALUES (${cs101.id}, ${threeDaysAgo}, ${randomBytes(16).toString('hex')})
		RETURNING id
	`;
	await sql`
		INSERT INTO attendance_records (session_id, student_id, status, verified_at, ip_address)
		VALUES 
			(${session101s2.id}, ${studentAlice.id}, 'present', ${threeDaysAgo}, '192.168.1.10'),
			(${session101s2.id}, ${studentBob.id}, 'present', ${threeDaysAgo}, '192.168.1.11')
	`;

	// CS-101 Session 3
	const [session101s3] = await sql`
		INSERT INTO class_sessions (class_id, session_date, qr_secret)
		VALUES (${cs101.id}, ${oneDayAgo}, ${randomBytes(16).toString('hex')})
		RETURNING id
	`;
	await sql`
		INSERT INTO attendance_records (session_id, student_id, status, verified_at, ip_address)
		VALUES 
			(${session101s3.id}, ${studentAlice.id}, 'present', ${oneDayAgo}, '192.168.1.12'),
			(${session101s3.id}, ${studentBob.id}, 'absent', NULL, NULL)
	`;

	// CS-336 Session 1
	const [session336s1] = await sql`
		INSERT INTO class_sessions (class_id, session_date, qr_secret)
		VALUES (${cs336.id}, ${threeDaysAgo}, ${randomBytes(16).toString('hex')})
		RETURNING id
	`;
	await sql`
		INSERT INTO attendance_records (session_id, student_id, status, verified_at, ip_address)
		VALUES 
			(${session336s1.id}, ${studentAlice.id}, 'present', ${threeDaysAgo}, '192.168.1.20')
	`;

	console.log(`${colors.green}Created sessions and attendance logs successfully.${colors.reset}`);
	console.log(`${colors.cyan}Database seeding complete!${colors.reset}`);
} catch (error) {
	console.error(`${colors.red}Database seeding failed:${colors.reset}`);
	console.error(error);
	process.exit(1);
} finally {
	if (sql) {
		await sql.end();
	}
}
