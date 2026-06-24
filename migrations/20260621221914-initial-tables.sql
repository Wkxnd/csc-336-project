-- Migration: initial-tables
-- Created at: 2026-06-21T22:19:14.887Z

-- Enums
CREATE TYPE role_type AS ENUM ('faculty', 'student');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE subscription_plan AS ENUM ('free', 'premium_faculty');
CREATE TYPE revenue_source AS ENUM ('subscription', 'service_fee', 'ads', 'data_sale');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role role_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enrollments table (Composite primary key 2NF)
CREATE TABLE enrollments (
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (class_id, student_id)
);

-- Class Sessions table
CREATE TABLE class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_date TIMESTAMPTZ NOT NULL,
    qr_secret VARCHAR(255),
    attendance_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Attendance Records table (Composite primary key 2NF)
CREATE TABLE attendance_records (
    session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'absent',
    verified_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    asn INTEGER,
    user_agent TEXT,
    PRIMARY KEY (session_id, student_id)
);

-- Class Network Restrictions table (Composite primary key 2NF)
CREATE TABLE class_network_restrictions (
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    allowed_asn INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (class_id, allowed_asn)
);

-- User Sessions table (For managing active user login sessions in DB without Redis)
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Subscriptions table (Membership-based SAAS model)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Payments / Revenue tracking table (Developer revenue)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    source revenue_source NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance optimization
CREATE INDEX idx_classes_faculty_id ON classes(faculty_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_class_sessions_class_id ON class_sessions(class_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);

-- Views for analytics & read-only reporting
CREATE VIEW class_attendance_summary AS
SELECT 
    c.id AS class_id,
    c.name AS class_name,
    c.code AS class_code,
    u.id AS student_id,
    u.first_name || ' ' || u.last_name AS student_name,
    u.email AS student_email,
    COUNT(cs.id) AS total_sessions,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) AS late_count,
    COUNT(CASE WHEN ar.status = 'excused' THEN 1 END) AS excused_count,
    CASE 
        WHEN COUNT(cs.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::NUMERIC / COUNT(cs.id)::NUMERIC) * 100, 2)
        ELSE 0.00
    END AS attendance_rate
FROM enrollments e
JOIN classes c ON e.class_id = c.id
JOIN users u ON e.student_id = u.id
LEFT JOIN class_sessions cs ON cs.class_id = c.id
LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = u.id
GROUP BY c.id, c.name, c.code, u.id, u.first_name, u.last_name, u.email;

CREATE VIEW developer_revenue_summary AS
SELECT 
    source AS revenue_source,
    COUNT(id) AS transaction_count,
    SUM(amount) AS total_revenue,
    currency
FROM payments
GROUP BY source, currency;
