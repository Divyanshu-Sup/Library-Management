# Pustakshala — Library Management System

A Node.js, Express, MongoDB and vanilla HTML/CSS/JavaScript library management app with separate student and administrator experiences.

## Features

- Student login and personal active-book list
- Search and browse books
- Admin dashboard and book catalogue management
- Issue and return tracking
- Session-based authentication and server-side role checks
- Validated book/user inputs and safe error responses

## Requirements

- Node.js **22.9 or newer**
- MongoDB running locally or a MongoDB connection URI

## Setup

1. Clone the repository and enter its directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`.
4. Set `MONGO_URI` and `SESSION_SECRET`. Use a random session secret of at least 32 characters. Keep `.env` private and never commit it.
5. Start MongoDB.
6. Create the first administrator account. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` first; the admin password must be at least 12 characters.

   ```bash
   npm run create-admin
   ```

7. Start the app:

   ```bash
   npm start
   ```

8. Open [http://localhost:3000/login.html](http://localhost:3000/login.html).

For development, use `npm run dev`.

## Registering students

Student accounts can be created by sending a POST request to `/auth/register` with JSON:

```json
{
  "username": "student01",
  "password": "a-long-unique-password"
}
```

Public registration always assigns the `student` role. It deliberately ignores any supplied `role` field. Create administrators only through the setup script.

## Main routes

| Route | Access |
|---|---|
| `POST /auth/register` | Public; creates students only |
| `POST /auth/login` | Public |
| `POST /auth/logout` | Signed-in session |
| `GET /auth/me` | Signed-in session |
| `GET /api/books` and `GET /api/books/search?q=...` | Signed-in users |
| `GET /api/issued/:userId` | Own records, or admin |
| Book create/update/delete | Admin only |
| Issue and return books | Admin only |
| `GET /api/issues/all` and `GET /api/users` | Admin only |
| `GET /health` | Health status |

## Security notes

- Keep `.env` out of version control and use a unique secret in each environment.
- Production deployments must use HTTPS so secure session cookies are enabled (`NODE_ENV=production`).
- The default Express session store is intended for local development. Configure a persistent shared session store (for example, MongoDB-backed sessions) before deploying to production.
- For public deployment, add rate limiting, CSRF protection appropriate to the deployment, monitoring, and automated tests.
- Never expose administrator credentials in client-side code or source control.

## Project structure

```text
app.js
models/
  Book.js
  Issue.js
  User.js
routes/
  apiRoutes.js
  authRoutes.js
scripts/
  create-admin.js
public/
  login.html / login.css / login.js
  admin.html / admin.css / admin.js
  student.html / student.css / student.js
```

## Scripts

- `npm start` — start the server
- `npm run dev` — restart the server when files change
- `npm run create-admin` — create an administrator using environment variables
- `npm test` — run Node's test runner
