# Group Member 5 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Dinesh
- **Student ID:** 252U1R3082
- **Role:** Quality Assurance & Special Twist Specialist
- **Assigned Focus Area:** Special Twist and Allowed Floor Values (Allowed Floor Restriction Enforcement, POST / PUT Validation Logic, and Verification of All Three Mandatory Twist Tests)

---

> **Collaborative Project Statement:**  
> The ClinicQ Health Centre backend was designed, implemented, and tested as a unified team effort by all six members of Group LG 8. Within this collaborative framework, Dinesh was assigned primary responsibility for the assignment's "Special Twist", including floor enumeration validation on POST/PUT requests and rigorous verification of the three mandatory twist test cases.

---

## 1. Assigned Responsibilities
As the Special Twist and QA specialist for LG 8, Dinesh's assigned responsibilities included:
1. **Enforcing Allowed Floor Values:**
   - Allowed values: strictly `Ground`, `First`, `Second`.
   - Disallowed values: any other string (e.g., `Other`, `Basement`, `Third`).
2. **Standardizing the Twist Error Response Contract:**
   - HTTP Status: `400 Bad Request`.
   - Exact JSON structure:
     ```json
     {
       "error": "Invalid floor. Allowed values are: Ground, First, Second"
     }
     ```
3. **Symmetric Enforcement Across Endpoints:**
   - Enforcing the check during Room Creation (`POST /rooms/`).
   - Enforcing the check during Room Update (`PUT /rooms/:roomId/`).
4. **Executing and Verifying the Three Mandatory Twist Tests (Section 8):**
   - **TEST 1:** `POST /rooms/` with `{"room_name": "Consultation Room A", "floor": "Ground"}` -> `201 Created`.
   - **TEST 2:** `POST /rooms/` with `{"room_name": "Consultation Room B", "floor": "Other"}` -> `400 Bad Request` with allowed floor list error.
   - **TEST 3:** `PUT /rooms/1/` with `{"room_name": "Consultation Room A", "floor": "First"}` -> `200 OK`.
5. **Database-Level Backup Enforcement:** Verifying that the SQLite schema definition also incorporates `CHECK(floor IN ('Ground', 'First', 'Second'))` for defense-in-depth.

---

## 2. Key Code Sections & Contributions

### File: `routes/rooms.js` (Special Twist Validation)
- **Allowed Floor Constants & Error Message:**
  ```javascript
  const ALLOWED_FLOORS = ['Ground', 'First', 'Second'];
  const INVALID_FLOOR_ERROR = 'Invalid floor. Allowed values are: Ground, First, Second';
  ```

- **Validation in `POST /rooms/`:**
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

- **Validation in `PUT /rooms/:roomId/`:**
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
During the lab evaluation, Dinesh should demonstrate and explain:
1. **Walkthrough of Mandatory TEST 1:**
   - Execute `POST /rooms/` with `{"room_name": "Consultation Room A", "floor": "Ground"}`.
   - Point out the `HTTP 201 Created` status code and that the created room has `room_id: 1`.
2. **Walkthrough of Mandatory TEST 2:**
   - Execute `POST /rooms/` with `{"room_name": "Consultation Room B", "floor": "Other"}`.
   - Point out the `HTTP 400 Bad Request` status code and verify that the response body explicitly matches:
     `{"error": "Invalid floor. Allowed values are: Ground, First, Second"}`.
3. **Walkthrough of Mandatory TEST 3:**
   - Execute `PUT /rooms/1/` with `{"room_name": "Consultation Room A", "floor": "First"}`.
   - Point out the `HTTP 200 OK` status code and confirm the floor has been updated to "First".
4. **Dual-Layer Defense:** Explain how application-level checks and SQLite table-level `CHECK(floor IN (...))` work together so invalid data is completely rejected at all levels.

---

## 4. Placeholders for Genuine Student Evidence

### Evidence 5.1: Mandatory Twist TEST 1 (HTTP 201 Created)
*Place genuine Postman screenshot for TEST 1 execution:*
```
[ PLACEHOLDER: Insert screenshot of POST /rooms/ with body {"room_name": "Consultation Room A", "floor": "Ground"} returning HTTP 201 Created ]
```

### Evidence 5.2: Mandatory Twist TEST 2 (HTTP 400 Bad Request)
*Place genuine Postman screenshot for TEST 2 execution:*
```
[ PLACEHOLDER: Insert screenshot of POST /rooms/ with body {"room_name": "Consultation Room B", "floor": "Other"} returning HTTP 400 with "Invalid floor. Allowed values are: Ground, First, Second" ]
```

### Evidence 5.3: Mandatory Twist TEST 3 (HTTP 200 OK)
*Place genuine Postman screenshot for TEST 3 execution:*
```
[ PLACEHOLDER: Insert screenshot of PUT /rooms/1/ with body {"room_name": "Consultation Room A", "floor": "First"} returning HTTP 200 OK and updated room object ]
```
