# HomeValue Nova

**Bilingual real estate lead generation app for Northern Virginia.**

HomeValue Nova lets homeowners get a free instant property value estimate, answer a short seller-profile questionnaire, and connect with a local real estate agent. The agent receives an SMS notification for every new lead and can manage leads through a private dashboard.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Single-file HTML + CSS + Vanilla JS |
| Backend    | Node.js + Express                   |
| Database   | PostgreSQL (Railway plugin)         |
| Auth       | JWT (24-hour expiry)                |
| SMS        | Twilio                              |
| Hosting    | Railway                             |

---

## Project Structure

```
homevalue-nova/
├── server.js           # Express app entry point
├── package.json
├── railway.json        # Railway deployment config
├── .env.example        # Environment variable template
├── public/
│   └── index.html      # Frontend (bilingual EN/ES)
├── routes/
│   ├── leads.js        # POST /api/leads, GET /api/leads, PUT /api/leads/:id
│   └── auth.js         # POST /api/auth/login
├── middleware/
│   └── auth.js         # JWT verification middleware
└── db/
    ├── index.js        # PostgreSQL connection pool
    └── schema.sql      # Table definitions + seed data
```

---

## API Endpoints

| Method | Path               | Auth | Description                    |
|--------|--------------------|------|--------------------------------|
| POST   | `/api/leads`       | No   | Submit a new lead              |
| POST   | `/api/auth/login`  | No   | Agent login, returns JWT       |
| GET    | `/api/leads`       | JWT  | Fetch all leads (score desc)   |
| PUT    | `/api/leads/:id`   | JWT  | Update lead status             |

---

## Environment Variables

Copy `.env.example` to `.env` for local development. On Railway, set these in the **Variables** panel:

| Variable              | Description                                      |
|-----------------------|--------------------------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string (auto-set by plugin)|
| `JWT_SECRET`          | Secret key for signing JWTs                      |
| `TWILIO_ACCOUNT_SID`  | Twilio account SID                               |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token                                |
| `TWILIO_FROM_NUMBER`  | Twilio phone number (E.164 format)               |
| `AGENT_PHONE_ENGLISH` | Agent phone for English-language leads (SMS)     |
| `AGENT_PHONE_SPANISH` | Agent phone for Spanish-language leads (SMS)     |
| `AGENT_PHONE_NUMBER`  | Legacy fallback if language-specific not set     |
| `DASHBOARD_URL`       | Public URL of the deployed app                   |
| `PORT`                | Server port (Railway sets this automatically)    |

---

## Service Area (ZIP Codes)

| ZIP   | City            |
|-------|-----------------|
| 22554 | Stafford        |
| 22191 | Woodbridge      |
| 22192 | Woodbridge      |
| 22193 | Woodbridge      |
| 22401 | Fredericksburg  |
| 22405 | Fredericksburg  |
| 22406 | Fredericksburg  |

---

## Default Agent Login

| Field    | Value           |
|----------|-----------------|
| Email    | agent@dlcr.com  |
| Password | nova2024        |

---

## Local Development

```bash
npm install
cp .env.example .env
# Fill in your DATABASE_URL and other vars in .env
node server.js
```

Open `http://localhost:3000` in your browser.
