# Diagrams

## Data Model (mid-point pitch)

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR first_name
        VARCHAR last_name
        role_type role
        TIMESTAMPTZ created_at
    }

    user_sessions {
        VARCHAR id PK
        UUID user_id FK
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
    }

    subscriptions {
        UUID id PK
        UUID user_id FK
        subscription_plan plan
        VARCHAR status
        TIMESTAMPTZ starts_at
        TIMESTAMPTZ ends_at
        TIMESTAMPTZ created_at
    }

    payments {
        UUID id PK
        UUID user_id FK
        DECIMAL amount
        VARCHAR currency
        revenue_source source
        TEXT description
        TIMESTAMPTZ created_at
    }

    classes {
        UUID id PK
        UUID faculty_id FK
        VARCHAR name
        VARCHAR code
        TEXT description
        TIMESTAMPTZ created_at
    }

    enrollments {
        UUID class_id PK, FK
        UUID student_id PK, FK
        TIMESTAMPTZ enrolled_at
    }

    class_sessions {
        UUID id PK
        UUID class_id FK
        TIMESTAMPTZ session_date
        VARCHAR qr_secret
        TIMESTAMPTZ attendance_expires_at
        TIMESTAMPTZ created_at
    }

    class_network_restrictions {
        UUID class_id PK, FK
        INTEGER allowed_asn PK
        TIMESTAMPTZ created_at
    }

    attendance_records {
        UUID session_id PK, FK
        UUID student_id PK, FK
        attendance_status status
        TIMESTAMPTZ verified_at
        VARCHAR ip_address
        INTEGER asn
        TEXT user_agent
    }

    users ||--o{ user_sessions : "authenticates"
    users ||--o| subscriptions : "owns"
    users ||--o{ payments : "pays"
    users ||--o{ classes : "teaches"
    users ||--o{ enrollments : "enrolls"
    users ||--o{ attendance_records : "attends"
    classes ||--o{ class_sessions : "schedules"
    classes ||--o{ class_network_restrictions : "restricts"
    class_sessions ||--o{ attendance_records : "logs"
    classes ||--o{ enrollments : "has"
```

## Data Model (final)

```mermaid
erDiagram
    %% Relationships
    users ||--o{ classes : "teaches"
    users ||--o{ enrollments : "enrolls"
    classes ||--o{ enrollments : "has"
    classes ||--o{ class_sessions : "schedules"
    class_sessions ||--o{ attendance_records : "logs"
    users ||--o{ attendance_records : "attends"
    classes ||--o{ class_network_restrictions : "restricts"
    users ||--o{ user_sessions : "authenticates"
    users ||--|| subscriptions : "owns"
    users ||--o{ payments : "pays"

    %% Entities
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR first_name
        VARCHAR last_name
        role_type role
        TIMESTAMPTZ created_at
    }

    classes {
        UUID id PK
        UUID faculty_id FK
        VARCHAR name
        VARCHAR code
        TEXT description
        TIMESTAMPTZ created_at
    }

    enrollments {
        UUID class_id PK, FK
        UUID student_id PK, FK
        TIMESTAMPTZ enrolled_at
    }

    class_sessions {
        UUID id PK
        UUID class_id FK
        TIMESTAMPTZ session_date
        VARCHAR qr_secret
        TIMESTAMPTZ attendance_expires_at
        TIMESTAMPTZ created_at
    }

    attendance_records {
        UUID session_id PK, FK
        UUID student_id PK, FK
        attendance_status status
        TIMESTAMPTZ verified_at
        VARCHAR ip_address
        INTEGER asn
        TEXT user_agent
    }

    class_network_restrictions {
        UUID class_id PK, FK
        INTEGER allowed_asn PK
        TIMESTAMPTZ created_at
    }

    user_sessions {
        VARCHAR id PK
        UUID user_id FK
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
    }

    subscriptions {
        UUID id PK
        UUID user_id FK, UK
        subscription_plan plan
        VARCHAR status
        TIMESTAMPTZ starts_at
        TIMESTAMPTZ ends_at
        TIMESTAMPTZ created_at
    }

    payments {
        UUID id PK
        UUID user_id FK
        DECIMAL amount
        VARCHAR currency
        revenue_source source
        TEXT description
        TIMESTAMPTZ created_at
    }
```

## Check-in Verification Flow (Activity Diagram)

This flowchart details the execution steps of the `verifyQrCheckIn` remote function when a student scans a QR code and attempts to record their attendance.

```mermaid
flowchart TD
    Start([Student initiates check-in]) --> GetRequest["Get sessionId, token, IP & User Agent"]
    GetRequest --> Authenticate{Is Student Authenticated?}

    Authenticate -- No --> AuthErr["Redirect to Login (Error 401)"]
    Authenticate -- Yes --> FetchSession["Fetch class session & restrictions from DB"]

    FetchSession --> SessionExists{Session exists?}
    SessionExists -- No --> Err404["Error 404: Session not found"]
    SessionExists -- Yes --> CheckExpiry{Is Session Expired?}

    CheckExpiry -- Yes --> Err403_Expired["Error 403: Attendance session closed"]
    CheckExpiry -- No --> CheckSecret{Has QR secret?}

    CheckSecret -- No --> Err403_Secret["Error 403: QR code not available"]
    CheckSecret -- Yes --> ComputeTokens["Compute expected TOTP tokens<br/>(Current & previous 15s window)"]

    ComputeTokens --> MatchToken{Token matches expected?}
    MatchToken -- No --> Err400_Token["Error 400: Invalid or expired QR code"]
    MatchToken -- Yes --> CheckRestrictions{Class has ASN restrictions?}

    CheckRestrictions -- No --> UpsertRecord["Upsert attendance_records (status = 'present')"]
    CheckRestrictions -- Yes --> ResolveASN["Resolve student ASN from IP address"]

    ResolveASN --> CheckASN{Is student ASN allowed?}
    CheckASN -- No --> Err403_ASN["Error 403: ASN not on class allowlist"]
    CheckASN -- Yes --> UpsertRecord

    UpsertRecord --> Success["Return check-in success details"]
```

## Secure QR Check-in Sequence (Sequence Diagram)

This sequence diagram displays the step-by-step communication between the Faculty, Student, Student's Browser, SvelteKit Server (Remote Functions/RPC), and the Database during a secure rotating QR code attendance session.

```mermaid
sequenceDiagram
    autonumber
    actor Faculty
    actor Student
    participant Browser as Student Browser
    participant Server as SvelteKit Server
    participant DB as Database (Postgres)

    Note over Faculty, DB: Live Attendance Setup
    Faculty->>Server: createSession(classId, sessionDate)
    Server->>DB: Insert class_sessions (generate qr_secret)
    Server->>DB: Initialize student attendance_records as 'absent'
    Server-->>Faculty: Return session details

    Faculty->>Server: startAttendance(sessionId, durationMinutes)
    Server->>DB: Set attendance_expires_at in class_sessions
    Server-->>Faculty: Session activated & streaming QR

    rect rgb(240, 248, 255)
        Note over Faculty, Server: Rotating Token Loop (Every 15s)
        Server->>Server: Generate TOTP token using qr_secret
        Server-->>Faculty: Render active QR Code on screen
    end

    Note over Student, DB: Student QR Check-in Execution
    Student->>Faculty: Scans rotating QR Code on projector
    Student->>Browser: Opens URL: /check-in/[sessionId]/[token]
    Browser->>Server: verifyQrCheckIn({ sessionId, token })

    Server->>DB: Query class_sessions & restrictions
    DB-->>Server: Return qr_secret, expiry, allowed_asns

    Server->>Server: Verify token matches current or previous window
    Server->>Server: Resolve ASN from Request IP Header
    Server->>Server: Validate ASN against allowed_asns

    alt Validation Successful
        Server->>DB: Upsert attendance_record (status='present', verified_at=NOW)
        Server-->>Browser: Success response (class name, date, time)
        Browser-->>Student: Display "Checked In Successfully" screen

        Note over Faculty, Server: Live Attendance Broadcast
        Server->>DB: Stream updated live attendance counts
        Server-->>Faculty: View updated roster in real-time (Present: N/Total)
    else Validation Failed (e.g. invalid token, expired, or ASN blocked)
        Server-->>Browser: Error response (400 / 403)
        Browser-->>Student: Display check-in error message
    end
```

## Session & Attendance Lifecycle (State Diagram)

This state diagram models the states and transitions of a Class Session and the corresponding student attendance record states.

```mermaid
stateDiagram-v2
    [*] --> Created : createSession()
    note right of Created
        - qr_secret is generated
        - Attendance records initialized to 'absent'
    end note

    Created --> Active : startAttendance(durationMinutes)
    note right of Active
        - Rotating QR code tokens active (every 15s)
        - Student check-ins allowed (verifyQrCheckIn)
    end note

    state Active {
        [*] --> Absent
        Absent --> Present : verifyQrCheckIn() (valid token & ASN)
        Absent --> Late : verifyQrCheckIn() (marked late / manually)
        Present --> Absent : manualStatusOverride()
        Present --> Excused : manualStatusOverride()
        Absent --> Excused : manualStatusOverride()
    }

    Active --> Closed : Expiry of durationMinutes / stopAttendance()
    note right of Closed
        - Self-service QR check-ins blocked
        - Rotating QR token loop halts
        - Faculty can view/modify records or export CSV
    end note

    state Closed {
        [*] --> Finalized
        Finalized --> Finalized : manualStatusOverride()
    }

    Closed --> [*]
```
