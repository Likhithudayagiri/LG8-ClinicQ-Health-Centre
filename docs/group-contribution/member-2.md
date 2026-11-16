# Group Member 2 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Bharath
- **Student ID:** 252U1R3074
- **Role:** Database Specialist
- **Assigned Focus Area:** Database (SQLite Configuration, Schema Design, Table Relationships, Foreign Keys, Integrity Constraints, and Database Initialization)

---

> **Collaborative Project Statement:**  
> The ClinicQ Health Centre backend was designed, implemented, and tested as a unified team effort by all six members of Group LG 8. Within this collaborative framework, Bharath was assigned primary responsibility for the database layer: configuring the SQLite storage engine, designing the relational schemas for all three core entities, enforcing foreign key relationships, establishing double-booking uniqueness constraints, adding lookup indexes, and providing database initialization and diagnostic utilities.

---

## 1. Assigned Responsibilities
As the Database Specialist for LG 8, Bharath's assigned responsibilities included:
1. **SQLite Database Configuration (`database.js`):**
   - Configuring persistent SQLite database connection with directory auto-creation (`database/`).
   - Supporting configurable database file paths via environment variables (`CLINICQ_DB_PATH` or `DB_PATH`) to protect development data during automated testing.
   - Enforcing connection-level pragmas: enabling SQLite foreign keys (`PRAGMA foreign_keys = ON;`) and configuring concurrency handling (`PRAGMA busy_timeout = 3000;`).
2. **Relational Schema Design & DDL Definition:**
   - **`doctors` table:** Auto-incrementing primary key (`doctor_id`), required `doctor_name`, and required `specialization`.
   - **`rooms` table:** Auto-incrementing primary key (`room_id`), required `room_name`, and mandatory table-level `CHECK(floor IN ('Ground', 'First', 'Second'))` constraint.
   - **`bookings` table:** Auto-incrementing primary key (`booking_id`), foreign key links to `doctors` and `rooms`, and ISO date/time slot attributes.
3. **Database-Level Constraint & Integrity Enforcement:**
   - **Referential Integrity (`ON DELETE RESTRICT`):** Configuring foreign keys so that rooms or doctors currently referenced in active bookings cannot be deleted from the database.
   - **Room Double-Booking Invariant:** Defining `CONSTRAINT unique_room_booking_slot UNIQUE (room_id, booking_date, booking_time)` to guarantee at the database engine level that two doctors cannot occupy the same room at the same time.
   - **Doctor Double-Booking Invariant:** Defining `CONSTRAINT unique_doctor_booking_slot UNIQUE (doctor_id, booking_date, booking_time)` to guarantee that a doctor cannot be scheduled in two places simultaneously.
4. **Performance Indexing:**
   - Creating secondary indexes on child foreign key columns (`idx_bookings_doctor_id`, `idx_bookings_room_id`) and appointment schedules (`idx_bookings_schedule`) for high-performance join queries and conflict lookups.
5. **Database Initialization & Health Diagnostics:**
   - Idempotent table initialization preventing duplicate DDL execution.
   - Standalone CLI execution (`npm run init-db`) with clean process termination.
   - Database health inspection utility (`checkDatabaseHealth()`) verifying PRAGMA status, orphan foreign key checks, and physical database integrity.

---

## 2. Key Code Sections & Contributions

### File: `database.js`

- **Database Connection & Connection-Level Pragmas:**
  ```javascript
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const fs = require('fs');

  // Ensure default database directory exists
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

  // Enable foreign keys and set busy timeout
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error('Failed to enable foreign keys:', err.message);
      else console.log('SQLite foreign key constraints enabled.');
    });

    db.run('PRAGMA busy_timeout = 3000;', (err) => {
      if (err) console.error('Failed to set busy timeout:', err.message);
    });
  });
  ```

- **Relational Schemas & Constraint DDL (`initializeDatabase`):**
  ```javascript
  function initializeDatabase() {
    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = new Promise((resolve, reject) => {
      db.serialize(() => {
        // Step 1: Ensure foreign key enforcement is active
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
          if (pragmaErr) return reject(pragmaErr);
        });

        // Step 2: Doctors Table
        db.run(`
          CREATE TABLE IF NOT EXISTS doctors (
            doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_name TEXT NOT NULL,
            specialization TEXT NOT NULL
          )
        `, (err) => {
          if (err) return reject(err);
        });

        // Step 3: Rooms Table with Floor CHECK Constraint
        db.run(`
          CREATE TABLE IF NOT EXISTS rooms (
            room_id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_name TEXT NOT NULL,
            floor TEXT NOT NULL CHECK(floor IN ('Ground', 'First', 'Second'))
          )
        `, (err) => {
          if (err) return reject(err);
        });

        // Step 4: Bookings Table with Foreign Key Constraints & Composite UNIQUE Constraints
        db.run(`
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
          )
        `, (err) => {
          if (err) return reject(err);
        });

        // Step 5: Performance Indexes for Foreign Keys and Lookups
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_doctor_id ON bookings(doctor_id);');
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);');
        db.run('CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON bookings(booking_date, booking_time);', (err) => {
          if (err) return reject(err);
          console.log('Database tables verified/created successfully.');
          resolve();
        });
      });
    });

    return initializationPromise;
  }
  ```

- **Health Diagnostics and Lifecycle Exports:**
  ```javascript
  function checkDatabaseHealth() {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.get('PRAGMA foreign_keys;', (err, fkRow) => {
          if (err) return reject(err);

          db.all('PRAGMA foreign_key_check;', (fkCheckErr, violations) => {
            if (fkCheckErr) return reject(fkCheckErr);

            db.get('PRAGMA integrity_check;', (intErr, intRow) => {
              if (intErr) return reject(intErr);

              resolve({
                foreignKeysEnabled: fkRow && (fkRow.foreign_keys === 1 || Object.values(fkRow)[0] === 1),
                foreignKeyViolations: violations ? violations.length : 0,
                integrity: intRow ? (intRow.integrity_check || Object.values(intRow)[0]) : 'unknown',
                databasePath: dbPath
              });
            });
          });
        });
      });
    });
  }

  function closeDatabase() {
    return new Promise((resolve, reject) => {
      if (!db || typeof db.close !== 'function') return resolve();
      db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  ```

---

## 3. Demonstration & Viva Guide
During the lab evaluation, Bharath should demonstrate and explain:
1. **Why `PRAGMA foreign_keys = ON;` is Compulsory in SQLite:**
   - For backwards compatibility with legacy SQLite 2 databases, SQLite 3 disables foreign key enforcement by default.
   - If `PRAGMA foreign_keys = ON;` is omitted, SQLite allows inserting bookings for non-existent doctor IDs or room IDs, completely breaking relational integrity.
2. **Dual-Layer Defense Against Double-Booking:**
   - Explain how application routes (`routes/bookings.js`) check for conflicts in JavaScript, but the database schema enforces:
     - `CONSTRAINT unique_room_booking_slot UNIQUE (room_id, booking_date, booking_time)`
     - `CONSTRAINT unique_doctor_booking_slot UNIQUE (doctor_id, booking_date, booking_time)`
   - Even if concurrent HTTP requests arrive simultaneously, SQLite's ACID transaction model guarantees that one request succeeds and the second fails with `SQLITE_CONSTRAINT: UNIQUE constraint failed`.
3. **`ON DELETE RESTRICT` Referential Integrity:**
   - Why use `RESTRICT` instead of `CASCADE`?
   - In a clinical records system, accidentally deleting a doctor profile must not silently wipe out all historical appointments and patient consultations. `RESTRICT` prevents deletion of any room or doctor that has existing bookings.
4. **Table-Level `CHECK` Constraints:**
   - The room table enforces `CHECK(floor IN ('Ground', 'First', 'Second'))`. If any invalid string (e.g. "Roof" or "Basement") is attempted in an `INSERT` or `UPDATE`, SQLite rejects it with `SQLITE_CONSTRAINT: CHECK constraint failed`.
5. **Why Indexes on Foreign Keys Matter:**
   - SQLite does not automatically build indexes on child foreign key columns. Creating `idx_bookings_doctor_id` and `idx_bookings_room_id` prevents full-table scans during deletion validation and join queries.

---

## 4. Test Verification Evidence

### Suite 1: Database Specialist Verification Suite (`npm run test:db`)
All 22 database-specific assertions passed with 0 failures against `clinicq-test.db`:
```
=====================================================
   ClinicQ Database Specialist Verification Suite    
=====================================================

[Database Path] Target: C:\projects\clinicQ-health-centre\database\clinicq-test.db
[Database Path] Expected: C:\projects\clinicQ-health-centre\database\clinicq-test.db
--- 1. Testing Database Initialization & Connection ---
Connected to SQLite database at: C:\projects\clinicQ-health-centre\database\clinicq-test.db
SQLite foreign key constraints enabled.
Database tables verified/created successfully.
  [PASS] Database connects to isolated test database path

--- 2. Testing SQLite PRAGMA Configuration ---
  [PASS] PRAGMA foreign_keys is enabled (value: 1)

--- 3. Testing Relational Schema & Table Definitions ---
  [PASS] Table "doctors" exists in database schema
  [PASS] Table "rooms" exists in database schema
  [PASS] Table "bookings" exists in database schema

--- 4. Testing Foreign Key Relationships (bookings) ---
  [PASS] Foreign key from bookings(doctor_id) to doctors(doctor_id) exists
  [PASS] Doctor foreign key specifies ON DELETE RESTRICT
  [PASS] Foreign key from bookings(room_id) to rooms(room_id) exists
  [PASS] Room foreign key specifies ON DELETE RESTRICT

--- 5. Testing Table-Level Constraints ---
  [PASS] Valid floor "Ground" inserted into rooms table successfully
  [PASS] Invalid floor "Roof" rejected by SQLite CHECK(floor IN ("Ground", "First", "Second")) constraint

--- 6. Testing Foreign Key Enforcement (Non-Existent Parents) ---
  [PASS] Valid doctor inserted into doctors table (doctor_id: 1)
  [PASS] Booking with non-existent doctor_id (999) rejected by SQLite FOREIGN KEY constraint
  [PASS] Booking with non-existent room_id (999) rejected by SQLite FOREIGN KEY constraint

--- 7. Testing Database Unique Slot Constraints ---
  [PASS] Initial booking created (Doctor 1, Room 1, 2026-11-20 at 10:00)
  [PASS] Database rejected room double-booking via unique_room_booking_slot constraint
  [PASS] Database rejected doctor schedule conflict via unique_doctor_booking_slot constraint

--- 8. Testing ON DELETE RESTRICT Referential Integrity ---
  [PASS] SQLite blocked deletion of Room 1 referenced by active booking (ON DELETE RESTRICT)
  [PASS] SQLite blocked deletion of Doctor 1 referenced by active booking (ON DELETE RESTRICT)

--- 9. Testing Database Health Diagnostic Utility ---
  [PASS] checkDatabaseHealth reports foreignKeysEnabled: true
  [PASS] checkDatabaseHealth reports 0 foreignKeyViolations
  [PASS] checkDatabaseHealth reports SQLite integrity: "ok"

=====================================================
Database Specialist Test Summary:
Passed: 22
Failed: 0
=====================================================

[Cleanup] SQLite test database connection closed cleanly.
```

### Suite 2: Standalone Database CLI Execution (`npm run init-db`)
```
> clinicq-health-centre@1.0.0 init-db
> node database.js

Connected to SQLite database at: C:\projects\clinicQ-health-centre\database\clinicq.db
SQLite foreign key constraints enabled.
Database tables verified/created successfully.
Database initialization completed successfully.
Database health diagnostics: {
  foreignKeysEnabled: true,
  foreignKeyViolations: 0,
  integrity: 'ok',
  databasePath: 'C:\\projects\\clinicQ-health-centre\\database\\clinicq.db'
}
```

### Suite 3: Full Application Automated Test Suite (`npm test`)
All 34 system-wide integration assertions continue to pass with 0 failures:
- Passed: **34**
- Failed: **0**

---

## 5. Student Contribution Declaration
- **Student Name:** Bharath
- **Student ID:** 252U1R3074
- **Group:** LG 8
- **Role:** Database Specialist (Member 2)
- **Assigned Module:** `database.js`, `test-database.js`, schema initialization, and foreign key enforcement
- **Verification Status:** Verified all 22 database unit tests and 34 system integration tests passing with 0 failures.
- **Pull Request Branch:** `member-2-database`

