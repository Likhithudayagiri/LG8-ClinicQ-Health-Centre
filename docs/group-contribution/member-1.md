# Group Member 1 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Likhith
- **Student ID:** 252U1R3098
- **Role:** Server & Route Architect
- **Assigned Focus Area:** Server and Routes (Express Server Configuration, Middleware, Modular Route Organization, and Server Execution)

---

> **Collaborative Project Statement:**  
> The ClinicQ Health Centre backend was designed, implemented, and tested as a unified team effort by all six members of Group LG 8. Within this collaborative framework, Likhith was assigned primary responsibility for the Express server architecture, middleware pipeline, route structure, and application lifecycle.

---

## 1. Assigned Responsibilities
As the Server and Routes specialist for LG 8, Likhith's assigned responsibilities included:
1. **Express Server Configuration (`server.js`):** Bootstrapping the Express application, security hardening by disabling `x-powered-by` to prevent framework fingerprinting, and supporting standard body parsing (`express.json()` and `express.urlencoded()`).
2. **Middleware Pipeline:**
   - Standard JSON request parsing and URL-encoded body parsing.
   - Dedicated JSON syntax error handling middleware to gracefully intercept malformed JSON bodies and return HTTP 400 Bad Request instead of internal server errors (HTTP 500).
   - Custom timestamped request logging middleware for auditing incoming HTTP traffic.
   - Centralized 404 handler for catching unmatched routes.
   - Centralized 500 error handler for uncaught server exceptions.
3. **Modular Route Decoupling:** Connecting and organizing distinct route modules:
   - `/rooms` mounted to `routes/rooms.js`
   - `/doctors` mounted to `routes/doctors.js`
   - `/bookings` mounted to `routes/bookings.js`
4. **Welcome / Discovery & Health Endpoints:**
   - `GET /`: Providing API health status, metadata, and an interactive routing directory.
   - `GET /health`: Lightweight uptime and system health check endpoint for monitoring tools and orchestrators.
5. **Proper Error Handling and Server Initialization:**
   - Ensuring asynchronous database initialization (`initializeDatabase()`) resolves successfully before accepting HTTP connections.
   - Robust port configuration with environment variable fallback (`process.env.PORT ? parseInt(process.env.PORT, 10) || 3000 : 3000`).
   - Programmatic server startup via exported `startServer(port)`.
   - Production-ready graceful shutdown handling (`SIGINT` and `SIGTERM`) that cleanly closes the HTTP server and releases SQLite database connections.

---

## 2. Key Code Sections & Contributions

### File: `server.js`
- **Application Configuration, Security & Middleware:**
  ```javascript
  const express = require('express');
  const path = require('path');
  const { db, initializeDatabase } = require('./database');

  // Import modular route handlers
  const doctorsRouter = require('./routes/doctors');
  const roomsRouter = require('./routes/rooms');
  const bookingsRouter = require('./routes/bookings');

  // Initialize Express application
  const app = express();

  // Server port configuration with fallback
  const DEFAULT_PORT = 3000;
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) || DEFAULT_PORT : DEFAULT_PORT;

  // 1. Security Configuration: Disable X-Powered-By header to prevent fingerprinting
  app.disable('x-powered-by');

  // 2. Request Parsing Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. JSON Syntax Error Handling Middleware (Catches malformed JSON payloads and returns 400 Bad Request)
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        error: 'Invalid JSON payload received in request body.',
        message: err.message
      });
    }
    next(err);
  });

  // 4. Request Logging Middleware (Tracks method, URL, and UTC timestamp)
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
  ```

- **Health Check and Discovery Endpoints:**
  ```javascript
  // 5. System Health Check Endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      project: 'ClinicQ Health Centre',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // 6. Root / API Directory Discovery Route
  app.get('/', (req, res) => {
    res.status(200).json({
      project: 'ClinicQ Health Centre',
      status: 'Running',
      description: 'ClinicQ Consultation Room & Doctor Scheduling Backend System',
      documentation: '/README.md',
      endpoints: {
        system: {
          health: 'GET /health',
          discovery: 'GET /'
        },
        rooms: {
          getAllRooms: 'GET /rooms/',
          searchByFloor: 'GET /rooms/?floor=Ground',
          getOneRoom: 'GET /rooms/:roomId/',
          createRoom: 'POST /rooms/',
          updateRoom: 'PUT /rooms/:roomId/',
          deleteRoom: 'DELETE /rooms/:roomId/'
        },
        doctors: {
          getAllDoctors: 'GET /doctors/',
          getOneDoctor: 'GET /doctors/:doctorId/',
          createDoctor: 'POST /doctors/',
          updateDoctor: 'PUT /doctors/:doctorId/',
          deleteDoctor: 'DELETE /doctors/:doctorId/'
        },
        bookings: {
          getAllBookings: 'GET /bookings/',
          getOneBooking: 'GET /bookings/:bookingId/',
          joinedBookingDetails: 'GET /bookings/details/',
          createBooking: 'POST /bookings/',
          cancelBooking: 'DELETE /bookings/:bookingId/'
        }
      }
    });
  });
  ```

- **Modular Route Registration & Catch-All Handlers:**
  ```javascript
  // 7. Register Modular Feature Routes
  app.use('/rooms', roomsRouter);
  app.use('/doctors', doctorsRouter);
  app.use('/bookings', bookingsRouter);

  // 8. 404 Route Not Found Catch-All Handler
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // 9. Centralized Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      error: statusCode === 500 ? 'Internal server error' : err.message,
      message: err.message
    });
  });
  ```

- **Lifecycle Synchronization, Programmatic Startup & Graceful Shutdown:**
  ```javascript
  // 10. Server Startup and Lifecycle Management
  let server;

  function setupGracefulShutdown(httpServer) {
    const shutdown = (signal) => {
      console.log(`\n[${new Date().toISOString()}] Received ${signal}. Initiating graceful shutdown...`);
      httpServer.close((err) => {
        if (err) {
          console.error('Error during HTTP server closure:', err);
          process.exit(1);
        }
        console.log('HTTP server closed successfully.');
        if (db && typeof db.close === 'function') {
          db.close((dbErr) => {
            if (dbErr) {
              console.error('Error closing SQLite database:', dbErr.message);
              process.exit(1);
            }
            console.log('SQLite database connection closed cleanly.');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  function startServer(port = PORT) {
    return initializeDatabase()
      .then(() => {
        return new Promise((resolve) => {
          server = app.listen(port, () => {
            console.log(`ClinicQ Health Centre server is running on http://localhost:${port}`);
            setupGracefulShutdown(server);
            resolve(server);
          });
        });
      })
      .catch((err) => {
        console.error('Failed to initialize database before server startup:', err);
        process.exit(1);
      });
  }

  if (require.main === module) {
    startServer();
  }

  module.exports = { app, server, startServer };
  ```

---

## 3. Demonstration & Viva Guide
During the lab evaluation, Likhith should demonstrate and explain:
1. **Middleware Ordering in Express:**
   - Express executes middleware strictly in the order they are defined via `app.use()`.
   - `express.json()` and `express.urlencoded()` must come first to transform raw incoming binary stream data into JavaScript objects on `req.body`.
   - The JSON syntax error handler must be registered immediately after body parsing to trap any malformed syntax before it reaches business logic or the global 500 error handler.
   - The request logger follows next so that every request is timestamped.
   - Feature routes (`/rooms`, `/doctors`, `/bookings`) are placed in the middle.
   - The 404 handler and 4-argument global error handler `(err, req, res, next)` must be declared last to catch unhandled routes and thrown exceptions respectively.
2. **Security Hardening (`x-powered-by`):**
   - By default, Express injects the HTTP header `X-Powered-By: Express`. Disabling this via `app.disable('x-powered-by')` conceals server framework details from malicious automated scanners.
3. **Database Pre-Conditioning:**
   - Why call `initializeDatabase()` before `app.listen()`? Because table creation and foreign key enablement in SQLite are asynchronous. If the server starts listening before the tables exist, incoming HTTP requests would fail with `no such table` errors.
4. **Graceful Shutdown:**
   - When stopping the server with `Ctrl+C` (`SIGINT`) or container termination (`SIGTERM`), unhandled process death can corrupt SQLite files or drop in-flight requests. Graceful shutdown closes the HTTP server first, finishes active requests, closes the SQLite database connection, and then exits cleanly.
5. **Benefits of Modular Routing (`express.Router`):**
   - Keeps each team member's domain isolated (`routes/rooms.js`, `routes/doctors.js`, `routes/bookings.js`), preventing git merge conflicts and enabling clean unit testing.

---

## 4. Test Verification Evidence

### Suite 1: Automated Full System Test Suite (`npm test`)
All 34 required assertions passed with 0 failures:
```
=====================================================
   ClinicQ Health Centre - Automated Test Runner     
=====================================================

[Test Config] Resolved dbPath:       C:\projects\clinicQ-health-centre\database\clinicq-test.db
[Test Config] Target TEST_DB_PATH:   C:\projects\clinicQ-health-centre\database\clinicq-test.db
[Test Config] Confirmed: Database path matches test database exactly.
[Test Config] Confirmed: Development database (clinicq.db) is protected and untouched.

Connected to SQLite database at: C:\projects\clinicQ-health-centre\database\clinicq-test.db
SQLite foreign key constraints enabled.
Database tables verified/created successfully.
[Test Server] Started on http://localhost:3001

--- Testing System Info & Root Endpoint ---
  [PASS] GET / returns 200 and project status

--- Testing Mandatory Twist Tests (Section 8) ---
  [PASS] TEST 1 Status Code is 201 Created (Received: 201)
  [PASS] TEST 1 created Consultation Room A on Ground floor with ID 1
  [PASS] TEST 2 Status Code is 400 Bad Request (Received: 400)
  [PASS] TEST 2 Error message matches expected format: "Invalid floor. Allowed values are: Ground, First, Second"
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
  [PASS] Room Conflict rejected with 400 Bad Request (Status: 400)
  [PASS] Room Conflict message: "Conflict: The selected room is already booked by another doctor for this date and time."
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

### Suite 2: Server & Routes Specialized Verification (`npm run test:server`)
All 16 server-specific assertions passed with 0 failures:
```
=====================================================
   ClinicQ Server & Routes Feature Test Suite        
=====================================================

--- 1. Testing System Health Check (GET /health) ---
  [PASS] GET /health returns HTTP 200 OK
  [PASS] GET /health payload reports status: "UP"
  [PASS] GET /health returns server uptime numeric value
  [PASS] GET /health returns correct project identifier

--- 2. Testing Security Hardening (X-Powered-By Header Disabled) ---
  [PASS] Response header "x-powered-by" is stripped/absent

--- 3. Testing Root Endpoint Discovery (GET /) ---
  [PASS] GET / returns HTTP 200 OK
  [PASS] GET / endpoints map documents GET /health
  [PASS] GET / endpoints map documents rooms routes
  [PASS] GET / endpoints map documents doctors routes
  [PASS] GET / endpoints map documents bookings routes

--- 4. Testing Malformed JSON Parsing Middleware ---
  [PASS] Malformed JSON returns HTTP 400 Bad Request (Received: 400)
  [PASS] Error message explains JSON parsing failure: "Invalid JSON payload received in request body."

--- 5. Testing Centralized 404 Catch-All Handler ---
  [PASS] Unmatched route returns HTTP 404 (Received: 404)
  [PASS] 404 error response matches expected format: "Route not found: GET /api/non-existent-route"

--- 6. Testing Server Lifecycle & Exports ---
  [PASS] startServer function is exported for programmatic execution
  [PASS] app Express application is exported

=====================================================
Server & Routes Test Summary:
Passed: 16
Failed: 0
=====================================================
```
