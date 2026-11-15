# Group Member 2 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Bharath
- **Student ID:** 252U1R3074
- **Role:** Database Engineer
- **Assigned Focus Area:** Database (SQLite Configuration, Creation of All Three Tables, Relationships, and Foreign Keys)

---

> **Collaborative Project Statement:**  
> The ClinicQ Health Centre backend was designed, implemented, and tested as a unified team effort by all six members of Group LG 8. Within this collaborative framework, Bharath was assigned primary responsibility for the SQLite storage engine, relational schema design, table relationships, and database constraint enforcement.

---

## 1. Assigned Responsibilities
As the Database specialist for LG 8, Bharath's assigned responsibilities included:
1. **SQLite Database Configuration (`database.js`):** Configuring persistent SQLite database access and supporting configurable file paths via environment variables (`CLINICQ_DB_PATH` / `DB_PATH`).
2. **Foreign Key Constraint Enforcement:** Enabling SQLite's foreign key checks via `PRAGMA foreign_keys = ON;` immediately upon opening the database connection.
3. **Relational Schema Design:** Building three normalized tables:
   - `doctors`: Doctor identifiers, names, and specialties.
   - `rooms`: Consultation room identifiers, names, and floor location constraints.
   - `bookings`: Reservations linking doctors, rooms, dates, and times.
4. **Relational Integrity Constraints:**
   - Enforcing `FOREIGN KEY (...) ON DELETE RESTRICT` to prevent orphan booking references.
   - Enforcing composite uniqueness constraints:
     - `UNIQUE(room_id, booking_date, booking_time)` preventing double-booked rooms.
     - `UNIQUE(doctor_id, booking_date, booking_time)` preventing double-booked doctors.
5. **Database Initialization:** Wrapping DDL statements in serialized execution to ensure reliable table creation.

---

## 2. Key Code Sections & Contributions

### File: `database.js`
- **Configurable Database Connection & Directory Setup:**
  ```javascript
  const defaultDbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(defaultDbDir)) {
    fs.mkdirSync(defaultDbDir, { recursive: true });
  }

  // Configurable database path via environment variables
  const dbPath = process.env.CLINICQ_DB_PATH || process.env.DB_PATH || path.join(defaultDbDir, 'clinicq.db');

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Connection error:', err.message);
    else console.log(`Connected to SQLite database at: ${dbPath}`);
  });

  // Enable foreign key constraints
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) console.error('Failed to enable foreign keys:', err.message);
    else console.log('SQLite foreign key constraints enabled.');
  });
  ```

- **Table Creation Schemas (DDL):**
  ```sql
  -- 1. Doctors Table
  CREATE TABLE IF NOT EXISTS doctors (
    doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_name TEXT NOT NULL,
    specialization TEXT NOT NULL
  );

  -- 2. Rooms Table
  CREATE TABLE IF NOT EXISTS rooms (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT NOT NULL,
    floor TEXT NOT NULL CHECK(floor IN ('Ground', 'First', 'Second'))
  );

  -- 3. Bookings Table
  CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE RESTRICT,
    CONSTRAINT unique_room_booking_slot UNIQUE (room_id, booking_date, booking_time),
    CONSTRAINT unique_doctor_booking_slot UNIQUE (doctor_id, booking_date, booking_time)
  );
  ```

---

## 3. Demonstration & Viva Guide
During the lab evaluation, Bharath should demonstrate and explain:
1. **Why `PRAGMA foreign_keys = ON;` is Compulsory:** SQLite does not enforce foreign keys by default for backward compatibility. Explain how executing this PRAGMA ensures that SQLite rejects foreign keys pointing to non-existent rows.
2. **Double-Booking Prevention at Database Level:** Explain how the two composite unique constraints (`unique_room_booking_slot` and `unique_doctor_booking_slot`) guarantee that even if concurrent requests bypass application logic, the database engine will throw an `SQLITE_CONSTRAINT` error.
3. **`ON DELETE RESTRICT` Behavior:** Explain why a room or doctor that is referenced in an active booking cannot be deleted, protecting referential integrity.
4. **Data Types in SQLite:** Explain SQLite's type affinity model, and why `TEXT` is used for storing ISO-8601 dates and times (`YYYY-MM-DD` and `HH:MM`).

---

## 4. Placeholders for Genuine Student Evidence

### Evidence 2.1: SQLite Table Schema Output
*Place genuine CLI or DB Browser output showing the schema of all three tables:*
```
[ PLACEHOLDER: Paste actual output of SQLite CLI `.schema` command or DB Browser for SQLite showing doctors, rooms, and bookings DDL ]
```

### Evidence 2.2: Foreign Key Constraint Verification
*Place genuine terminal output showing foreign key enablement:*
```
[ PLACEHOLDER: Paste log line showing "SQLite foreign key constraints enabled." during application startup ]
```

### Evidence 2.3: Referential Integrity Restriction Verification
*Place genuine Postman screenshot demonstrating deletion block:*
```
[ PLACEHOLDER: Insert screenshot of DELETE /rooms/1/ returning HTTP 400 with "Cannot delete room: It is referenced by an existing booking." ]
```
