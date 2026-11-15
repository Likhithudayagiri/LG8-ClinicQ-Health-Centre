# ClinicQ Health Centre – LG 8
## Backend Development Fundamentals Group Assignment

A robust, production-grade Node.js and Express.js REST API backend system for managing doctors, consultation rooms, and patient appointments at the ClinicQ Health Centre.

---

## Table of Contents
1. [Project Introduction](#1-project-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Technologies Used](#3-technologies-used)
4. [Database Design & Schema](#4-database-design--schema)
5. [Project Structure](#5-project-structure)
6. [Installation Instructions](#6-installation-instructions)
7. [How to Run the Server](#7-how-to-run-the-server)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Sample Requests and Responses](#9-sample-requests-and-responses)
10. [Validation Rules & Special Twist](#10-validation-rules--special-twist)
11. [How to Import and Execute the Postman Collection](#11-how-to-import-and-execute-the-postman-collection)
12. [Automated Testing & Verification](#12-automated-testing--verification)
13. [Group Member Contributions](#13-group-member-contributions)

---

## 1. Project Introduction
ClinicQ Health Centre is a multi-specialty healthcare facility operating across multiple floors. The backend application manages consultation rooms, doctor profiles, and booking schedules. It provides clean RESTful APIs built with Node.js, Express.js, and SQLite, emphasizing data integrity, input validation, and defensive scheduling conflict prevention.

---

## 2. Problem Statement
At ClinicQ Health Centre, an operational incident occurred where a receptionist accidentally scheduled two doctors into the same consultation room at the same date and time. 

To prevent scheduling mishaps, this backend application enforces two critical business invariants:
1. **Room Conflict Invariant:** Prevent two doctors from booking the same consultation room at the same date and time.
2. **Doctor Schedule Invariant:** Prevent the same doctor from having two consultation bookings at the same date and time in different rooms.

These constraints are enforced through a **dual-layer defense**:
- **Application Level:** Route handlers query existing reservations and reject conflicting requests with descriptive HTTP 400 Bad Request error messages.
- **Database Level:** Composite `UNIQUE` constraints and SQLite foreign key constraints guarantee data integrity even under concurrent workloads.

---

## 3. Technologies Used
- **Runtime Environment:** Node.js (v18+)
- **Web Framework:** Express.js (v5.x)
- **Database:** SQLite3 (`sqlite3` npm driver)
- **Architecture:** CommonJS modular architecture (Controllers, Routes, Models/DB)
- **API Standard:** RESTful JSON APIs
- **API Testing & Verification:** Postman Collection (v2.1.0) & Node.js Automated Test Runner
- **Version Control:** Git & GitHub

---

## 4. Database Design & Schema

The relational database is stored in `database/clinicq.db` with foreign keys enabled (`PRAGMA foreign_keys = ON;`).

```
 +--------------------+       1:N       +-------------------------------+
 |      doctors       | <-------------- |           bookings            |
 +--------------------+                 +-------------------------------+
 | doctor_id (PK)     |                 | booking_id (PK)               |
 | doctor_name (TEXT) |                 | doctor_id (FK -> doctors)     |
 | specialization     |                 | room_id (FK -> rooms)         |
 +--------------------+                 | booking_date (TEXT)           |
                                        | booking_time (TEXT)           |
 +--------------------+       1:N       +-------------------------------+
 |       rooms        | <-------------- | UNIQUE(room_id, date, time)   |
 +--------------------+                 | UNIQUE(doctor_id, date, time) |
 | room_id (PK)       |                 +-------------------------------+
 | room_name (TEXT)   |
 | floor (TEXT)       |
 | CHECK(floor IN...) |
 +--------------------+
```

### Table 1: `doctors`
Stores doctor profiles and medical specialties.
```sql
CREATE TABLE IF NOT EXISTS doctors (
  doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_name TEXT NOT NULL,
  specialization TEXT NOT NULL
);
```

### Table 2: `rooms`
Stores consultation rooms and their floor level.
```sql
CREATE TABLE IF NOT EXISTS rooms (
  room_id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_name TEXT NOT NULL,
  floor TEXT NOT NULL CHECK(floor IN ('Ground', 'First', 'Second'))
);
```

### Table 3: `bookings`
Stores doctor consultation room reservations.
```sql
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

## 5. Project Structure

```
clinicQ-health-centre/
│
├── database.js                     # SQLite connection, FK enablement, table initialization
├── server.js                       # Express app configuration, middleware, route mounting
├── test-runner.js                  # Automated verification suite (34 passing assertions)
├── package.json                    # Dependencies and npm scripts
├── .gitignore                      # Git ignore rules for node_modules, logs, and temp files
├── README.md                       # Comprehensive technical documentation
│
├── database/
│   └── clinicq.db                  # Persistent SQLite database file
│
├── routes/
│   ├── doctors.js                  # Doctor CRUD and lookup endpoints
│   ├── rooms.js                    # Room CRUD, floor search, and twist validation
│   └── bookings.js                 # Booking creation, conflict checks, and SQL JOIN
│
├── postman/
│   └── ClinicQ-Collection.json     # Importable Postman v2.1.0 collection
│
└── docs/
    └── group-contribution/
        ├── member-1.md             # Server & routes documentation
        ├── member-2.md             # Database schema & foreign key documentation
        ├── member-3.md             # REST endpoints & SQL JOIN documentation
        ├── member-4.md             # Validation & query search documentation
        ├── member-5.md             # Special twist & mandatory test documentation
        └── member-6.md             # Postman & QA testing documentation
```

---

## 6. Installation Instructions

### Prerequisites
- Node.js (version 18.x or later installed)
- npm (version 9.x or later)

### Steps
1. **Clone or navigate to the repository:**
   ```bash
   cd clinicQ-health-centre
   ```

2. **Install project dependencies:**
   For a clean, reproducible installation matching `package-lock.json`:
   ```bash
   npm ci
   ```
   Or standard install:
   ```bash
   npm install
   ```

3. **Database Configuration:**
   By default, the database is located at `database/clinicq.db`.
   You can optionally configure a custom database path using the `CLINICQ_DB_PATH` or `DB_PATH` environment variable:
   ```bash
   # Windows PowerShell example:
   $env:DB_PATH="database/clinicq.db"
   ```

4. **Initialize the SQLite database:**
   ```bash
   npm run init-db
   ```
   *Note:* The database and tables are also automatically created when starting the server if they do not already exist.

---

## 7. How to Run the Server

### Start the Express Server
```bash
npm start
```
Console output:
```
Connected to SQLite database at: .../database/clinicq.db
SQLite foreign key constraints enabled.
Database tables verified/created successfully.
ClinicQ Health Centre server is running on http://localhost:3000
```

The server listens on `http://localhost:3000` (or the port specified by the `PORT` environment variable).

To verify the server is running, visit `http://localhost:3000/` in your browser or make a GET request using curl:
```bash
curl http://localhost:3000/
```

---

## 8. API Endpoints Reference

### Room Endpoints (`/rooms`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/rooms/` | Retrieve all consultation rooms | `200`, `500` |
| `GET` | `/rooms/?floor=Ground` | Search and filter rooms by floor | `200`, `400`, `500` |
| `GET` | `/rooms/:roomId/` | Retrieve a single room by ID | `200`, `404`, `500` |
| `POST` | `/rooms/` | Create a new room (Twist validated) | `201`, `400`, `500` |
| `PUT` | `/rooms/:roomId/` | Update an existing room (Twist validated) | `200`, `400`, `404`, `500` |
| `DELETE` | `/rooms/:roomId/` | Delete room (Blocked if referenced by booking) | `200`, `400`, `404`, `500` |

### Doctor Endpoints (`/doctors`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/doctors/` | Retrieve all registered doctors | `200`, `500` |
| `GET` | `/doctors/:doctorId/` | Retrieve a single doctor by ID | `200`, `404`, `500` |
| `POST` | `/doctors/` | Register a new doctor | `201`, `400`, `500` |
| `PUT` | `/doctors/:doctorId/` | Update doctor information | `200`, `400`, `404`, `500` |
| `DELETE` | `/doctors/:doctorId/` | Delete doctor (Blocked if referenced) | `200`, `400`, `404`, `500` |

### Booking Endpoints (`/bookings`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/bookings/` | Create booking (Conflict validated) | `201`, `400`, `404`, `500` |
| `GET` | `/bookings/` | Retrieve all bookings | `200`, `500` |
| `GET` | `/bookings/:bookingId/` | Retrieve single booking by ID | `200`, `404`, `500` |
| `GET` | `/bookings/details/` | **Mandatory SQL JOIN endpoint** | `200`, `500` |
| `DELETE` | `/bookings/:bookingId/` | Cancel / delete a booking | `200`, `404`, `500` |

---

## 9. Sample Requests and Responses

### 1. Mandatory Twist Test 1: Add Room on Ground Floor
- **Request:** `POST http://localhost:3000/rooms/`
```json
{
  "room_name": "Consultation Room A",
  "floor": "Ground"
}
```
- **Response (HTTP 201 Created):**
```json
{
  "message": "Room created successfully.",
  "room": {
    "room_id": 1,
    "room_name": "Consultation Room A",
    "floor": "Ground"
  }
}
```

### 2. Mandatory Twist Test 2: Add Room with Invalid Floor
- **Request:** `POST http://localhost:3000/rooms/`
```json
{
  "room_name": "Consultation Room B",
  "floor": "Other"
}
```
- **Response (HTTP 400 Bad Request):**
```json
{
  "error": "Invalid floor. Allowed values are: Ground, First, Second"
}
```

### 3. Mandatory Twist Test 3: Update Room 1 to First Floor
- **Request:** `PUT http://localhost:3000/rooms/1/`
```json
{
  "room_name": "Consultation Room A",
  "floor": "First"
}
```
- **Response (HTTP 200 OK):**
```json
{
  "message": "Room updated successfully.",
  "room": {
    "room_id": 1,
    "room_name": "Consultation Room A",
    "floor": "First"
  }
}
```

### 4. Search Rooms by Floor
- **Request:** `GET http://localhost:3000/rooms/?floor=Ground`
- **Response (HTTP 200 OK):**
```json
[
  {
    "room_id": 2,
    "room_name": "Consultation Room B",
    "floor": "Ground"
  }
]
```

### 5. Add Doctor
- **Request:** `POST http://localhost:3000/doctors/`
```json
{
  "doctor_name": "Dr. Sarah Jenkins",
  "specialization": "Cardiology"
}
```
- **Response (HTTP 201 Created):**
```json
{
  "message": "Doctor registered successfully.",
  "doctor": {
    "doctor_id": 1,
    "doctor_name": "Dr. Sarah Jenkins",
    "specialization": "Cardiology"
  }
}
```

### 6. Create Booking
- **Request:** `POST http://localhost:3000/bookings/`
```json
{
  "doctor_id": 1,
  "room_id": 1,
  "booking_date": "2026-11-20",
  "booking_time": "10:00"
}
```
- **Response (HTTP 201 Created):**
```json
{
  "message": "Booking created successfully.",
  "booking": {
    "booking_id": 1,
    "doctor_id": 1,
    "room_id": 1,
    "booking_date": "2026-11-20",
    "booking_time": "10:00",
    "doctor_name": "Dr. Sarah Jenkins",
    "room_name": "Consultation Room A"
  }
}
```

### 7. Booking Conflict: Two Doctors in Same Room at Same Time
- **Request:** `POST http://localhost:3000/bookings/`
```json
{
  "doctor_id": 2,
  "room_id": 1,
  "booking_date": "2026-11-20",
  "booking_time": "10:00"
}
```
- **Response (HTTP 400 Bad Request):**
```json
{
  "error": "Conflict: The selected room is already booked by another doctor for this date and time."
}
```

### 8. Booking Conflict: Same Doctor Scheduled in Two Rooms at Same Time
- **Request:** `POST http://localhost:3000/bookings/`
```json
{
  "doctor_id": 1,
  "room_id": 2,
  "booking_date": "2026-11-20",
  "booking_time": "10:00"
}
```
- **Response (HTTP 400 Bad Request):**
```json
{
  "error": "Conflict: The doctor already has a booking scheduled for this date and time."
}
```

### 9. Mandatory SQL JOIN Endpoint
- **Request:** `GET http://localhost:3000/bookings/details/`
- **Response (HTTP 200 OK):**
```json
[
  {
    "booking_id": 1,
    "booking_date": "2026-11-20",
    "booking_time": "10:00",
    "doctor_name": "Dr. Sarah Jenkins",
    "room_name": "Consultation Room A"
  }
]
```

### 10. Attempting to Delete a Referenced Room
- **Request:** `DELETE http://localhost:3000/rooms/1/`
- **Response (HTTP 400 Bad Request):**
```json
{
  "error": "Cannot delete room: It is referenced by an existing booking."
}
```

---

## 10. Validation Rules & Special Twist

### Allowed Floor Values
A room's `floor` attribute must strictly be one of:
- `Ground`
- `First`
- `Second`

If any other value is supplied in `POST /rooms/`, `PUT /rooms/:roomId/`, or `GET /rooms/?floor=...`:
- **HTTP Status:** `400 Bad Request`
- **Exact JSON Body:**
  ```json
  {
    "error": "Invalid floor. Allowed values are: Ground, First, Second"
  }
  ```

### Non-Empty Inputs
- `room_name` must be a non-empty string.
- `doctor_name` and `specialization` must be non-empty strings.
- `booking_date` and `booking_time` must be non-empty strings.

### Foreign Key References
- Booking creation requires valid, existing `doctor_id` and `room_id`. Non-existent IDs return `HTTP 404 Not Found`.

---

## 11. How to Import and Execute the Postman Collection

The repository includes a ready-to-import Postman v2.1.0 collection at:
`postman/ClinicQ-Collection.json`

### Import Instructions:
1. Launch **Postman**.
2. Click the **Import** button in the top left corner.
3. Choose **File** and select `postman/ClinicQ-Collection.json` from the project directory.
4. Confirm import. You will see **ClinicQ Health Centre API - LG 8** in your collections panel.

### Executing Requests:
1. Ensure the backend server is running (`npm start`).
2. The collection has a predefined variable `baseUrl` set to `http://localhost:3000`.
3. Open the folder **1. Mandatory Twist Tests**:
   - Send **TEST 1** (`POST /rooms/` with Ground floor) -> Expect `201 Created`.
   - Send **TEST 2** (`POST /rooms/` with floor "Other") -> Expect `400 Bad Request`.
   - Send **TEST 3** (`PUT /rooms/1/` with floor "First") -> Expect `200 OK`.
4. Run other folders or use the Postman **Collection Runner** to execute all requests automatically.

---

## 12. Automated Testing & Verification

An automated test suite is provided to verify all 34 requirements and status codes.
The test runner automatically targets an isolated test database (`database/clinicq-test.db`), ensuring that the development/production database (`database/clinicq.db`) is **never modified or cleared** during test execution.

```bash
npm test
```

### Test Suite Execution Output:
```
=====================================================
   ClinicQ Health Centre - Automated Test Runner     
=====================================================

[Test Config] Target Database: .../database/clinicq-test.db
[Test Config] Confirmed: Development database (clinicq.db) is protected and untouched.

--- Testing System Info & Root Endpoint ---
  [PASS] GET / returns 200 and project status

--- Testing Mandatory Twist Tests (Section 8) ---
Executing Mandatory TEST 1: POST /rooms/ (Ground floor)
  [PASS] TEST 1 Status Code is 201 Created (Received: 201)
  [PASS] TEST 1 created Consultation Room A on Ground floor with ID 1
Executing Mandatory TEST 2: POST /rooms/ (Invalid floor: Other)
  [PASS] TEST 2 Status Code is 400 Bad Request (Received: 400)
  [PASS] TEST 2 Error message matches expected format: "Invalid floor. Allowed values are: Ground, First, Second"
Executing Mandatory TEST 3: PUT /rooms/1/ (Update to First floor)
  [PASS] TEST 3 Status Code is 200 OK (Received: 200)
  [PASS] TEST 3 updated room 1 to First floor

--- Testing Room CRUD & Search Endpoints ---
  [PASS] POST /rooms/ created Consultation Room B with ID 2
  [PASS] POST /rooms/ created Consultation Room C on Second floor
  [PASS] GET /rooms/ retrieved all 3 rooms
  [PASS] GET /rooms/1/ retrieved Consultation Room A
  [PASS] GET /rooms/999/ returned 404 Not Found
  [PASS] GET /rooms/?floor=Ground returned only Ground floor rooms
  [PASS] GET /rooms/?floor=Roof returned 400 Bad Request
  [PASS] GET /rooms/?floor=Roof returned expected allowed floor error message

--- Testing Doctor Endpoints ---
  [PASS] POST /doctors/ registered Dr. Jane Smith with ID 1
  [PASS] POST /doctors/ registered Dr. John Watson with ID 2
  [PASS] POST /doctors/ with missing specialization returns 400 Bad Request
  [PASS] GET /doctors/ retrieved all 2 doctors
  [PASS] GET /doctors/1/ retrieved Dr. Jane Smith

--- Testing Booking Endpoints & Conflict Prevention ---
  [PASS] POST /bookings/ created first booking (ID: 1)
Testing Conflict 1: Prevent 2 doctors booking the same room at the same date and time
  [PASS] Room Conflict rejected with 400 Bad Request (Status: 400)
  [PASS] Room Conflict message: "Conflict: The selected room is already booked by another doctor for this date and time."
Testing Conflict 2: Prevent the same doctor having 2 bookings at the same date and time
  [PASS] Doctor Schedule Conflict rejected with 400 Bad Request (Status: 400)
  [PASS] Doctor Conflict message: "Conflict: The doctor already has a booking scheduled for this date and time."
  [PASS] POST /bookings/ created second valid booking for Doctor 2 in Room 2 at 11:00

--- Testing Mandatory SQL JOIN Booking Endpoint ---
  [PASS] GET /bookings/details/ returns 200 OK
  [PASS] JOIN endpoint returned 2 bookings (Received: 2)
  [PASS] JOIN record contains all mandatory fields (booking_id, booking_date, booking_time, doctor_name, room_name)

--- Testing Deletion Restrictions (Referenced Records) ---
  [PASS] Attempt to delete referenced Room 1 returned 400 (Status: 400)
  [PASS] Delete room prevented with message: "Cannot delete room: It is referenced by an existing booking."
  [PASS] Attempt to delete referenced Doctor 1 returned 400 (Status: 400)
  [PASS] Delete doctor prevented with message: "Cannot delete doctor: Doctor is referenced by an existing booking."
  [PASS] DELETE /rooms/3/ for unreferenced room succeeded with 200 OK

=====================================================
Test Execution Completed:
Passed: 34
Failed: 0
=====================================================
```

---

## 13. Group Member Contributions

### Group: LG 8

| Member # | Name | Student ID | Assigned Responsibility | Documentation File |
|:---:|:---|:---:|:---|:---|
| **Member 1** | **Likhith** | `252U1R3098` | **Server and Routes** (Express configuration, middleware, modular routes, server startup) | [`docs/group-contribution/member-1.md`](docs/group-contribution/member-1.md) |
| **Member 2** | **Bharath** | `252U1R3074` | **Database** (SQLite configuration, 3 relational tables, foreign key constraints) | [`docs/group-contribution/member-2.md`](docs/group-contribution/member-2.md) |
| **Member 3** | **Tejaswini** | `252U1R3071` | **REST Endpoints** (Room CRUD, Doctor endpoints, Booking endpoints, SQL JOIN) | [`docs/group-contribution/member-3.md`](docs/group-contribution/member-3.md) |
| **Member 4** | **Rudhra Sai** | `252U1R3069` | **Validation and Search** (Request validation, error handling, floor search `?floor=...`) | [`docs/group-contribution/member-4.md`](docs/group-contribution/member-4.md) |
| **Member 5** | **Dinesh** | `252U1R3082` | **Special Twist and Allowed Floor Values** (Allowed floor restriction `Ground`, `First`, `Second`, 3 mandatory tests) | [`docs/group-contribution/member-5.md`](docs/group-contribution/member-5.md) |
| **Member 6** | **Jaswanth** | `252U1R3094` | **Postman Collection and README** (Postman Collection authoring, test runner, technical documentation) | [`docs/group-contribution/member-6.md`](docs/group-contribution/member-6.md) |

---
*ClinicQ Health Centre – LG 8 Backend Development Fundamentals Project.*

