# Group Member 6 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Jaswanth
- **Student ID:** 252U1R3094
- **Role:** Documentation & API QA Lead
- **Assigned Area / Responsibility:** Postman Collection and README (Postman Collection Authoring, Comprehensive Testing, Technical Documentation, and Installation Guide)

---

## 1. Assigned Responsibilities
Jaswanth took charge of project deliverable presentation, end-to-end API documentation, Postman collection authoring, and installation guide:
1. Authoring the complete, importable Postman Collection:
   - File: `postman/ClinicQ-Collection.json`
   - Formatted using Postman Collection Schema v2.1.0.
   - Configured with environment variable `{{baseUrl}}` defaulting to `http://localhost:3000`.
   - Organized into logical folders:
     1. Mandatory Twist Tests
     2. Rooms Management
     3. Doctors Management
     4. Bookings & Scheduling
2. Documenting every single request with:
   - Clear descriptions.
   - Sample request payloads.
   - Expected HTTP response status codes (`200`, `201`, `400`, `404`).
3. Authoring the comprehensive, professional project `README.md`:
   - System introduction and problem statement scenario.
   - Technologies used and architectural overview.
   - Relational database schema with ASCII ER diagrams.
   - Complete endpoint reference tables.
   - Step-by-step installation and running instructions.
   - Step-by-step Postman collection import and execution guide.
   - Automated testing instructions (`npm test`).
4. Designing and executing the automated verification suite (`test-runner.js`) ensuring all 34 assertions pass.

---

## 2. Contributed Files and Code Sections

### File: `postman/ClinicQ-Collection.json`
- **Postman Collection Structure (Excerpt):**
  ```json
  {
    "info": {
      "name": "ClinicQ Health Centre API - LG 8",
      "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
      {
        "key": "baseUrl",
        "value": "http://localhost:3000",
        "type": "string"
      }
    ],
    "item": [
      { "name": "1. Mandatory Twist Tests", "item": [...] },
      { "name": "2. Rooms Management", "item": [...] },
      { "name": "3. Doctors Management", "item": [...] },
      { "name": "4. Bookings & Scheduling", "item": [...] }
    ]
  }
  ```

### File: `README.md`
- Authored 13 comprehensive sections covering problem statement, architecture, installation, database design, API docs, twist tests, conflict prevention, and Postman guide.

### File: `test-runner.js`
- Automated test script validating status codes, headers, and response payloads across all 34 test cases.

---

## 3. Demonstration & Viva Guide
During the lab demonstration, Jaswanth should explain:
1. **How to Import and Run the Postman Collection:**
   - Open Postman -> Click **Import** -> Select `postman/ClinicQ-Collection.json`.
   - Show the collection variable `baseUrl` set to `http://localhost:3000`.
   - Run the collection using the Postman Collection Runner or execute individual requests.
2. **Postman Collection Organization:**
   - Folder 1 isolates the three mandatory twist tests so the evaluator can test compliance immediately.
   - Folder 2 tests room CRUD and search queries.
   - Folder 3 tests doctor creation and retrieval.
   - Folder 4 tests booking creation, conflicts, and the mandatory SQL JOIN.
3. **Automated Test Suite Execution:**
   - Run `npm test` in the terminal to demonstrate that all 34 unit/integration test assertions pass with 0 failures.
4. **How to Install & Run from Scratch:**
   - `git clone <repo>`
   - `npm install`
   - `npm start`

---

## 4. Screenshot Placeholders

### Screenshot 6.1: Postman Collection Imported in Postman App
```
[ PLACEHOLDER: Screenshot of Postman sidebar showing the imported "ClinicQ Health Centre API - LG 8" collection with all 4 folders and requests ]
```

### Screenshot 6.2: Postman Collection Runner Passing Results
```
[ PLACEHOLDER: Screenshot of Postman Collection Runner executing all requests with green 200/201/400 status badges ]
```

### Screenshot 6.3: Automated Test Runner Terminal Output
```
[ PLACEHOLDER: Screenshot of terminal running `npm test` showing 34 Passed and 0 Failed ]
```
