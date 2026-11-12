# Group Member 3 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Tejaswini
- **Student ID:** 252U1R3071
- **Role:** REST API Developer
- **Assigned Area / Responsibility:** REST Endpoints (Room CRUD Operations, Doctor Endpoints, Booking Endpoints, and SQL JOIN Implementation)

---

## 1. Assigned Responsibilities
Tejaswini took responsibility for implementing core REST API endpoints and SQL querying logic across the system:
1. Room CRUD implementation (`routes/rooms.js`):
   - `GET /rooms/` (fetch all rooms).
   - `GET /rooms/:roomId/` (fetch single room).
   - `POST /rooms/` (create room with 201 Created).
   - `PUT /rooms/:roomId/` (update existing room with 200 OK).
   - `DELETE /rooms/:roomId/` (delete room with referential checks).
2. Doctor management endpoints (`routes/doctors.js`):
   - `GET /doctors/` (fetch all doctors).
   - `GET /doctors/:doctorId/` (fetch doctor by ID).
   - `POST /doctors/` (register new doctor with 201 Created).
   - `PUT /doctors/:doctorId/` (update doctor details).
   - `DELETE /doctors/:doctorId/` (delete doctor with referential checks).
3. Booking lifecycle endpoints (`routes/bookings.js`):
   - `POST /bookings/` (create booking with foreign key verification and conflict rejection).
   - `GET /bookings/` (retrieve all bookings).
   - `GET /bookings/:bookingId/` (retrieve single booking).
   - `DELETE /bookings/:bookingId/` (cancel booking).
4. Implementing the mandatory multi-table SQL JOIN endpoint (`GET /bookings/details/`):
   - Joining `bookings`, `doctors`, and `rooms` to output a unified view with `doctor_name` and `room_name`.

---

## 2. Contributed Files and Code Sections

### File: `routes/bookings.js` (Mandatory SQL JOIN)
- **Multi-Table SQL JOIN Query:**
  ```javascript
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
  ```

### File: `routes/rooms.js` (Room CRUD)
- **Parameterized SQL Execution:**
  ```javascript
  // GET single room
  router.get('/:roomId', (req, res) => {
    const { roomId } = req.params;
    db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId], (err, row) => {
      if (err) return res.status(500).json({ error: 'Internal server error.' });
      if (!row) return res.status(404).json({ error: 'Room not found.' });
      return res.status(200).json(row);
    });
  });

  // DELETE room
  router.delete('/:roomId', (req, res) => {
    const { roomId } = req.params;
    db.run('DELETE FROM rooms WHERE room_id = ?', [roomId], function (err) {
      if (err) return res.status(500).json({ error: 'Internal server error.' });
      return res.status(200).json({ message: 'Room deleted successfully.' });
    });
  });
  ```

### File: `routes/doctors.js` (Doctor Registration)
- **Doctor Creation:**
  ```javascript
  router.post('/', (req, res) => {
    const { doctor_name, specialization } = req.body;
    db.run(
      'INSERT INTO doctors (doctor_name, specialization) VALUES (?, ?)',
      [doctor_name.trim(), specialization.trim()],
      function (err) {
        if (err) return res.status(500).json({ error: 'Internal server error.' });
        return res.status(201).json({
          message: 'Doctor registered successfully.',
          doctor: { doctor_id: this.lastID, doctor_name, specialization }
        });
      }
    );
  });
  ```

---

## 3. Demonstration & Viva Guide
During the lab demonstration, Tejaswini should explain:
1. **The SQL JOIN Mechanics:** Explain how an `INNER JOIN` matches `bookings.doctor_id` with `doctors.doctor_id` and `bookings.room_id` with `rooms.room_id` so that the client receives human-readable names (`doctor_name`, `room_name`) instead of raw integer IDs.
2. **Parameterized Queries vs String Concatenation:** Explain why `?` placeholders are used with parameter arrays (`[roomId]`) rather than string template literals to completely prevent SQL Injection vulnerabilities.
3. **HTTP Status Code Mapping:** Explain why:
   - `200` is used for successful retrieval, update, or deletion.
   - `201` is used for resource creation (POST).
   - `404` is returned when a specific entity ID does not exist.
   - `500` is returned on internal database driver failures.

---

## 4. Screenshot Placeholders

### Screenshot 3.1: Mandatory SQL JOIN Response (`GET /bookings/details/`)
```
[ PLACEHOLDER: Screenshot of Postman showing `GET /bookings/details/` returning array of objects containing booking_id, booking_date, booking_time, doctor_name, and room_name ]
```

### Screenshot 3.2: Room CRUD Execution (`POST /rooms/` and `GET /rooms/:roomId/`)
```
[ PLACEHOLDER: Screenshot of Postman creating a room with 201 Created and then fetching it with 200 OK ]
```

### Screenshot 3.3: Doctor Creation (`POST /doctors/`)
```
[ PLACEHOLDER: Screenshot of Postman adding a doctor returning 201 Created and the new doctor_id ]
```
