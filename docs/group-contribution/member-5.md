# Group Member 5 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Dinesh
- **Student ID:** 252U1R3082
- **Role:** Quality Assurance & Special Twist Specialist
- **Assigned Area / Responsibility:** Special Twist and Allowed Floor Values (Allowed Floor Restriction Enforcement, POST / PUT Validation Logic, and Verification of All Three Mandatory Twist Tests)

---

## 1. Assigned Responsibilities
Dinesh took full ownership of the assignment's core "Special Twist" and strict compliance testing:
1. Identifying the business rules for allowed floor values:
   - Permitted floors: `Ground`, `First`, `Second`.
   - Prohibited floors: Any other string or value (e.g. `Other`, `Basement`, `Third`).
2. Implementing the exact error contract required by the specification:
   - HTTP Status: `400 Bad Request`.
   - Response Payload:
     ```json
     {
       "error": "Invalid floor. Allowed values are: Ground, First, Second"
     }
     ```
3. Integrating this validation symmetrically across:
   - `POST /rooms/` (Room creation).
   - `PUT /rooms/:roomId/` (Room update).
4. Verifying, testing, and confirming the three mandatory test cases:
   - **TEST 1:** `POST /rooms/` with `{"room_name": "Consultation Room A", "floor": "Ground"}` -> `201 Created`.
   - **TEST 2:** `POST /rooms/` with `{"room_name": "Consultation Room B", "floor": "Other"}` -> `400 Bad Request` with allowed floor list error.
   - **TEST 3:** `PUT /rooms/1/` with `{"room_name": "Consultation Room A", "floor": "First"}` -> `200 OK`.

---

## 2. Contributed Files and Code Sections

### File: `routes/rooms.js` (Special Twist Validation)
- **Allowed Values List & Reusable Error Message:**
  ```javascript
  const ALLOWED_FLOORS = ['Ground', 'First', 'Second'];
  const INVALID_FLOOR_ERROR = 'Invalid floor. Allowed values are: Ground, First, Second';
  ```

- **Validation in POST /rooms/:**
  ```javascript
  router.post('/', (req, res) => {
    const { room_name, floor } = req.body;

    // Twist Validation: Floor Must Be Ground, First, or Second
    if (!floor || !ALLOWED_FLOORS.includes(floor)) {
      return res.status(400).json({ error: INVALID_FLOOR_ERROR });
    }

    if (!room_name || typeof room_name !== 'string' || room_name.trim() === '') {
      return res.status(400).json({ error: 'Room name is required and must be a non-empty string.' });
    }

    // Insert room
    db.run(
      'INSERT INTO rooms (room_name, floor) VALUES (?, ?)',
      [room_name.trim(), floor],
      function (err) {
        if (err) return res.status(500).json({ error: 'Internal server error.' });
        return res.status(201).json({
          message: 'Room created successfully.',
          room: { room_id: this.lastID, room_name: room_name.trim(), floor }
        });
      }
    );
  });
  ```

- **Validation in PUT /rooms/:roomId/:**
  ```javascript
  router.put('/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { room_name, floor } = req.body;

    // Twist Validation: Floor Must Be Ground, First, or Second
    if (!floor || !ALLOWED_FLOORS.includes(floor)) {
      return res.status(400).json({ error: INVALID_FLOOR_ERROR });
    }

    if (!room_name || typeof room_name !== 'string' || room_name.trim() === '') {
      return res.status(400).json({ error: 'Room name is required and must be a non-empty string.' });
    }

    // Check existence and update
    db.get('SELECT * FROM rooms WHERE room_id = ?', [roomId], (err, row) => {
      if (!row) return res.status(404).json({ error: 'Room not found.' });

      db.run(
        'UPDATE rooms SET room_name = ?, floor = ? WHERE room_id = ?',
        [room_name.trim(), floor, roomId],
        function (updateErr) {
          if (updateErr) return res.status(500).json({ error: 'Internal server error.' });
          return res.status(200).json({
            message: 'Room updated successfully.',
            room: { room_id: Number(roomId), room_name: room_name.trim(), floor }
          });
        }
      );
    });
  });
  ```

---

## 3. Demonstration & Viva Guide
During the lab demonstration, Dinesh should walk through the three mandatory tests:
1. **Mandatory Test 1 Demonstration:**
   - Execute `POST /rooms/` with body `{"room_name": "Consultation Room A", "floor": "Ground"}`.
   - Point out the `201 Created` status code and the created room object containing `room_id: 1`.
2. **Mandatory Test 2 Demonstration:**
   - Execute `POST /rooms/` with body `{"room_name": "Consultation Room B", "floor": "Other"}`.
   - Point out the `400 Bad Request` status code and verify that the response body contains:
     `{"error": "Invalid floor. Allowed values are: Ground, First, Second"}`.
3. **Mandatory Test 3 Demonstration:**
   - Execute `PUT /rooms/1/` with body `{"room_name": "Consultation Room A", "floor": "First"}`.
   - Point out the `200 OK` status code and verify that `floor` has been updated from "Ground" to "First".
4. **Defense-in-Depth:**
   - Explain that even if an application bug bypassed this check, SQLite's table definition also enforces `CHECK(floor IN ('Ground', 'First', 'Second'))` as a dual-layer security constraint.

---

## 4. Screenshot Placeholders

### Screenshot 5.1: Mandatory Twist TEST 1 (HTTP 201 Created)
```
[ PLACEHOLDER: Screenshot of Postman executing POST /rooms/ with "Ground" floor receiving HTTP 201 Created ]
```

### Screenshot 5.2: Mandatory Twist TEST 2 (HTTP 400 Bad Request)
```
[ PLACEHOLDER: Screenshot of Postman executing POST /rooms/ with "Other" floor receiving HTTP 400 with "Invalid floor. Allowed values are: Ground, First, Second" ]
```

### Screenshot 5.3: Mandatory Twist TEST 3 (HTTP 200 OK)
```
[ PLACEHOLDER: Screenshot of Postman executing PUT /rooms/1/ with "First" floor receiving HTTP 200 OK and updated room details ]
```
