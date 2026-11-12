const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'clinicq.db');

// Create and configure database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Enable SQLite Foreign Key constraints
db.run('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error('Failed to enable foreign keys:', err.message);
  } else {
    console.log('SQLite foreign key constraints enabled.');
  }
});

// Initialize database tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Doctors Table
      db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
          doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
          doctor_name TEXT NOT NULL,
          specialization TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating doctors table:', err.message);
          return reject(err);
        }
      });

      // 2. Rooms Table
      db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          room_id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_name TEXT NOT NULL,
          floor TEXT NOT NULL CHECK(floor IN ('Ground', 'First', 'Second'))
        )
      `, (err) => {
        if (err) {
          console.error('Error creating rooms table:', err.message);
          return reject(err);
        }
      });

      // 3. Bookings Table with constraints
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
          return reject(err);
        }
        console.log('Database tables verified/created successfully.');
        resolve();
      });
    });
  });
}

// Auto-initialize when required or run
initializeDatabase().catch((err) => {
  console.error('Database initialization error:', err);
});

module.exports = {
  db,
  initializeDatabase,
  dbPath
};

