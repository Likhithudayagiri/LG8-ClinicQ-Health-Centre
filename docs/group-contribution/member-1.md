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
1. **Server Setup & Configuration (`server.js`):** Bootstrapping the Express application with environment-driven port binding (`process.env.PORT || 3000`).
2. **Middleware Pipeline:**
   - Standard JSON request parsing via `express.json()`.
   - Custom timestamped request logging middleware for auditing incoming HTTP traffic.
   - Centralized 404 handler for catching unmatched routes.
   - Centralized 500 error handler for uncaught server exceptions.
3. **Modular Route Decoupling:** Connecting and organizing distinct route modules:
   - `/rooms` mounted to `routes/rooms.js`
   - `/doctors` mounted to `routes/doctors.js`
   - `/bookings` mounted to `routes/bookings.js`
4. **Welcome / Discovery Endpoint (`GET /`):** Providing API health status, metadata, and an interactive routing directory.
5. **Application Lifecycle Management:** Ensuring asynchronous database initialization (`initializeDatabase()`) resolves successfully before accepting HTTP connections.

---

## 2. Key Code Sections & Contributions

### File: `server.js`
- **Application Configuration & Middleware:**
  ```javascript
  const express = require('express');
  const path = require('path');
  const { db, initializeDatabase } = require('./database');

  const doctorsRouter = require('./routes/doctors');
  const roomsRouter = require('./routes/rooms');
  const bookingsRouter = require('./routes/bookings');

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware for parsing JSON request bodies
  app.use(express.json());

  // Request logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
  ```

- **Route Decoupling:**
  ```javascript
  // Mount modular routes
  app.use('/rooms', roomsRouter);
  app.use('/doctors', doctorsRouter);
  app.use('/bookings', bookingsRouter);
  ```

- **Lifecycle Synchronization:**
  ```javascript
  if (require.main === module) {
    initializeDatabase()
      .then(() => {
        server = app.listen(PORT, () => {
          console.log(`ClinicQ Health Centre server is running on http://localhost:${PORT}`);
        });
      })
      .catch((err) => {
        console.error('Failed to initialize database before server startup:', err);
        process.exit(1);
      });
  }
  ```

---

## 3. Demonstration & Viva Guide
During the lab evaluation, Likhith should demonstrate and explain:
1. **Middleware Ordering in Express:** Explain why `express.json()` and the custom logger must be registered before route handlers, and why 404 and error-handling middleware must be placed at the very end.
2. **Benefits of Modular Routing:** Explain the advantages of `express.Router()` over placing all routes in a single monolith file (separation of concerns, parallel group work, cleaner testing).
3. **Database Pre-Conditioning:** Explain why the database initialization promise must resolve before `app.listen()` is called (prevents race conditions where queries arrive before SQLite tables are created).
4. **Error Handling Architecture:** How unhandled errors pass to the global error middleware via `next(err)` to prevent process crashes.

---

## 4. Placeholders for Genuine Student Evidence

### Evidence 1.1: Server Execution Console Log
*Place genuine terminal output captured when executing `npm start` here:*
```
[ PLACEHOLDER: Paste actual terminal output showing:
  - Database connection confirmation
  - Foreign keys enabled confirmation
  - Table initialization confirmation
  - "ClinicQ Health Centre server is running on http://localhost:3000" ]
```

### Evidence 1.2: Root Discovery Route (`GET /`)
*Place genuine Postman or browser screenshot here:*
```
[ PLACEHOLDER: Insert screenshot of GET http://localhost:3000/ returning HTTP 200 with the full endpoint directory JSON ]
```

### Evidence 1.3: 404 Route Fallback
*Place genuine Postman screenshot for an unmapped route here:*
```
[ PLACEHOLDER: Insert screenshot of GET http://localhost:3000/non-existent-route returning HTTP 404 with structured error message ]
```
