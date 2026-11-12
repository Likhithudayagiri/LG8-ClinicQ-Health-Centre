# Group Member 1 Contribution Document

## Student Information
- **Name:** [Student Name Placeholder - Member 1]
- **Student ID:** [Student ID Placeholder]
- **Role:** Server & Route Architect
- **Assigned Area:** Express Server Configuration, Middleware, Modular Route Organization, and Server Execution

---

## 1. Assigned Responsibilities
Member 1 took ownership of foundational server infrastructure, ensuring standard Express.js best practices, modular routing, and error handling:
1. Setting up the Express application (`server.js`).
2. Configuring core middleware:
   - Built-in JSON body parser (`express.json()`).
   - Global request logging middleware for debugging and audit trails.
   - Centralized 404 handler for unmatched routes.
   - Centralized 500 global error-handling middleware.
3. Establishing clean and decoupled route architecture by mounting:
   - `/rooms` router (`routes/rooms.js`).
   - `/doctors` router (`routes/doctors.js`).
   - `/bookings` router (`routes/bookings.js`).
4. Creating the root welcome endpoint (`GET /`) delivering API metadata, status, and route directory.
5. Managing server lifecycle, environment-driven ports (`process.env.PORT || 3000`), and integration with database initialization before listening.

---

## 2. Contributed Files and Code Sections

### File: `server.js`
- **Application Bootstrapping & Middleware Pipeline:**
  ```javascript
  const express = require('express');
  const { db, initializeDatabase } = require('./database');

  const doctorsRouter = require('./routes/doctors');
  const roomsRouter = require('./routes/rooms');
  const bookingsRouter = require('./routes/bookings');

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware for parsing incoming JSON bodies
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
  ```

- **Modular Route Mounting:**
  ```javascript
  app.use('/rooms', roomsRouter);
  app.use('/doctors', doctorsRouter);
  app.use('/bookings', bookingsRouter);
  ```

- **Centralized Error and Fallback Handlers:**
  ```javascript
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // Global 500 handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });
  ```

- **Graceful Lifecycle Start:**
  ```javascript
  if (require.main === module) {
    initializeDatabase()
      .then(() => {
        app.listen(PORT, () => {
          console.log(`ClinicQ Health Centre server running on http://localhost:${PORT}`);
        });
      })
      .catch((err) => {
        console.error('Failed to initialize database before startup:', err);
        process.exit(1);
      });
  }
  ```

---

## 3. Demonstration & Viva Guide
During the lab demonstration, Member 1 should explain:
1. **Why Express.js was chosen:** Lightweight, flexible, fast, and provides standard middleware chaining for REST services.
2. **Modular Architecture:** Why routes are separated into `routes/rooms.js`, `routes/doctors.js`, and `routes/bookings.js` rather than dumping everything in `server.js` (separation of concerns, maintainability).
3. **Middleware Execution Order:** Why `express.json()` and the logger must appear before routes, and why 404/500 handlers must be at the very bottom.
4. **Lifecycle Order:** Why `initializeDatabase()` is resolved *before* `app.listen()` to prevent accepting requests against uninitialized database tables.

---

## 4. Screenshot Placeholders

### Screenshot 1.1: Server Startup in Terminal
```
[ PLACEHOLDER: Screenshot of `npm start` displaying database connection and "ClinicQ Health Centre server is running on http://localhost:3000" ]
```

### Screenshot 1.2: Root API Response (`GET /`)
```
[ PLACEHOLDER: Screenshot of Postman or browser visiting `http://localhost:3000/` showing the welcome JSON response with endpoint documentation ]
```

### Screenshot 1.3: 404 Handler Verification
```
[ PLACEHOLDER: Screenshot of Postman requesting an unknown route like `GET /unknown-route` receiving HTTP 404 with structured JSON ]
```
