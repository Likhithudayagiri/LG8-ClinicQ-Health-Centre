const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Allowed floor constants
const ALLOWED_FLOORS = ['Ground', 'First', 'Second'];
const INVALID_FLOOR_ERROR = 'Invalid floor. Allowed values are: Ground, First, Second';

/**
 * GET /rooms/
 * Retrieve all rooms or filter by floor query (?floor=Ground)
 */
router.get('/', (req, res) => {
  const { floor } = req.query;

  if (floor !== undefined) {
    if (!ALLOWED_FLOORS.includes(floor)) {
      return res.status(400).json({ error: INVALID_FLOOR_ERROR });
    }

    const query = 'SELECT * FROM rooms WHERE floor = ? ORDER BY room_id ASC';
    db.all(query, [floor], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error while retrieving rooms.' });
      }
      return res.status(200).json(rows);
    });
  } else {
    const query = 'SELECT * FROM rooms ORDER BY room_id ASC';
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error while retrieving rooms.' });
      }
      return res.status(200).json(rows);
    });
  }
});

/**
 * GET /rooms/:roomId/
 * Retrieve a single room by ID
 */
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;

  const query = 'SELECT * FROM rooms WHERE room_id = ?';
  db.get(query, [roomId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while retrieving room.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    return res.status(200).json(row);
  });
});

/**
 * POST /rooms/
 * Create a new room
 * Mandatory validation for room_name and allowed floors
 */
router.post('/', (req, res) => {
  const { room_name, floor } = req.body;

  // Validate floor
  if (!floor || !ALLOWED_FLOORS.includes(floor)) {
    return res.status(400).json({ error: INVALID_FLOOR_ERROR });
  }

  // Validate room_name
  if (!room_name || typeof room_name !== 'string' || room_name.trim() === '') {
    return res.status(400).json({ error: 'Room name is required and must be a non-empty string.' });
  }

  const query = 'INSERT INTO rooms (room_name, floor) VALUES (?, ?)';
  db.run(query, [room_name.trim(), floor], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while creating room.' });
    }

    return res.status(201).json({
      message: 'Room created successfully.',
      room: {
        room_id: this.lastID,
        room_name: room_name.trim(),
        floor: floor
      }
    });
  });
});

/**
 * PUT /rooms/:roomId/
 * Update an existing room
 * Mandatory validation for room_name and allowed floors
 */
router.put('/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { room_name, floor } = req.body;

  // Validate floor
  if (!floor || !ALLOWED_FLOORS.includes(floor)) {
    return res.status(400).json({ error: INVALID_FLOOR_ERROR });
  }

  // Validate room_name
  if (!room_name || typeof room_name !== 'string' || room_name.trim() === '') {
    return res.status(400).json({ error: 'Room name is required and must be a non-empty string.' });
  }

  // Check if room exists
  db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while checking room.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const updateQuery = 'UPDATE rooms SET room_name = ?, floor = ? WHERE room_id = ?';
    db.run(updateQuery, [room_name.trim(), floor, roomId], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: 'Internal server error while updating room.' });
      }

      return res.status(200).json({
        message: 'Room updated successfully.',
        room: {
          room_id: Number(roomId),
          room_name: room_name.trim(),
          floor: floor
        }
      });
    });
  });
});

/**
 * DELETE /rooms/:roomId/
 * Delete a room, provided it is not referenced by an existing booking
 */
router.delete('/:roomId', (req, res) => {
  const { roomId } = req.params;

  // Check if room exists
  db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId], (err, room) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while checking room.' });
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Check if room is referenced in bookings
    db.get('SELECT COUNT(*) AS booking_count FROM bookings WHERE room_id = ?', [roomId], (checkErr, result) => {
      if (checkErr) {
        return res.status(500).json({ error: 'Internal server error while checking room bookings.' });
      }

      if (result.booking_count > 0) {
        return res.status(400).json({
          error: 'Cannot delete room: It is referenced by an existing booking.'
        });
      }

      db.run('DELETE FROM rooms WHERE room_id = ?', [roomId], function (deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ error: 'Internal server error while deleting room.' });
        }

        return res.status(200).json({
          message: 'Room deleted successfully.'
        });
      });
    });
  });
});

module.exports = router;
