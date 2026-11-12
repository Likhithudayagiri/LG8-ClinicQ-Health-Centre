const { app } = require('./server');
const { db, initializeDatabase } = require('./database');
const fs = require('fs');
const path = require('path');

const PORT = 3001; // Use port 3001 for test runner to avoid port collisions
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('=====================================================');
  console.log('   ClinicQ Health Centre - Automated Test Runner     ');
  console.log('=====================================================\n');

  // Initialize DB and clean up tables for fresh predictable test run
  await initializeDatabase();
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM bookings', () => {});
      db.run('DELETE FROM rooms', () => {});
      db.run('DELETE FROM doctors', () => {});
      db.run('DELETE FROM sqlite_sequence WHERE name IN ("bookings", "rooms", "doctors")', () => {
        resolve();
      });
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`[Test Server] Started on ${BASE_URL}\n`);
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      testsFailed++;
    }
  }

  try {
    // ----------------------------------------------------
    // Section A: Root Endpoint
    // ----------------------------------------------------
    console.log('--- Testing System Info & Root Endpoint ---');
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootData = await rootRes.json();
    assert(rootRes.status === 200 && rootData.project === 'ClinicQ Health Centre', 'GET / returns 200 and project status');

    // ----------------------------------------------------
    // Section B: MANDATORY TWIST TESTS
    // ----------------------------------------------------
    console.log('\n--- Testing Mandatory Twist Tests (Section 8) ---');

    // TEST 1: POST /rooms/ with valid Ground floor
    console.log('Executing Mandatory TEST 1: POST /rooms/ (Ground floor)');
    const twist1Res = await fetch(`${BASE_URL}/rooms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: 'Consultation Room A',
        floor: 'Ground'
      })
    });
    const twist1Data = await twist1Res.json();
    assert(twist1Res.status === 201, `TEST 1 Status Code is 201 Created (Received: ${twist1Res.status})`);
    assert(twist1Data.room && twist1Data.room.room_id === 1 && twist1Data.room.floor === 'Ground', 'TEST 1 created Consultation Room A on Ground floor with ID 1');

    // TEST 2: POST /rooms/ with invalid floor "Other"
    console.log('Executing Mandatory TEST 2: POST /rooms/ (Invalid floor: Other)');
    const twist2Res = await fetch(`${BASE_URL}/rooms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: 'Consultation Room B',
        floor: 'Other'
      })
    });
    const twist2Data = await twist2Res.json();
    assert(twist2Res.status === 400, `TEST 2 Status Code is 400 Bad Request (Received: ${twist2Res.status})`);
    assert(
      twist2Data.error === 'Invalid floor. Allowed values are: Ground, First, Second',
      `TEST 2 Error message matches expected format: "${twist2Data.error}"`
    );

    // TEST 3: PUT /rooms/1/ update floor to First
    console.log('Executing Mandatory TEST 3: PUT /rooms/1/ (Update to First floor)');
    const twist3Res = await fetch(`${BASE_URL}/rooms/1/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: 'Consultation Room A',
        floor: 'First'
      })
    });
    const twist3Data = await twist3Res.json();
    assert(twist3Res.status === 200, `TEST 3 Status Code is 200 OK (Received: ${twist3Res.status})`);
    assert(twist3Data.room && twist3Data.room.floor === 'First', 'TEST 3 updated room 1 to First floor');

    // ----------------------------------------------------
    // Section C: Room CRUD & Search
    // ----------------------------------------------------
    console.log('\n--- Testing Room CRUD & Search Endpoints ---');

    // Create Room B on Ground floor
    const roomBRes = await fetch(`${BASE_URL}/rooms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: 'Consultation Room B',
        floor: 'Ground'
      })
    });
    const roomBData = await roomBRes.json();
    assert(roomBRes.status === 201 && roomBData.room.room_id === 2, 'POST /rooms/ created Consultation Room B with ID 2');

    // Create Room C on Second floor
    const roomCRes = await fetch(`${BASE_URL}/rooms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: 'Consultation Room C',
        floor: 'Second'
      })
    });
    assert(roomCRes.status === 201, 'POST /rooms/ created Consultation Room C on Second floor');

    // GET all rooms
    const getAllRoomsRes = await fetch(`${BASE_URL}/rooms/`);
    const allRooms = await getAllRoomsRes.json();
    assert(getAllRoomsRes.status === 200 && allRooms.length === 3, 'GET /rooms/ retrieved all 3 rooms');

    // GET single room
    const getRoom1Res = await fetch(`${BASE_URL}/rooms/1/`);
    const room1 = await getRoom1Res.json();
    assert(getRoom1Res.status === 200 && room1.room_name === 'Consultation Room A', 'GET /rooms/1/ retrieved Consultation Room A');

    // GET non-existent room
    const getRoom404 = await fetch(`${BASE_URL}/rooms/999/`);
    assert(getRoom404.status === 404, 'GET /rooms/999/ returned 404 Not Found');

    // Search rooms by valid floor (?floor=Ground)
    const searchGroundRes = await fetch(`${BASE_URL}/rooms/?floor=Ground`);
    const searchGroundData = await searchGroundRes.json();
    assert(
      searchGroundRes.status === 200 && searchGroundData.length === 1 && searchGroundData[0].room_name === 'Consultation Room B',
      'GET /rooms/?floor=Ground returned only Ground floor rooms'
    );

    // Search rooms by invalid floor (?floor=Roof)
    const searchInvalidRes = await fetch(`${BASE_URL}/rooms/?floor=Roof`);
    const searchInvalidData = await searchInvalidRes.json();
    assert(searchInvalidRes.status === 400, 'GET /rooms/?floor=Roof returned 400 Bad Request');
    assert(
      searchInvalidData.error === 'Invalid floor. Allowed values are: Ground, First, Second',
      'GET /rooms/?floor=Roof returned expected allowed floor error message'
    );

    // ----------------------------------------------------
    // Section D: Doctor Endpoints
    // ----------------------------------------------------
    console.log('\n--- Testing Doctor Endpoints ---');

    // Add Doctor 1
    const doc1Res = await fetch(`${BASE_URL}/doctors/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_name: 'Dr. Jane Smith',
        specialization: 'Cardiology'
      })
    });
    const doc1Data = await doc1Res.json();
    assert(doc1Res.status === 201 && doc1Data.doctor.doctor_id === 1, 'POST /doctors/ registered Dr. Jane Smith with ID 1');

    // Add Doctor 2
    const doc2Res = await fetch(`${BASE_URL}/doctors/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_name: 'Dr. John Watson',
        specialization: 'General Medicine'
      })
    });
    const doc2Data = await doc2Res.json();
    assert(doc2Res.status === 201 && doc2Data.doctor.doctor_id === 2, 'POST /doctors/ registered Dr. John Watson with ID 2');

    // Validation for doctor creation (missing specialization)
    const docInvalidRes = await fetch(`${BASE_URL}/doctors/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_name: 'Dr. Incomplete' })
    });
    assert(docInvalidRes.status === 400, 'POST /doctors/ with missing specialization returns 400 Bad Request');

    // GET all doctors
    const allDocsRes = await fetch(`${BASE_URL}/doctors/`);
    const allDocs = await allDocsRes.json();
    assert(allDocsRes.status === 200 && allDocs.length === 2, 'GET /doctors/ retrieved all 2 doctors');

    // GET single doctor
    const singleDocRes = await fetch(`${BASE_URL}/doctors/1/`);
    const singleDoc = await singleDocRes.json();
    assert(singleDocRes.status === 200 && singleDoc.doctor_name === 'Dr. Jane Smith', 'GET /doctors/1/ retrieved Dr. Jane Smith');

    // ----------------------------------------------------
    // Section E: Booking Endpoints & Conflict Prevention
    // ----------------------------------------------------
    console.log('\n--- Testing Booking Endpoints & Conflict Prevention ---');

    // Create Initial Booking (Doctor 1, Room 1, 2026-11-20 at 10:00)
    const booking1Res = await fetch(`${BASE_URL}/bookings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_id: 1,
        room_id: 1,
        booking_date: '2026-11-20',
        booking_time: '10:00'
      })
    });
    const booking1Data = await booking1Res.json();
    assert(booking1Res.status === 201, `POST /bookings/ created first booking (ID: ${booking1Data.booking?.booking_id})`);

    // CONFLICT TEST 1: Another Doctor (Doctor 2) tries to book the SAME ROOM at the SAME DATE and TIME
    console.log('Testing Conflict 1: Prevent 2 doctors booking the same room at the same date and time');
    const roomConflictRes = await fetch(`${BASE_URL}/bookings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_id: 2, // Different doctor
        room_id: 1,   // Same room!
        booking_date: '2026-11-20', // Same date
        booking_time: '10:00'  // Same time
      })
    });
    const roomConflictData = await roomConflictRes.json();
    assert(roomConflictRes.status === 400, `Room Conflict rejected with 400 Bad Request (Status: ${roomConflictRes.status})`);
    assert(
      roomConflictData.error.toLowerCase().includes('already booked') || roomConflictData.error.includes('Conflict'),
      `Room Conflict message: "${roomConflictData.error}"`
    );

    // CONFLICT TEST 2: SAME DOCTOR (Doctor 1) tries to book ANOTHER ROOM at the SAME DATE and TIME
    console.log('Testing Conflict 2: Prevent the same doctor having 2 bookings at the same date and time');
    const doctorConflictRes = await fetch(`${BASE_URL}/bookings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_id: 1, // Same doctor!
        room_id: 2,   // Different room
        booking_date: '2026-11-20', // Same date
        booking_time: '10:00'  // Same time
      })
    });
    const doctorConflictData = await doctorConflictRes.json();
    assert(doctorConflictRes.status === 400, `Doctor Schedule Conflict rejected with 400 Bad Request (Status: ${doctorConflictRes.status})`);
    assert(
      doctorConflictData.error.toLowerCase().includes('doctor already has a booking') || doctorConflictData.error.includes('Conflict'),
      `Doctor Conflict message: "${doctorConflictData.error}"`
    );

    // Create a Valid Second Booking for Doctor 2 in Room 2 at a different time
    const booking2Res = await fetch(`${BASE_URL}/bookings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_id: 2,
        room_id: 2,
        booking_date: '2026-11-20',
        booking_time: '11:00'
      })
    });
    assert(booking2Res.status === 201, 'POST /bookings/ created second valid booking for Doctor 2 in Room 2 at 11:00');

    // ----------------------------------------------------
    // Section F: Mandatory SQL JOIN Endpoint
    // ----------------------------------------------------
    console.log('\n--- Testing Mandatory SQL JOIN Booking Endpoint ---');
    const joinRes = await fetch(`${BASE_URL}/bookings/details/`);
    const joinData = await joinRes.json();
    assert(joinRes.status === 200, 'GET /bookings/details/ returns 200 OK');
    assert(Array.isArray(joinData) && joinData.length === 2, `JOIN endpoint returned 2 bookings (Received: ${joinData.length})`);

    const firstJoinItem = joinData[0];
    const hasRequiredFields =
      firstJoinItem.booking_id !== undefined &&
      firstJoinItem.booking_date !== undefined &&
      firstJoinItem.booking_time !== undefined &&
      firstJoinItem.doctor_name !== undefined &&
      firstJoinItem.room_name !== undefined;

    assert(
      hasRequiredFields,
      `JOIN record contains all mandatory fields (booking_id, booking_date, booking_time, doctor_name, room_name): ${JSON.stringify(firstJoinItem)}`
    );

    // ----------------------------------------------------
    // Section G: Foreign Key & Deletion Restriction
    // ----------------------------------------------------
    console.log('\n--- Testing Deletion Restrictions (Referenced Records) ---');

    // Try deleting Room 1 which has an active booking
    const deleteRoomRes = await fetch(`${BASE_URL}/rooms/1/`, { method: 'DELETE' });
    const deleteRoomData = await deleteRoomRes.json();
    assert(deleteRoomRes.status === 400, `Attempt to delete referenced Room 1 returned 400 (Status: ${deleteRoomRes.status})`);
    assert(
      deleteRoomData.error.includes('referenced'),
      `Delete room prevented with message: "${deleteRoomData.error}"`
    );

    // Try deleting Doctor 1 who has an active booking
    const deleteDocRes = await fetch(`${BASE_URL}/doctors/1/`, { method: 'DELETE' });
    const deleteDocData = await deleteDocRes.json();
    assert(deleteDocRes.status === 400, `Attempt to delete referenced Doctor 1 returned 400 (Status: ${deleteDocRes.status})`);
    assert(
      deleteDocData.error.includes('referenced'),
      `Delete doctor prevented with message: "${deleteDocData.error}"`
    );

    // Delete unused Room 3 (Consultation Room C, which has no bookings)
    const deleteUnusedRoomRes = await fetch(`${BASE_URL}/rooms/3/`, { method: 'DELETE' });
    assert(deleteUnusedRoomRes.status === 200, 'DELETE /rooms/3/ for unreferenced room succeeded with 200 OK');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n=====================================================');
    console.log(`Test Execution Completed:`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log('=====================================================');

    if (testsFailed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    db.close();
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
