# Group Member 4 Contribution Document

## Student Information
- **Name:** [Student Name Placeholder - Member 4]
- **Student ID:** [Student ID Placeholder]
- **Role:** Validation & Search Specialist
- **Assigned Area:** Request Validation, Error Handling Architecture, Floor Validation, and Search by Query Parameters

---

## 1. Assigned Responsibilities
Member 4 focused on system reliability, defensive programming, and query filtering:
1. Designing and enforcing input validation across all endpoints:
   - Validating non-empty strings for names and descriptions.
   - Validating presence of required fields before executing database statements.
   - Validating numeric formats for ID parameters and foreign keys.
2. Implementing the Floor Search feature:
   - `GET /rooms/?floor=Ground`
   - Dynamically filtering rooms matching the specified floor value.
3. Implementing query-parameter validation:
   - Ensuring that if a query parameter `?floor=...` is provided, it is checked against allowed values.
   - Rejecting invalid search queries (e.g. `?floor=Basement` or `?floor=Roof`) with HTTP 400 Bad Request and the required error message.
4. Implementing conflict validation for bookings:
   - Preventing room double-booking conflicts before SQL insertion.
   - Preventing doctor double-booking conflicts before SQL insertion.
5. Referential integrity deletion guards:
   - Checking whether a room or doctor is referenced in `bookings` before attempting `DELETE`.
   - Returning user-friendly HTTP 400 error messages instead of cryptic database errors.

---

## 2. Contributed Files and Code Sections

### File: `routes/rooms.js` (Search by Floor & Query Validation)
- **Search and Query Parameter Logic:**
  ```javascript
  const ALLOWED_FLOORS = ['Ground', 'First', 'Second'];
  const INVALID_FLOOR_ERROR = 'Invalid floor. Allowed values are: Ground, First, Second';

  router.get('/', (req, res) => {
    const { floor } = req.query;

    if (floor !== undefined) {
      // Validate query value
      if (!ALLOWED_FLOORS.includes(floor)) {
        return res.status(400).json({ error: INVALID_FLOOR_ERROR });
      }

      // Filtered query
      const query = 'SELECT * FROM rooms WHERE floor = ? ORDER BY room_id ASC';
      db.all(query, [floor], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Internal server error.' });
        return res.status(200).json(rows);
      });
    } else {
      // Return all rooms
      db.all('SELECT * FROM rooms ORDER BY room_id ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Internal server error.' });
        return res.status(200).json(rows);
      });
    }
  });
  ```

### File: `routes/bookings.js` (Pre-Insert Conflict Checks)
- **Room and Doctor Conflict Validation:**
  ```javascript
  // Room Conflict Check: Prevent 2 doctors in same room at same date/time
  const roomConflictQuery = `
    SELECT * FROM bookings 
    WHERE room_id = ? AND booking_date = ? AND booking_time = ?
  `;
  db.get(roomConflictQuery, [roomIdNum, dateTrimmed, timeTrimmed], (rcErr, roomConflict) => {
    if (roomConflict) {
      return res.status(400).json({
        error: 'Conflict: The selected room is already booked by another doctor for this date and time.'
      });
    }

    // Doctor Conflict Check: Prevent same doctor in 2 places at same date/time
    const doctorConflictQuery = `
      SELECT * FROM bookings 
      WHERE doctor_id = ? AND booking_date = ? AND booking_time = ?
    `;
    db.get(doctorConflictQuery, [doctorIdNum, dateTrimmed, timeTrimmed], (dcErr, doctorConflict) => {
      if (doctorConflict) {
        return res.status(400).json({
          error: 'Conflict: The doctor already has a booking scheduled for this date and time.'
        });
      }
      // Validation passed; proceed with booking
    });
  });
  ```

---

## 3. Demonstration & Viva Guide
During the lab demonstration, Member 4 should explain:
1. **Search Query Processing:** How `req.query.floor` is extracted from the URL query string (`/rooms/?floor=Ground`), validated, and injected safely into the SQL query using `[floor]` parameter binding.
2. **Defensive Validation vs Database Failures:** Why application-level validation is essential. Catching invalid input in Express allows returning descriptive, friendly error messages to the client rather than letting the database throw opaque error codes.
3. **Double Booking Scenarios:** Explain the two distinct conflict scenarios:
   - Scenario A: Room already occupied at specified date/time.
   - Scenario B: Doctor already assigned to a different room at specified date/time.
4. **Validation Status Codes:** Why `400 Bad Request` is the standard RFC HTTP status code for client validation failures.

---

## 4. Screenshot Placeholders

### Screenshot 4.1: Valid Search by Floor (`GET /rooms/?floor=Ground`)
```
[ PLACEHOLDER: Screenshot of Postman searching `GET /rooms/?floor=Ground` returning only rooms where floor is "Ground" ]
```

### Screenshot 4.2: Invalid Search Query Validation (`GET /rooms/?floor=Basement`)
```
[ PLACEHOLDER: Screenshot of Postman requesting `GET /rooms/?floor=Basement` returning HTTP 400 Bad Request with error: "Invalid floor. Allowed values are: Ground, First, Second" ]
```

### Screenshot 4.3: Booking Conflict Error Response
```
[ PLACEHOLDER: Screenshot of Postman attempting a conflicting booking and receiving HTTP 400 with "Conflict: The selected room is already booked..." ]
```
