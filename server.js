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
