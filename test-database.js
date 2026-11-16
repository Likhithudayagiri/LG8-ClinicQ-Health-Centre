/**
 * ClinicQ Health Centre - Database Specialist Verification Suite
 * Group: LG 8
 * Member 2: Bharath (Student ID: 252U1R3074)
 * Focus: Automated verification for foreign keys, schemas, table constraints, and unique slots
 */

const path = require('path');
const fs = require('fs');

// STEP 1: Set isolated test database path to clinicq-test.db
const TEST_DB_PATH = path.resolve(__dirname, 'database', 'clinicq-test.db');
process.env.CLINICQ_DB_PATH = TEST_DB_PATH;
process.env.DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = 'test';

const { db, initializeDatabase, dbPath, checkDatabaseHealth, closeDatabase } = require('./database');

async function runDatabaseTests() {
  console.log('=====================================================');
  console.log('   ClinicQ Database Specialist Verification Suite    ');
  console.log('=====================================================\n');

  console.log(`[Database Path] Target: ${path.resolve(dbPath)}`);
  console.log(`[Database Path] Expected: ${TEST_DB_PATH}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Initialization and Connection
    console.log('--- 1. Testing Database Initialization & Connection ---');
    await initializeDatabase();
    assert(path.resolve(dbPath) === TEST_DB_PATH, 'Database connects to isolated test database path');

    // 2. PRAGMA foreign_keys verification
    console.log('\n--- 2. Testing SQLite PRAGMA Configuration ---');
    const fkRow = await new Promise((res, rej) => {
      db.get('PRAGMA foreign_keys;', (err, row) => err ? rej(err) : res(row));
    });
    const fkVal = fkRow ? (fkRow.foreign_keys !== undefined ? fkRow.foreign_keys : Object.values(fkRow)[0]) : 0;
    assert(fkVal === 1, `PRAGMA foreign_keys is enabled (value: ${fkVal})`);

    // Clean test tables
    await new Promise((res, rej) => {
      db.serialize(() => {
        db.run('DELETE FROM bookings;', () => {});
        db.run('DELETE FROM rooms;', () => {});
        db.run('DELETE FROM doctors;', () => {});
        db.run('DELETE FROM sqlite_sequence WHERE name IN ("bookings", "rooms", "doctors");', (err) => {
          if (err) return rej(err);
          res();
        });
      });
    });

    // 3. Schema & Table Structure Verification
    console.log('\n--- 3. Testing Relational Schema & Table Definitions ---');
    const tables = await new Promise((res, rej) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;", (err, rows) => {
        if (err) return rej(err);
        res(rows.map(r => r.name));
      });
    });
    assert(tables.includes('doctors'), 'Table "doctors" exists in database schema');
    assert(tables.includes('rooms'), 'Table "rooms" exists in database schema');
    assert(tables.includes('bookings'), 'Table "bookings" exists in database schema');

    // 4. Foreign Key Constraints on bookings table
    console.log('\n--- 4. Testing Foreign Key Relationships (bookings) ---');
    const fkList = await new Promise((res, rej) => {
      db.all('PRAGMA foreign_key_list(bookings);', (err, rows) => err ? rej(err) : res(rows));
    });
    const doctorFk = fkList.find(fk => fk.table === 'doctors' && fk.from === 'doctor_id' && fk.to === 'doctor_id');
    const roomFk = fkList.find(fk => fk.table === 'rooms' && fk.from === 'room_id' && fk.to === 'room_id');
    assert(doctorFk !== undefined, 'Foreign key from bookings(doctor_id) to doctors(doctor_id) exists');
    assert(doctorFk && doctorFk.on_delete === 'RESTRICT', 'Doctor foreign key specifies ON DELETE RESTRICT');
    assert(roomFk !== undefined, 'Foreign key from bookings(room_id) to rooms(room_id) exists');
    assert(roomFk && roomFk.on_delete === 'RESTRICT', 'Room foreign key specifies ON DELETE RESTRICT');

    // 5. Test Floor CHECK Constraint
    console.log('\n--- 5. Testing Table-Level Constraints ---');
    // Valid floor insert
    await new Promise((res, rej) => {
      db.run('INSERT INTO rooms (room_name, floor) VALUES (?, ?);', ['Room 101', 'Ground'], function (err) {
        if (err) return rej(err);
        res();
      });
    });
    assert(true, 'Valid floor "Ground" inserted into rooms table successfully');

    // Invalid floor insert
    let checkFailed = false;
    try {
      await new Promise((res, rej) => {
        db.run('INSERT INTO rooms (room_name, floor) VALUES (?, ?);', ['Room 102', 'Roof'], function (err) {
          if (err) return rej(err);
          res();
        });
      });
    } catch (err) {
      checkFailed = err.message.includes('CHECK constraint failed');
    }
    assert(checkFailed, 'Invalid floor "Roof" rejected by SQLite CHECK(floor IN ("Ground", "First", "Second")) constraint');

    // 6. Test Foreign Key Enforcement on Non-Existent Parent Records
    console.log('\n--- 6. Testing Foreign Key Enforcement (Non-Existent Parents) ---');
    // Insert valid doctor
    await new Promise((res, rej) => {
      db.run('INSERT INTO doctors (doctor_name, specialization) VALUES (?, ?);', ['Dr. A. Sharma', 'Neurology'], function (err) {
        if (err) return rej(err);
        res();
      });
    });
    assert(true, 'Valid doctor inserted into doctors table (doctor_id: 1)');

    // Attempt booking with non-existent doctor (ID 999)
    let nonExistentDocRejected = false;
    try {
      await new Promise((res, rej) => {
        db.run('INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time) VALUES (?, ?, ?, ?);', [999, 1, '2026-11-20', '09:00'], function (err) {
          if (err) return rej(err);
          res();
        });
      });
    } catch (err) {
      nonExistentDocRejected = err.message.includes('FOREIGN KEY constraint failed');
    }
    assert(nonExistentDocRejected, 'Booking with non-existent doctor_id (999) rejected by SQLite FOREIGN KEY constraint');

    // Attempt booking with non-existent room (ID 999)
    let nonExistentRoomRejected = false;
    try {
      await new Promise((res, rej) => {
        db.run('INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time) VALUES (?, ?, ?, ?);', [1, 999, '2026-11-20', '09:00'], function (err) {
          if (err) return rej(err);
          res();
        });
      });
    } catch (err) {
      nonExistentRoomRejected = err.message.includes('FOREIGN KEY constraint failed');
    }
    assert(nonExistentRoomRejected, 'Booking with non-existent room_id (999) rejected by SQLite FOREIGN KEY constraint');

    // 7. Test Composite UNIQUE Constraints in SQLite
    console.log('\n--- 7. Testing Database Unique Slot Constraints ---');
    // Insert first valid booking (Doctor 1, Room 1, 2026-11-20 at 10:00)
    await new Promise((res, rej) => {
      db.run('INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time) VALUES (?, ?, ?, ?);', [1, 1, '2026-11-20', '10:00'], function (err) {
        if (err) return rej(err);
        res();
      });
    });
    assert(true, 'Initial booking created (Doctor 1, Room 1, 2026-11-20 at 10:00)');

    // Add Doctor 2
    await new Promise((res, rej) => {
      db.run('INSERT INTO doctors (doctor_name, specialization) VALUES (?, ?);', ['Dr. B. Patel', 'Pediatrics'], function (err) {
        if (err) return rej(err);
        res();
      });
    });

    // Test Room Conflict: Doctor 2 trying to book Room 1 at same date and time
    let roomSlotUniqueFailed = false;
    try {
      await new Promise((res, rej) => {
        db.run('INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time) VALUES (?, ?, ?, ?);', [2, 1, '2026-11-20', '10:00'], function (err) {
          if (err) return rej(err);
          res();
        });
      });
    } catch (err) {
      roomSlotUniqueFailed = err.message.includes('UNIQUE constraint failed');
    }
    assert(roomSlotUniqueFailed, 'Database rejected room double-booking via unique_room_booking_slot constraint');

    // Add Room 2
    await new Promise((res, rej) => {
      db.run('INSERT INTO rooms (room_name, floor) VALUES (?, ?);', ['Room 102', 'First'], function (err) {
        if (err) return rej(err);
        res();
      });
    });

    // Test Doctor Conflict: Doctor 1 trying to book Room 2 at same date and time
    let doctorSlotUniqueFailed = false;
    try {
      await new Promise((res, rej) => {
        db.run('INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time) VALUES (?, ?, ?, ?);', [1, 2, '2026-11-20', '10:00'], function (err) {
          if (err) return rej(err);
          res();
        });
      });
    } catch (err) {
      doctorSlotUniqueFailed = err.message.includes('UNIQUE constraint failed');
    }
    assert(doctorSlotUniqueFailed, 'Database rejected doctor schedule conflict via unique_doctor_booking_slot constraint');

    // 8. Test ON DELETE RESTRICT Enforcement
    console.log('\n--- 8. Testing ON DELETE RESTRICT Referential Integrity ---');
    let deleteRoomBlocked = false;
    try {
      await new Promise((res, rej) => {
        db.run('DELETE FROM rooms WHERE room_id = 1;', function (err) {
          if (err) return rej(err);
          res();
        });
      });
    } catch (err) {
      deleteRoomBlocked = err.message.includes('FOREIGN KEY constraint failed');
    }
    assert(deleteRoomBlocked, 'SQLite blocked deletion of Room 1 referenced by active booking (ON DELETE RESTRICT)');

    let deleteDocBlocked = false;
    try {
      await new Promise((res, rej) => {
        db.run('DELETE FROM doctors WHERE doctor_id = 1;', function (err) {
          if (err) return rej(err);
          res();
        });
      });
    } catch (err) {
      deleteDocBlocked = err.message.includes('FOREIGN KEY constraint failed');
    }
    assert(deleteDocBlocked, 'SQLite blocked deletion of Doctor 1 referenced by active booking (ON DELETE RESTRICT)');

    // 9. Database Health & Integrity Diagnostics
    console.log('\n--- 9. Testing Database Health Diagnostic Utility ---');
    const health = await checkDatabaseHealth();
    assert(health.foreignKeysEnabled === true, 'checkDatabaseHealth reports foreignKeysEnabled: true');
    assert(health.foreignKeyViolations === 0, 'checkDatabaseHealth reports 0 foreignKeyViolations');
    assert(health.integrity === 'ok', 'checkDatabaseHealth reports SQLite integrity: "ok"');

    console.log('\n=====================================================');
    console.log('Database Specialist Test Summary:');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('=====================================================');

    if (failed > 0) process.exitCode = 1;
  } catch (err) {
    console.error('Fatal error during database tests:', err);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
    console.log('\n[Cleanup] SQLite test database connection closed cleanly.');
  }
}

if (require.main === module) {
  runDatabaseTests();
}

module.exports = { runDatabaseTests };
