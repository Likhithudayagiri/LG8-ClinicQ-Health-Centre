const express = require('express');
const router = express.Router();
const { db } = require('../database');

/**
 * GET /bookings/details
 * Mandatory JOIN endpoint
 * Retrieves booking information containing:
 * - Booking ID
 * - Booking date
 * - Booking time
 * - Doctor name
 * - Room name
 * (Must be defined before /:bookingId so "details" is not parsed as an ID)
 */
router.get('/details', (req, res) => {
  const joinQuery = `
    SELECT 
      b.booking_id,
      b.booking_date,
      b.booking_time,
      d.doctor_name,
      r.room_name
    FROM bookings b
    JOIN doctors d ON b.doctor_id = d.doctor_id
    JOIN rooms r ON b.room_id = r.room_id
    ORDER BY b.booking_id ASC
  `;

  db.all(joinQuery, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while retrieving joined booking details.' });
    }
    return res.status(200).json(rows);
  });
});

/**
 * GET /bookings/details/:bookingId
 * Mandatory JOIN endpoint for a specific booking
 */
router.get('/details/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const joinQuery = `
    SELECT 
      b.booking_id,
      b.booking_date,
      b.booking_time,
      d.doctor_name,
      r.room_name
    FROM bookings b
    JOIN doctors d ON b.doctor_id = d.doctor_id
    JOIN rooms r ON b.room_id = r.room_id
    WHERE b.booking_id = ?
  `;

  db.get(joinQuery, [bookingId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while retrieving booking details.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.status(200).json(row);
  });
});

/**
 * GET /bookings/
 * Retrieve all bookings
 */
router.get('/', (req, res) => {
  const query = `
    SELECT 
      b.booking_id,
      b.doctor_id,
      b.room_id,
      b.booking_date,
      b.booking_time,
      d.doctor_name,
      r.room_name
    FROM bookings b
    JOIN doctors d ON b.doctor_id = d.doctor_id
    JOIN rooms r ON b.room_id = r.room_id
    ORDER BY b.booking_id ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while retrieving bookings.' });
    }
    return res.status(200).json(rows);
  });
});

/**
 * GET /bookings/:bookingId
 * Retrieve a specific booking by ID
 */
router.get('/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const query = `
    SELECT 
      b.booking_id,
      b.doctor_id,
      b.room_id,
      b.booking_date,
      b.booking_time,
      d.doctor_name,
      r.room_name
    FROM bookings b
    JOIN doctors d ON b.doctor_id = d.doctor_id
    JOIN rooms r ON b.room_id = r.room_id
    WHERE b.booking_id = ?
  `;

  db.get(query, [bookingId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while retrieving booking.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.status(200).json(row);
  });
});

/**
 * POST /bookings/
 * Create a new booking
 * Performs validation:
 * 1. Required fields presence
 * 2. Doctor existence
 * 3. Room existence
 * 4. Room conflict: Prevents two doctors booking the same room at the same date and time
 * 5. Doctor conflict: Prevents the same doctor having two bookings at the same date and time
 */
router.post('/', (req, res) => {
  const { doctor_id, room_id, booking_date, booking_time } = req.body;

  // 1. Validate required fields
  if (doctor_id === undefined || room_id === undefined || !booking_date || !booking_time) {
    return res.status(400).json({
      error: 'doctor_id, room_id, booking_date, and booking_time are all required fields.'
    });
  }

  const doctorIdNum = Number(doctor_id);
  const roomIdNum = Number(room_id);

  if (isNaN(doctorIdNum) || isNaN(roomIdNum)) {
    return res.status(400).json({
      error: 'doctor_id and room_id must be valid numbers.'
    });
  }

  const dateTrimmed = String(booking_date).trim();
  const timeTrimmed = String(booking_time).trim();

  if (dateTrimmed === '' || timeTrimmed === '') {
    return res.status(400).json({
      error: 'booking_date and booking_time cannot be empty.'
    });
  }

  // 2. Validate doctor existence
  db.get('SELECT * FROM doctors WHERE doctor_id = ?', [doctorIdNum], (docErr, doctor) => {
    if (docErr) {
      return res.status(500).json({ error: 'Internal server error while verifying doctor.' });
    }
    if (!doctor) {
      return res.status(404).json({ error: `Doctor not found with ID: ${doctorIdNum}` });
    }

    // 3. Validate room existence
    db.get('SELECT * FROM rooms WHERE room_id = ?', [roomIdNum], (roomErr, room) => {
      if (roomErr) {
        return res.status(500).json({ error: 'Internal server error while verifying room.' });
      }
      if (!room) {
        return res.status(404).json({ error: `Room not found with ID: ${roomIdNum}` });
      }

      // 4. Validate Room conflict (prevent 2 doctors booking the same room at the same date & time)
      const roomConflictQuery = `
        SELECT * FROM bookings 
        WHERE room_id = ? AND booking_date = ? AND booking_time = ?
      `;
      db.get(roomConflictQuery, [roomIdNum, dateTrimmed, timeTrimmed], (rcErr, roomConflict) => {
        if (rcErr) {
          return res.status(500).json({ error: 'Internal server error while checking room conflict.' });
        }
        if (roomConflict) {
          return res.status(400).json({
            error: 'Conflict: The selected room is already booked by another doctor for this date and time.'
          });
        }

        // 5. Validate Doctor conflict (prevent same doctor booking 2 rooms at the same date & time)
        const doctorConflictQuery = `
          SELECT * FROM bookings 
          WHERE doctor_id = ? AND booking_date = ? AND booking_time = ?
        `;
        db.get(doctorConflictQuery, [doctorIdNum, dateTrimmed, timeTrimmed], (dcErr, doctorConflict) => {
          if (dcErr) {
            return res.status(500).json({ error: 'Internal server error while checking doctor conflict.' });
          }
          if (doctorConflict) {
            return res.status(400).json({
              error: 'Conflict: The doctor already has a booking scheduled for this date and time.'
            });
          }

          // 6. Insert new booking
          const insertQuery = `
            INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time)
            VALUES (?, ?, ?, ?)
          `;
          db.run(insertQuery, [doctorIdNum, roomIdNum, dateTrimmed, timeTrimmed], function (insertErr) {
            if (insertErr) {
              if (insertErr.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({
                  error: 'Conflict: Booking already exists for this slot (enforced by database constraint).'
                });
              }
              return res.status(500).json({ error: 'Internal server error while creating booking.' });
            }

            return res.status(201).json({
              message: 'Booking created successfully.',
              booking: {
                booking_id: this.lastID,
                doctor_id: doctorIdNum,
                room_id: roomIdNum,
                booking_date: dateTrimmed,
                booking_time: timeTrimmed,
                doctor_name: doctor.doctor_name,
                room_name: room.room_name
              }
            });
          });
        });
      });
    });
  });
});

/**
 * DELETE /bookings/:bookingId
 * Delete / cancel a booking
 */
router.delete('/:bookingId', (req, res) => {
  const { bookingId } = req.params;

  db.get('SELECT * FROM bookings WHERE booking_id = ?', [bookingId], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while checking booking.' });
    }
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    db.run('DELETE FROM bookings WHERE booking_id = ?', [bookingId], function (deleteErr) {
      if (deleteErr) {
        return res.status(500).json({ error: 'Internal server error while deleting booking.' });
      }
      return res.status(200).json({ message: 'Booking cancelled successfully.' });
    });
  });
});

module.exports = router;
