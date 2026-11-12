const express = require('express');
const router = express.Router();
const { db } = require('../database');

/**
 * GET /doctors/
 * Retrieve all doctors
 */
router.get('/', (req, res) => {
  const query = 'SELECT * FROM doctors ORDER BY doctor_id ASC';
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while retrieving doctors.' });
    }
    return res.status(200).json(rows);
  });
});

/**
 * GET /doctors/:doctorId/
 * Retrieve a particular doctor by ID
 */
router.get('/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  const query = 'SELECT * FROM doctors WHERE doctor_id = ?';
  db.get(query, [doctorId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while retrieving doctor.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }
    return res.status(200).json(row);
  });
});

/**
 * POST /doctors/
 * Add a new doctor
 */
router.post('/', (req, res) => {
  const { doctor_name, specialization } = req.body;

  if (!doctor_name || typeof doctor_name !== 'string' || doctor_name.trim() === '') {
    return res.status(400).json({ error: 'doctor_name is required and must be a non-empty string.' });
  }

  if (!specialization || typeof specialization !== 'string' || specialization.trim() === '') {
    return res.status(400).json({ error: 'specialization is required and must be a non-empty string.' });
  }

  const query = 'INSERT INTO doctors (doctor_name, specialization) VALUES (?, ?)';
  db.run(query, [doctor_name.trim(), specialization.trim()], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while creating doctor.' });
    }

    return res.status(201).json({
      message: 'Doctor registered successfully.',
      doctor: {
        doctor_id: this.lastID,
        doctor_name: doctor_name.trim(),
        specialization: specialization.trim()
      }
    });
  });
});

/**
 * PUT /doctors/:doctorId/
 * Update a doctor's information
 */
router.put('/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  const { doctor_name, specialization } = req.body;

  if (!doctor_name || typeof doctor_name !== 'string' || doctor_name.trim() === '') {
    return res.status(400).json({ error: 'doctor_name is required and must be a non-empty string.' });
  }

  if (!specialization || typeof specialization !== 'string' || specialization.trim() === '') {
    return res.status(400).json({ error: 'specialization is required and must be a non-empty string.' });
  }

  db.get('SELECT * FROM doctors WHERE doctor_id = ?', [doctorId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while checking doctor.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const query = 'UPDATE doctors SET doctor_name = ?, specialization = ? WHERE doctor_id = ?';
    db.run(query, [doctor_name.trim(), specialization.trim(), doctorId], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ error: 'Internal server error while updating doctor.' });
      }

      return res.status(200).json({
        message: 'Doctor updated successfully.',
        doctor: {
          doctor_id: Number(doctorId),
          doctor_name: doctor_name.trim(),
          specialization: specialization.trim()
        }
      });
    });
  });
});

/**
 * DELETE /doctors/:doctorId/
 * Delete a doctor, provided doctor is not referenced by an existing booking
 */
router.delete('/:doctorId', (req, res) => {
  const { doctorId } = req.params;

  db.get('SELECT * FROM doctors WHERE doctor_id = ?', [doctorId], (err, doctor) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error while checking doctor.' });
    }
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    db.get('SELECT COUNT(*) AS booking_count FROM bookings WHERE doctor_id = ?', [doctorId], (checkErr, result) => {
      if (checkErr) {
        return res.status(500).json({ error: 'Internal server error while checking doctor bookings.' });
      }

      if (result.booking_count > 0) {
        return res.status(400).json({
          error: 'Cannot delete doctor: Doctor is referenced by an existing booking.'
        });
      }

      db.run('DELETE FROM doctors WHERE doctor_id = ?', [doctorId], function (deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ error: 'Internal server error while deleting doctor.' });
        }

        return res.status(200).json({
          message: 'Doctor deleted successfully.'
        });
      });
    });
  });
});

module.exports = router;

