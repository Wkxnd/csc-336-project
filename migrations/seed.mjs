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
	await sql`TRUNCATE TABLE users, classes, enrollments, class_sessions, attendance_records, user_sessions, subscriptions, payments, class_network_restrictions CASCADE;`;
	console.log(`${colors.green}Cleaned up existing database tables.${colors.reset}`);

	// --- 1. USERS ---
	const commonPasswordHash = hashPassword('Password123');

	// Faculty Newton (premium — has multiple demo classes)
	const [faculty] = await sql`
		INSERT INTO users (email, password_hash, first_name, last_name, role)
		VALUES ('prof@university.edu', ${commonPasswordHash}, 'Professor', 'Newton', 'faculty')
		RETURNING id
	`;

	// Faculty Curie (free — one class limit)
	const [facultyFree] = await sql`
		INSERT INTO users (email, password_hash, first_name, last_name, role)
		VALUES ('free@university.edu', ${commonPasswordHash}, 'Marie', 'Curie', 'faculty')
		RETURNING id
	`;

	// Faculty Tesla (enterprise — ASN restrictions)
	const [facultyEnterprise] = await sql`
		INSERT INTO users (email, password_hash, first_name, last_name, role)
		VALUES ('enterprise@university.edu', ${commonPasswordHash}, 'Nikola', 'Tesla', 'faculty')
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
	console.log(`  - Faculty (premium): prof@university.edu / Password123`);
	console.log(`  - Faculty (free): free@university.edu / Password123`);
	console.log(`  - Faculty (enterprise): enterprise@university.edu / Password123`);
	console.log(`  - Student Alice: student@university.edu / Password123`);
	console.log(`  - Student Bob: bob@university.edu / Password123`);

	// --- 1b. SUBSCRIPTIONS ---
	await sql`
		INSERT INTO subscriptions (user_id, plan, status)
		VALUES
			(${faculty.id}, 'premium', 'active'),
			(${facultyFree.id}, 'free', 'active'),
			(${facultyEnterprise.id}, 'enterprise', 'active')
	`;
	console.log(`${colors.green}Created faculty subscriptions.${colors.reset}`);

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

	// --- 5. SAMPLE PAYMENTS (admin revenue dashboard) ---
	const monthsAgo = (n) => new Date(Date.now() - n * 30 * 24 * 60 * 60 * 1000).toISOString();

	await sql`
		INSERT INTO payments (user_id, amount, currency, source, description, created_at)
		VALUES
			(${faculty.id}, 29.99, 'USD', 'subscription', 'Premium plan subscription', ${monthsAgo(0)}),
			(${faculty.id}, 29.99, 'USD', 'subscription', 'Premium plan subscription', ${monthsAgo(1)}),
			(${faculty.id}, 29.99, 'USD', 'subscription', 'Premium plan subscription', ${monthsAgo(2)}),
			(${facultyEnterprise.id}, 99.00, 'USD', 'subscription', 'Enterprise plan subscription', ${monthsAgo(0)}),
			(${facultyEnterprise.id}, 99.00, 'USD', 'subscription', 'Enterprise plan subscription', ${monthsAgo(1)}),
			(${faculty.id}, 4.50, 'USD', 'service_fee', 'Per-session processing fee', ${monthsAgo(0)}),
			(${facultyEnterprise.id}, 12.00, 'USD', 'service_fee', 'Per-session processing fee', ${monthsAgo(1)}),
			(NULL, 85.00, 'USD', 'ads', 'Campus partner display ads', ${monthsAgo(0)}),
			(NULL, 60.00, 'USD', 'ads', 'Campus partner display ads', ${monthsAgo(2)}),
			(NULL, 150.00, 'USD', 'data_sale', 'Anonymized attendance trend pack', ${monthsAgo(1)})
	`;
	console.log(`${colors.green}Seeded sample payments for revenue dashboard.${colors.reset}`);

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
