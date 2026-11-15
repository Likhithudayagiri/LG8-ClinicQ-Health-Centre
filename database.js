const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure default database directory exists
const defaultDbDir = path.join(__dirname, 'database');
if (!fs.existsSync(defaultDbDir)) {
  fs.mkdirSync(defaultDbDir, { recursive: true });
}

// Configurable database file path via environment variable (CLINICQ_DB_PATH or DB_PATH)
const dbPath = process.env.CLINICQ_DB_PATH || process.env.DB_PATH || path.join(defaultDbDir, 'clinicq.db');

// Ensure directory for resolved dbPath exists
const targetDir = path.dirname(dbPath);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Create and configure database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Configure connection-level pragmas: Enable Foreign Keys & set busy timeout
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
      console.error('Failed to enable foreign keys:', err.message);
    } else {
      console.log('SQLite foreign key constraints enabled.');
    }
  });

  db.run('PRAGMA busy_timeout = 3000;', (err) => {
    if (err) {
      console.error('Failed to set busy timeout:', err.message);
    }
  });
});

// Cache the initialization promise to guarantee idempotency and avoid duplicate concurrent DDL execution
let initializationPromise = null;

/**
 * Initialize database schema:
 * 1. Verifies/enables PRAGMA foreign_keys = ON
 * 2. Creates doctors table with autoincrement primary key
 * 3. Creates rooms table with floor CHECK constraint
 * 4. Creates bookings table with FOREIGN KEY ON DELETE RESTRICT and UNIQUE slot constraints
 * 5. Creates performance indexes on foreign key columns and schedule lookup dates
 */
function initializeDatabase() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {
    db.serialize(() => {
      // Step 1: Ensure foreign key enforcement is active
      db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
        if (pragmaErr) {
          console.error('Failed to enforce foreign keys in initialization:', pragmaErr.message);
          initializationPromise = null;
          return reject(pragmaErr);
        }
      });

      // Step 2: Doctors Table
      db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
          doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
          doctor_name TEXT NOT NULL,
          specialization TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating doctors table:', err.message);
          initializationPromise = null;
          return reject(err);
        }
      });

      // Step 3: Rooms Table with Floor CHECK Constraint
      db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          room_id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_name TEXT NOT NULL,
          floor TEXT NOT NULL CHECK(floor IN ('Ground', 'First', 'Second'))
        )
      `, (err) => {
        if (err) {
          console.error('Error creating rooms table:', err.message);
          initializationPromise = null;
          return reject(err);
        }
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
        if (err) {
          console.error('Error creating bookings table:', err.message);
          initializationPromise = null;
          return reject(err);
        }
      });

      // Step 5: Helpful Performance Indexes for Foreign Keys and Lookups
      db.run('CREATE INDEX IF NOT EXISTS idx_bookings_doctor_id ON bookings(doctor_id);', (err) => {
        if (err) console.error('Error creating doctor_id index:', err.message);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);', (err) => {
        if (err) console.error('Error creating room_id index:', err.message);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON bookings(booking_date, booking_time);', (err) => {
        if (err) {
          console.error('Error creating schedule index:', err.message);
          initializationPromise = null;
          return reject(err);
        }
        console.log('Database tables verified/created successfully.');
        resolve();
      });
    });
  });

  return initializationPromise;
}

/**
 * Perform a database health check:
 * - Checks PRAGMA foreign_keys status
 * - Checks for any orphan foreign key violations
 * - Checks database structural integrity
 */
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

/**
 * Cleanly close the database connection
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (!db || typeof db.close !== 'function') {
      return resolve();
    }
    db.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Auto-initialize when required or executed
initializeDatabase().catch((err) => {
  console.error('Database initialization error:', err);
});

// Clean CLI execution handling for "npm run init-db" or "node database.js"
if (require.main === module) {
  initializeDatabase()
    .then(() => checkDatabaseHealth())
    .then((health) => {
      console.log('Database initialization completed successfully.');
      console.log('Database health diagnostics:', health);
      return closeDatabase();
    })
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = {
  db,
  initializeDatabase,
  dbPath,
  checkDatabaseHealth,
  closeDatabase
};
