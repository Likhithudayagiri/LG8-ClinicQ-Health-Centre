# Group Member 2 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Bharath
- **Student ID:** 252U1R3074
- **Role:** Database Engineer
- **Assigned Area / Responsibility:** Database (SQLite Configuration, Creation of All Three Tables, Relationships, and Foreign Keys)

---

## 1. Assigned Responsibilities
Bharath was responsible for designing and implementing the persistent storage layer using SQLite:
1. Configuring the SQLite connection and file management (`database/clinicq.db` in `database.js`).
2. Enabling SQLite foreign key constraint enforcement via `PRAGMA foreign_keys = ON;`.
3. Designing and building the normalized relational schema consisting of three related tables:
   - `doctors`: Doctor profiles and medical specializations.
   - `rooms`: Consultation rooms and floor locations.
   - `bookings`: Consultation bookings referencing both doctors and rooms.
4. Implementing database-level uniqueness and referential integrity constraints:
   - `UNIQUE(room_id, booking_date, booking_time)` to prohibit room double-booking.
   - `UNIQUE(doctor_id, booking_date, booking_time)` to prohibit doctor schedule conflicts.
   - `FOREIGN KEY (...) ON DELETE RESTRICT` to prevent orphan booking references.

---

## 2. Contributed Files and Code Sections

### File: `database.js`
- **Database Connection & Directory Verification:**
  ```javascript
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const fs = require('fs');

  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'clinicq.db');

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Connection error:', err.message);
    else console.log(`Connected to SQLite at: ${dbPath}`);
  });
  ```

- **Enabling Foreign Key Support:**
  ```javascript
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) console.error('Failed to enable foreign keys:', err.message);
    else console.log('SQLite foreign key constraints enabled.');
  });
  ```

- **Table Schemas and DDL:**
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
During the lab demonstration, Bharath should explain:
1. **SQLite Default Foreign Key Behavior:** By default, SQLite has foreign key checks *disabled* for backward compatibility. Explain how `PRAGMA foreign_keys = ON;` is explicitly executed right after opening the database handle to enforce referential integrity.
2. **Double-Booking Prevention at Database Level:** Explain how the two composite unique constraints (`unique_room_booking_slot` and `unique_doctor_booking_slot`) ensure that even if concurrent requests were to pass application checks simultaneously, the relational database guarantees zero duplicate room or doctor bookings.
3. **`ON DELETE RESTRICT` Behavior:** Explain why deleting a room or doctor that is currently referenced by an active booking is rejected by SQLite, preventing dangling foreign key references.
4. **Data Types in SQLite:** Explain the use of `TEXT` for ISO-8601 date and time formatting (e.g. `YYYY-MM-DD` and `HH:MM`).

---

## 4. Screenshot Placeholders

### Screenshot 2.1: SQLite Database Tables in Terminal / DB Browser
```
[ PLACEHOLDER: Screenshot of SQLite CLI or DB Browser for SQLite showing the tables: doctors, rooms, and bookings ]
```

### Screenshot 2.2: SQLite Table Schema Definition
```
[ PLACEHOLDER: Screenshot of `.schema` command output displaying primary keys, foreign keys, and UNIQUE constraints ]
```

### Screenshot 2.3: Foreign Key Enforcement Log
```
[ PLACEHOLDER: Screenshot of console log showing "SQLite foreign key constraints enabled." during server boot ]
```
