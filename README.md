# Student Management System API

A REST API built with Node.js, Express, and MongoDB for creating and managing student records.

## Requirements

- Node.js 18 or newer
- A MongoDB Atlas cluster (or another MongoDB deployment reachable by this API)
- npm

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env`.
3. Start the API:
   ```sh
   npm run dev
   ```

Before starting the API, replace the `MONGODB_URI` placeholder in `.env` with your Atlas connection string. Use a database user created for this application, not your Atlas account login. URL-encode special characters in the username or password.

In Atlas, add the public outbound IP address of the machine running this API under **Network Access**. When deployed, allow the API host's outbound IP (or configure private networking); do not expose the database to all IPs for production.

The API listens on port `3000` by default. Set `PORT` to change it. Set `CORS_ORIGIN` to the browser-based frontend origin or a comma-separated list of allowed origins, for example `https://students.example.com,https://admin.example.com`.

Deploy this API on a host reachable by your other systems, then have those systems call the API's `/api/students` endpoints. Keep the Atlas URI in the API host's environment settings or a secrets manager; do not commit `.env`, put the URI in frontend code, or connect browser clients directly to Atlas. The example URI uses the `student_management` database.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Check API status |
| GET | `/api/students` | List students |
| GET | `/api/students/:id` | Get a student |
| POST | `/api/students` | Create a student |
| PUT/PATCH | `/api/students/:id` | Update one or more student fields |
| DELETE | `/api/students/:id` | Delete a student |

### Student fields

- `firstName` (required, max 80 characters)
- `lastName` (required, max 80 characters)
- `email` (required, unique, valid email address)
- `grade` (required, max 40 characters)
- `course` (required, max 120 characters)
- `dateOfBirth` (optional, ISO date in the past)

Example create request:

```json
{
  "firstName": "Avery",
  "lastName": "Morgan",
  "email": "avery.morgan@example.com",
  "grade": "10",
  "course": "Science",
  "dateOfBirth": "2010-04-12"
}
```

Successful responses return the record in a `data` property. The list response also includes `count`. Errors return an `error` message; deleting a record returns `204 No Content`.

Run the test suite with `npm test`.

## React frontend

The React and Vite frontend is in `frontend/` and talks to the API at `http://localhost:3000/api/students` by default. Keep the API URI and database credentials on the backend; the frontend only connects to your API.

1. In a separate terminal, install the frontend dependencies:
   ```sh
   cd frontend
   npm install
   ```
2. To use a non-default API URL, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to the API's base URL, such as `https://api.example.com/api/students`.
3. Start the frontend:
   ```sh
   npm run dev
   ```
4. Open the Vite URL shown in the terminal (by default, `http://localhost:5173`). Configure the backend's `CORS_ORIGIN` to allow that frontend origin.

The frontend includes student search, course filtering, enrollment statistics, and forms to add, edit, and delete records. Course filter options are populated from the available student records, and it can be combined with search.
