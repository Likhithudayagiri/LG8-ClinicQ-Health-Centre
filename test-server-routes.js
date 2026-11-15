const path = require('path');
const fs = require('fs');

// Set test environment variables to protect clinicq.db
const TEST_DB_PATH = path.resolve(__dirname, 'database', 'clinicq-test.db');
process.env.CLINICQ_DB_PATH = TEST_DB_PATH;
process.env.DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = 'test';

const { app, startServer } = require('./server');
const { db, initializeDatabase } = require('./database');

const TEST_PORT = 3002;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runServerTests() {
  console.log('=====================================================');
  console.log('   ClinicQ Server & Routes Feature Test Suite        ');
  console.log('=====================================================\n');

  await initializeDatabase();

  let server;
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Started on ${BASE_URL}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check Endpoint
    console.log('--- 1. Testing System Health Check (GET /health) ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'GET /health returns HTTP 200 OK');
    assert(healthData.status === 'UP', 'GET /health payload reports status: "UP"');
    assert(typeof healthData.uptime === 'number', 'GET /health returns server uptime numeric value');
    assert(healthData.project === 'ClinicQ Health Centre', 'GET /health returns correct project identifier');

    // 2. Security: X-Powered-By header disabled
    console.log('\n--- 2. Testing Security Hardening (X-Powered-By Header Disabled) ---');
    assert(healthRes.headers.get('x-powered-by') === null, 'Response header "x-powered-by" is stripped/absent');

    // 3. API Directory & Discovery Endpoint
    console.log('\n--- 3. Testing Root Endpoint Discovery (GET /) ---');
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootData = await rootRes.json();
    assert(rootRes.status === 200, 'GET / returns HTTP 200 OK');
    assert(rootData.endpoints.system.health === 'GET /health', 'GET / endpoints map documents GET /health');
    assert(rootData.endpoints.rooms.getAllRooms === 'GET /rooms/', 'GET / endpoints map documents rooms routes');
    assert(rootData.endpoints.doctors.getAllDoctors === 'GET /doctors/', 'GET / endpoints map documents doctors routes');
    assert(rootData.endpoints.bookings.getAllBookings === 'GET /bookings/', 'GET / endpoints map documents bookings routes');

    // 4. Malformed JSON Body Handling (Client Error 400 instead of 500)
    console.log('\n--- 4. Testing Malformed JSON Parsing Middleware ---');
    const malformedRes = await fetch(`${BASE_URL}/rooms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalidJson": unquoted_value}'
    });
    const malformedData = await malformedRes.json();
    assert(malformedRes.status === 400, `Malformed JSON returns HTTP 400 Bad Request (Received: ${malformedRes.status})`);
    assert(malformedData.error.includes('Invalid JSON payload'), `Error message explains JSON parsing failure: "${malformedData.error}"`);

    // 5. Catch-All 404 Route Not Found
    console.log('\n--- 5. Testing Centralized 404 Catch-All Handler ---');
    const notFoundRes = await fetch(`${BASE_URL}/api/non-existent-route`);
    const notFoundData = await notFoundRes.json();
    assert(notFoundRes.status === 404, `Unmatched route returns HTTP 404 (Received: ${notFoundRes.status})`);
    assert(notFoundData.error === 'Route not found: GET /api/non-existent-route', `404 error response matches expected format: "${notFoundData.error}"`);

    // 6. Verification of Programmatic startServer function export
    console.log('\n--- 6. Testing Server Lifecycle & Exports ---');
    assert(typeof startServer === 'function', 'startServer function is exported for programmatic execution');
    assert(typeof app === 'function', 'app Express application is exported');

    console.log('\n=====================================================');
    console.log(`Server & Routes Test Summary:`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('=====================================================');

    if (failed > 0) process.exitCode = 1;
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('\n[Cleanup] Server test instance closed cleanly.');
    }
    if (db) {
      await new Promise((resolve) => db.close(resolve));
      console.log('[Cleanup] SQLite test database connection closed cleanly.');
    }
  }
}

if (require.main === module) {
  runServerTests();
}

module.exports = { runServerTests };
