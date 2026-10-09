# MediQueue

MediQueue is a smart hospital queue management system for patients, doctors and hospital administrators. Patients can book appointments and see their live queue position; doctors can call and update patients; administrators can manage care teams, departments and appointment activity.

## 🔗 Live Demo

**Open the app:** https://mediqueue-app-x34z.onrender.com/login

Sign in with any demo account:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@mediqueue.com` | `Patient@123` |
| Doctor | `doctor1@mediqueue.com` | `Doctor@123` |
| Administrator | `admin@mediqueue.com` | `Admin@123` |

> **Note:** The backend runs on Render's free tier and sleeps after 15 minutes without traffic. The first request can take 30-60 seconds to wake it up. Please wait and retry.

**Quick try:** Sign in as the patient and book a token, then open a private window, sign in as `doctor1@mediqueue.com` and press **Call next patient**. The patient's screen updates live.

## ✨ Features

- **Patients:** register, browse departments and doctors, book a token for a date and time slot, track live queue position with estimated wait time, view history and cancel waiting appointments.
- **Doctors:** view today's queue, call the next patient, mark completed or no-show, set average consultation time and booking availability.
- **Administrators:** manage doctors and departments, view appointment records with filters, and see a dashboard with today's patients, average wait, no-show rate and a seven-day chart.
- **Real time:** Socket.io pushes queue updates to patients and doctors without page refresh.
- **Notifications:** email reminder when three or fewer patients are ahead (console log if SMTP is not configured).
- **Security:** JWT authentication, bcrypt password hashing, role-based access, Helmet, CORS allow-list and rate limiting.

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), React Router, Axios, socket.io-client |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB Atlas with Mongoose |
| Auth | JWT + bcrypt |
| Email | Nodemailer |
| Hosting | Render (API and static site), MongoDB Atlas |

<!--
## 📸 Screenshots
Create a `screenshots` folder, add your images, then remove this comment markers.

![Login](screenshots/login.png)
![Book Appointment](screenshots/book.png)
![Live Track](screenshots/track.png)
![Doctor Panel](screenshots/doctor.png)
![Admin Dashboard](screenshots/admin.png)
-->

## Requirements

- Node.js 18.18+ (Node 20 LTS recommended) and npm
- MongoDB 6+ running locally, or a MongoDB Atlas database

## Local setup

1. Open two terminals at the project root.
2. In `server`, install dependencies and configure the environment:

   ```powershell
   cd server
   npm install
   Copy-Item .env.example .env
   ```

   Set `MONGO_URI` to your local MongoDB URI or Atlas connection string. Replace `JWT_SECRET` with a long random value.

3. Seed the database (this clears MediQueue collections before seeding):

   ```powershell
   npm run seed
   ```

4. Start the API:

   ```powershell
   npm run dev
   ```

   The API and Socket.io server run at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

5. In the second terminal, install and start the frontend:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

The Vite app uses `client/.env` by default (`VITE_API_URL=http://localhost:5000/api`). Restart Vite after changing environment variables.

## Demo logins

Run `npm run seed` in the server folder first.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@mediqueue.com` | `Admin@123` |
| Patient | `patient@mediqueue.com` | `Patient@123` |
| Doctor 1 | `doctor1@mediqueue.com` | `Doctor@123` |
| Doctor 2 | `doctor2@mediqueue.com` | `Doctor@123` |
| Doctor 3 | `doctor3@mediqueue.com` | `Doctor@123` |
| Doctor 4 | `doctor4@mediqueue.com` | `Doctor@123` |

Change demo credentials before using a seeded deployment with real data.

## Test the live queue with two browsers

1. In browser window A, sign in as `patient@mediqueue.com`, book an appointment for an available date, and leave the Live Track page open.
2. In browser window B (or a private window), sign in as the doctor assigned to that department.
3. Open the Doctor panel and choose **Call next patient**. The patient's tracking view updates through Socket.io without refreshing.
4. Try **Mark completed** or **No-show** and book another patient if you want to watch the next token move into service.

Patient queue responses contain queue position and token data, not other patients' names or contact details.

## API

All endpoints are rooted at `/api`. Protected requests use `Authorization: Bearer <JWT>`. JWTs expire after seven days. Dates use `YYYY-MM-DD`; the server's definition of today uses `TZ_NAME` (default `Asia/Kolkata`).

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | API health check |
| POST | `/auth/register` | Public | Register a patient |
| POST | `/auth/login` | Public | Sign in |
| GET | `/auth/me` | Signed in | Current account |
| GET | `/departments` | Public | List departments |
| POST | `/departments` | Admin | Create department |
| PUT | `/departments/:id` | Admin | Update department |
| DELETE | `/departments/:id` | Admin | Delete an unused department |
| GET | `/doctors?departmentId=...&all=true` | Public | List doctors; inactive doctors are included only with `all=true` |
| GET | `/doctors/:id` | Public | Doctor detail |
| GET | `/doctors/me` | Doctor | Current doctor's profile |
| PUT | `/doctors/me` | Doctor | Update consultation time, availability or booking state |
| POST | `/doctors` | Admin | Create a doctor and doctor login |
| PUT | `/doctors/:id` | Admin | Update a doctor |
| DELETE | `/doctors/:id` | Admin | Delete a doctor without active visits |
| POST | `/appointments` | Patient | Book a visit and receive a queue token |
| GET | `/appointments/my` | Patient | List own appointments |
| PATCH | `/appointments/:id/cancel` | Patient (owner) | Cancel a waiting appointment |
| GET | `/queue/:doctorId?date=YYYY-MM-DD` | Signed in | View queue; patients see no other patients' details |
| PATCH | `/queue/:doctorId/next` | Owning doctor or admin | Complete the current patient and call the next waiting token |
| PATCH | `/queue/:doctorId/complete` | Owning doctor or admin | Mark the current visit completed |
| PATCH | `/queue/:doctorId/noshow` | Owning doctor or admin | Mark the current patient as a no-show |
| GET | `/admin/stats` | Admin | Today's totals, average wait, no-show rate, status counts and seven-day totals |
| GET | `/admin/appointments?status=&date=&doctorId=` | Admin | Filter appointment records |
| GET | `/admin/users?role=` | Admin | List users, optionally by role |

The Socket.io client joins a doctor's room with `join` and receives `queueUpdated` events. Booking, cancellation and queue actions emit updates. Email turn reminders are sent to patients when they have three or fewer patients ahead; the notification flag prevents repeat reminders. If SMTP settings are blank, email content is written to the server console.

## Environment

Server variables are documented in [server/.env.example](./server/.env.example). Important settings:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | HTTP and Socket.io port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/mediqueue` | MongoDB connection |
| `JWT_SECRET` | Must be set for production | Secret used to sign seven-day tokens |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin(s), comma-separated |
| `TZ_NAME` | `Asia/Kolkata` | Timezone for today's date |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Empty SMTP credentials | Optional email delivery |
| `MAIL_FROM` | MediQueue local sender | Optional email sender |

The frontend reads `VITE_API_URL` from `client/.env`.

## Common errors

- **MongoDB connection refused / server selection timeout:** Start your local MongoDB service or set `MONGO_URI` to a reachable Atlas cluster. Confirm the database user/password and network access list.
- **`querySrv ECONNREFUSED` with Atlas:** Your network or DNS blocks SRV lookups. Switch network (mobile hotspot), set DNS to `8.8.8.8`, or use the non-SRV `mongodb://` connection string from Atlas.
- **`MONGO_URI is not configured`:** Copy `server/.env.example` to `server/.env` and set the URI.
- **`secretOrPrivateKey must have a value`:** `JWT_SECRET` is missing in `server/.env` (or in Render's environment variables). Add it and restart the server.
- **`EADDRINUSE` (port already in use):** Another copy of the server is running. Close the old terminal, or set a different `PORT` in `server/.env` and update `VITE_API_URL`.
- **CORS error in the browser:** Set `CLIENT_URL` to the exact frontend origin (including protocol and port, no trailing slash), restart the server, and use the matching frontend URL.
- **`Route not found: POST /auth/login` on the deployed site:** `VITE_API_URL` is missing the `/api` suffix. Set it to `https://<your-api>.onrender.com/api` and redeploy the frontend.
- **Invalid or expired token:** Sign out and sign in again. Tokens last seven days; clear the `mq_token` local-storage entry if necessary.
- **Email isn't delivered:** Without complete SMTP settings, messages are intentionally logged in the API terminal. For SMTP, configure host, port, username and password.
- **No doctors appear while booking:** Check that a doctor exists in the selected department and that the doctor is active. Seed the database or add one as an administrator.
- **Deployed site is slow on first load:** Render's free tier sleeps when idle. Wait 30-60 seconds and retry.

## Deployment

The live demo uses MongoDB Atlas for the database and Render for both the API (Web Service) and the frontend (Static Site).

### 1. MongoDB Atlas

1. Create an Atlas cluster and database user.
2. In Network Access, allow the deployment host. For the quick setup described here, add `0.0.0.0/0` (all IPs); use tighter network access controls when your deployment supports them.
3. Copy the application connection string and set its database name (`/mediqueue`) and credentials.
4. Seed the database once from your computer with `npm run seed` (see Local setup). The deployed API then uses the same data.

### 2. Render backend (Web Service)

1. Push this project to GitHub.
2. In Render choose **New + → Web Service** and connect the repository.
3. Set **Root Directory** to `server`, **Build Command** to `npm install`, **Start Command** to `npm start`, and the instance type to **Free**.
4. Add environment variables: `MONGO_URI` (Atlas connection string), `JWT_SECRET` (long random secret), `CLIENT_URL` (the frontend URL, set after step 3), `TZ_NAME=Asia/Kolkata`, and `NODE_VERSION=20`. Add SMTP settings if mail delivery is needed.
5. Deploy and verify the service at `https://<your-api>.onrender.com/api/departments`.

### 3. Render frontend (Static Site)

1. In Render choose **New + → Static Site** and connect the same repository.
2. Set **Root Directory** to `client`, **Build Command** to `npm install && npm run build`, and **Publish Directory** to `dist`.
3. Add the environment variable `VITE_API_URL` = `https://<your-api>.onrender.com/api` (ends with `/api`, no trailing slash).
4. Under **Redirects/Rewrites** add a rule: Source `/*`, Destination `/index.html`, Action **Rewrite**. This prevents 404 errors when a page is refreshed.
5. Deploy and copy the frontend URL.

### 4. Connect both

Open the backend service, go to **Environment**, set `CLIENT_URL` to the exact frontend URL (for example `https://mediqueue-app-x34z.onrender.com`, no trailing slash), then **Save and deploy**. Without this the browser blocks API requests with a CORS error.

### Alternative: Vercel frontend

1. Import the GitHub repository into Vercel and set **Root Directory** to `client`.
2. Set `VITE_API_URL` to the Render API URL ending in `/api`.
3. Deploy, then add the final Vercel URL to Render's `CLIENT_URL` and redeploy the backend.

Changes pushed to the `main` branch redeploy automatically on Render:

```powershell
git add .
git commit -m "update"
git push
```

## Production checklist

- Use a unique, randomly generated `JWT_SECRET` and strong non-demo account passwords.
- Rotate the Atlas database password if it was ever shared, and update `MONGO_URI` everywhere it is used.
- Configure Atlas IP access and SMTP for your deployment environment.
- Set `CLIENT_URL` to the exact deployed origin(s), with no trailing slash.
- Do not expose or commit `.env` files.
