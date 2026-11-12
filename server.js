const express = require('express');
const path = require('path');
const { db, initializeDatabase } = require('./database');

// Import route modules
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

// Root / Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'ClinicQ Health Centre',
    status: 'Running',
    description: 'ClinicQ Consultation Room & Doctor Scheduling Backend System',
    documentation: '/README.md',
    endpoints: {
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

// Mount modular routes
app.use('/rooms', roomsRouter);
app.use('/doctors', doctorsRouter);
app.use('/bookings', bookingsRouter);

// 404 Route Not Found handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server if run directly
let server;
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

module.exports = { app, server };
