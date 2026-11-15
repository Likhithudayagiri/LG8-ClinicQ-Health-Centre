# Group Member 4 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Rudhra Sai
- **Student ID:** 252U1R3069
- **Role:** Validation & Search Specialist
- **Assigned Focus Area:** Validation and Search (Request Validation, Error Handling Architecture, Floor Validation, and Search by Query Parameters)

---

> **Collaborative Project Statement:**  
> The ClinicQ Health Centre backend was designed, implemented, and tested as a unified team effort by all six members of Group LG 8. Within this collaborative framework, Rudhra Sai was assigned primary responsibility for input validation logic, defensive scheduling checks, query filtering implementation, and structured error responses.

---

## 1. Assigned Responsibilities
As the Validation and Search specialist for LG 8, Rudhra Sai's assigned responsibilities included:
1. **Input Validation Logic:**
   - Validating non-empty strings for names, specialties, dates, and times.
   - Checking presence of required fields before invoking database drivers.
   - Validating numeric formats for ID parameters.
2. **Floor Search Feature (`GET /rooms/?floor=Ground`):**
   - Extracting `req.query.floor` from query strings.
   - Filtering rooms matching the requested floor value.
3. **Query Parameter Validation:**
   - Validating `floor` query values against allowed list (`Ground`, `First`, `Second`).
   - Rejecting invalid search queries (e.g., `?floor=Roof` or `?floor=Basement`) with HTTP 400 Bad Request and listing all allowed floor options.
4. **Application-Level Conflict Detection for Bookings:**
   - Checking if a room is already reserved at the given date and time, returning descriptive HTTP 400 error.
   - Checking if a doctor is already scheduled for another consultation at the given date and time, returning descriptive HTTP 400 error.
5. **Referential Deletion Protection:**
   - Checking if a room or doctor is referenced in existing bookings before executing deletion, preventing database foreign key constraint crashes with clean user-facing error messages.

---

## 2. Key Code Sections & Contributions

### File: `routes/rooms.js` (Search by Floor & Query Validation)
- **Search Logic & Validation:**
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
      // Validations passed; proceed to insert booking
    });
  });
  ```

---

## 3. Demonstration & Viva Guide
During the lab evaluation, Rudhra Sai should demonstrate and explain:
1. **Query Extraction & Validation:** How Express handles `req.query.floor` when a client requests `GET /rooms/?floor=Ground`, and how the validation guard immediately rejects illegal values like `?floor=Roof` with HTTP 400.
2. **Defensive Validation vs Raw Database Errors:** Why application-level validation must catch errors before SQL execution (delivers readable, friendly JSON error messages rather than unformatted database constraint exceptions).
3. **The Two Invariant Conflict Scenarios:** Explain clearly:
   - *Conflict Scenario 1:* Room collision (two doctors attempting to use the same room at the same date and time).
   - *Conflict Scenario 2:* Doctor collision (a single doctor double-booked in two rooms at the same date and time).

---

## 4. Placeholders for Genuine Student Evidence

### Evidence 4.1: Valid Floor Search Output
*Place genuine Postman screenshot for `GET /rooms/?floor=Ground`:*
```
[ PLACEHOLDER: Insert screenshot of GET http://localhost:3000/rooms/?floor=Ground returning only rooms where floor is "Ground" with HTTP 200 OK ]
```

### Evidence 4.2: Invalid Floor Search Rejection
*Place genuine Postman screenshot for `GET /rooms/?floor=Roof`:*
```
[ PLACEHOLDER: Insert screenshot of GET http://localhost:3000/rooms/?floor=Roof returning HTTP 400 with "Invalid floor. Allowed values are: Ground, First, Second" ]
```

### Evidence 4.3: Booking Conflict Rejection
*Place genuine Postman screenshot for duplicate booking rejection:*
```
[ PLACEHOLDER: Insert screenshot of POST /bookings/ conflict response returning HTTP 400 with "Conflict: The selected room is already booked by another doctor..." ]
```
