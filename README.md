# authencation-backend

Authentication backend (Node.js + Express + MongoDB) with:
- Email verification using OTP (via Nodemailer OAuth2)
- Password hashing (SHA-256)
- Access token (JWT, 15m)
- Refresh token rotation (JWT stored in an httpOnly cookie, 7d) tracked in MongoDB sessions

## Tech Stack
- Node.js (ES Modules, `"type": "module"`)
- Express (v5.x)
- MongoDB with Mongoose
- JWT (`jsonwebtoken`)
- Cookie handling: `cookie-parser`
- Email: `nodemailer` (Gmail OAuth2)
- Logging: `morgan`

## Folder Structure
- `server.js` - app entrypoint (starts the server, connects DB)
- `src/app.js` - Express app setup (middleware + routes)
- `src/config/config.js` - reads and validates environment variables
- `src/config/database.js` - connects to MongoDB
- `src/routes/auth.routes.js` - auth endpoints
- `src/controllers/auth.controller.js` - auth business logic
- `src/models/user.model.js` - user schema
- `src/models/session.model.js` - refresh token/session tracking schema
- `src/models/otp.model.js` - OTP storage schema
- `src/services/email.service.js` - sends OTP email
- `src/utils/utils.js` - OTP generation + OTP email HTML

## Environment Variables
Required variables (validated in `src/config/config.js`):
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_USER` (also used as the email “from” address)

Example `.env`:
```env
MONGO_URI=...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_USER=your-email@gmail.com
```

## API Endpoints
Base path: `/api/auth`

### Register (OTP verification)
`POST /api/auth/register`
- Body: `{ "username": string, "email": string, "password": string }`
- Checks if username or email already exists
- Hashes password using SHA-256
- Generates OTP, stores OTP hash in `otps` collection
- Sends OTP to the provided email
- Response: `201` with `{ message, user: { username, email, verified } }`

### Login (requires verified email)
`POST /api/auth/login`
- Body: `{ "email": string, "password": string }`
- Verifies user exists and `verified === true`
- Hashes incoming password with SHA-256 and compares with stored hash
- Creates:
  - Refresh token JWT (7d) + session record in `sessions` collection
  - Access token JWT (15m)
- Sets cookie `refreshToken` (httpOnly, secure, sameSite strict)
- Response: `200` with `{ message, user: { username, email }, accessToken }`

### Get Me (access token)
`GET /api/auth/get-me`
- Header: `Authorization: Bearer <accessToken>`
- Response: `200` with `{ message, user: { username, email } }`

### Refresh token rotation
`GET /api/auth/refresh-token`
- Cookie: `refreshToken` (httpOnly)
- Verifies JWT, then finds an unrevoked session by refresh token hash
- Issues:
  - new access token (15m)
  - new refresh token (7d) and updates session refresh token hash
- Response: `200` with `{ message, accessToken }`

### Logout (single device)
`GET /api/auth/logout`
- Cookie: `refreshToken`
- Finds session, marks it `revoked = true`, clears the cookie
- Response: `200` with `{ message }`

### Logout from all devices
`GET /api/auth/logout-all`
- Cookie: `refreshToken`
- Verifies token, then revokes all sessions for that user
- Response: `200` with `{ message }`

### Verify email (OTP)
`GET /api/auth/verify-email`
- Current controller implementation expects: `{ otp, email }` from `req.body`
- Important: `GET` requests normally do not include a body. If verification fails from the frontend, change this endpoint to `POST /verify-email` or send `otp`/`email` via query params and update the controller accordingly.

## Auth Flow (High Level)
1. `POST /register` -> generate OTP -> send OTP email -> user remains `verified: false`
2. `verify-email` -> validate OTP -> set user `verified: true` -> delete OTP records for the user
3. `POST /login` -> issue access token + refresh token cookie, store refresh session in MongoDB
4. `GET /refresh-token` -> rotate refresh token + new access token
5. `logout` / `logout-all` -> revoke refresh sessions (prevents future refreshes)

## Notes / Gotchas
- **CORS**: `src/app.js` does not configure CORS. If your frontend is on a different origin, you must enable CORS (and `credentials: true`) for cookie-based auth.
- **Cookie security**: `secure: true` is set for `refreshToken` cookie. In local development over plain `http`, the browser may not send the cookie. For dev, set `secure` to `false` (or serve backend over HTTPS).
- **OTP verify route**: `verify-email` is currently registered as `GET` but controller reads `req.body`. Prefer `POST` or switch to query params.

## Running Locally
```bash
npm install
npm run dev
```

The server is started in `server.js` and uses port `3000`.

