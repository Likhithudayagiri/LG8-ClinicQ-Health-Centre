# Group Member 6 Contribution Document

## Student Information
- **Group:** LG 8
- **Name:** Jaswanth
- **Student ID:** 252U1R3094
- **Role:** Documentation & API QA Lead
- **Assigned Focus Area:** Postman Collection and README (Postman Collection Authoring, Comprehensive Testing, Technical Documentation, and Installation Guide)

---

> **Collaborative Project Statement:**  
> The ClinicQ Health Centre backend was designed, implemented, and tested as a unified team effort by all six members of Group LG 8. Within this collaborative framework, Jaswanth was assigned primary responsibility for the Postman test collection, technical documentation, installation guides, and test runner verification.

---

## 1. Assigned Responsibilities
As the Documentation and Postman lead for LG 8, Jaswanth's assigned responsibilities included:
1. **Postman Collection Authoring (`postman/ClinicQ-Collection.json`):**
   - Structuring a complete, importable collection compliant with Postman Collection Schema v2.1.0.
   - Configuring collection variable `baseUrl` defaulted to `http://localhost:3000`.
   - Organizing requests into four structured folders:
     1. Mandatory Twist Tests (Tests 1, 2, and 3)
     2. Rooms Management (CRUD, floor search, invalid search)
     3. Doctors Management (CRUD, validation)
     4. Bookings & Scheduling (Creation, room conflict, doctor conflict, SQL JOIN, cancellation)
2. **Comprehensive Request Documentation in Postman:**
   - Pre-configuring sample JSON request payloads.
   - Documenting expected status codes (`200`, `201`, `400`, `404`).
3. **Comprehensive Project `README.md`:**
   - Authoring complete project documentation covering system architecture, problem scenario, schema diagrams, endpoint references, installation steps, and test instructions.
4. **Automated Test Suite Verification:**
   - Overseeing automated testing (`test-runner.js`), ensuring all 34 assertions execute and pass against the isolated test database `clinicq-test.db`.

---

## 2. Key Code Sections & Contributions

### File: `postman/ClinicQ-Collection.json`
- **Postman Collection Architecture:**
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
- Authored 13 comprehensive sections:
  1. Project Introduction
  2. Problem Statement
  3. Technologies Used
  4. Database Design & Schema (with ASCII ER Diagram)
  5. Project Structure
  6. Installation Instructions (`npm ci`, `npm install`)
  7. How to Run the Server (`npm start`)
  8. API Endpoints Reference Tables
  9. Sample Requests and Responses
  10. Validation Rules & Special Twist
  11. How to Import and Execute the Postman Collection
  12. Automated Testing & Verification (`npm test`)
  13. Group Member Contributions Table

---

## 3. Demonstration & Viva Guide
During the lab evaluation, Jaswanth should demonstrate and explain:
1. **Importing the Postman Collection:**
   - Open Postman -> Click **Import** -> Select `postman/ClinicQ-Collection.json`.
   - Inspect the collection variable `baseUrl` (`http://localhost:3000`).
2. **Executing the Postman Collection Runner:**
   - Run the entire collection using Postman's Collection Runner.
   - Show how all requests return expected status codes (`201` for creations, `400` for validations/conflicts, `200` for successful retrievals).
3. **Automated Test Suite (`npm test`):**
   - Run `npm test` in the terminal to demonstrate that all 34 assertions pass with 0 failures against `clinicq-test.db` while preserving `clinicq.db`.
4. **Reproducible Installation:**
   - Demonstrate clean installation using `npm ci` and server startup using `npm start`.

---

## 4. Placeholders for Genuine Student Evidence

### Evidence 6.1: Postman Collection Sidebar
*Place genuine Postman screenshot showing the imported collection:*
```
[ PLACEHOLDER: Insert screenshot of Postman sidebar showing "ClinicQ Health Centre API - LG 8" collection expanded with its 4 sub-folders ]
```

### Evidence 6.2: Postman Collection Runner Summary
*Place genuine Postman Runner screenshot showing completed runs:*
```
[ PLACEHOLDER: Insert screenshot of Postman Collection Runner execution results showing green status badges for all executed requests ]
```

### Evidence 6.3: Automated Test Suite Terminal Output
*Place genuine terminal output from running `npm test`:*
```
[ PLACEHOLDER: Paste actual terminal output of `npm test` showing:
  - Target database: clinicq-test.db
  - Test execution logs
  - Passed: 34, Failed: 0 ]
```
