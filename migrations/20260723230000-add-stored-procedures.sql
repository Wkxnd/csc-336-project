CREATE OR REPLACE PROCEDURE start_attendance_session(
    p_session_id UUID,
    p_duration_minutes INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
        RAISE EXCEPTION
            'Attendance duration must be greater than zero minutes';
    END IF;

    UPDATE class_sessions
    SET attendance_expires_at =
        CURRENT_TIMESTAMP + make_interval(mins => p_duration_minutes)
    WHERE id = p_session_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Class session % does not exist',
            p_session_id;
    END IF;
END;
$$;


CREATE OR REPLACE PROCEDURE enroll_student(
    p_class_code VARCHAR,
    p_student_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_class_id UUID;
BEGIN
    SELECT id
    INTO v_class_id
    FROM classes
    WHERE code = p_class_code;

    IF v_class_id IS NULL THEN
        RAISE EXCEPTION 'Class not found';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM enrollments
        WHERE class_id = v_class_id
          AND student_id = p_student_id
    ) THEN
        RAISE EXCEPTION
            'Already enrolled in this class';
    END IF;

    INSERT INTO enrollments (
        class_id,
        student_id
    )
    VALUES (
        v_class_id,
        p_student_id
    );

    INSERT INTO attendance_records (
        session_id,
        student_id,
        status
    )
    SELECT
        id,
        p_student_id,
        'absent'
    FROM class_sessions
    WHERE class_id = v_class_id
    ON CONFLICT DO NOTHING;
END;
$$;