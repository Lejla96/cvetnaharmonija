# PetShop Skopje Website

Static bilingual website with a booking backend that works both locally and on Vercel.

## Run locally

```bash
npm install
npm start
```

Open:

- Macedonian version: `http://localhost:3000/`
- English version: `http://localhost:3000/en.html`

## Booking backend

Appointment requests are sent to `POST /api/bookings`.

- Requests are stored locally in `data/bookings.ndjson`
- If Supabase is configured, appointment requests can also be stored in the
  `appointment_requests` table for durable production storage
- Email sending is enabled when SMTP environment variables are configured

## Supabase pet contacts

The website also includes a separate pet contact form that sends submissions to
`POST /api/pet-profiles`.

Submitted fields:

- owner name
- phone number
- email address
- pet name

To create the required table in Supabase, run the SQL from:

- `supabase/schema.sql`

Required server-side environment variables:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Optional:

```bash
export SUPABASE_PET_CONTACTS_TABLE="pet_owner_contacts"
export SUPABASE_BOOKINGS_TABLE="appointment_requests"
```

Keep the service role key only in Vercel/server environments and never expose it
in the browser.

## Vercel deployment

- `index.html`, `en.html`, `styles.css`, and `script.js` are served as static files
- `api/bookings.js` handles appointment submissions as a serverless function
- `api/pet-profiles.js` stores pet contact submissions in Supabase
- `/en` rewrites to `/en.html` through `vercel.json`
- On Vercel, appointment requests should use Supabase and/or SMTP for durable
  production handling

### Optional SMTP configuration

```bash
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="465"
export SMTP_USER="user@example.com"
export SMTP_PASS="your-password"
export EMAIL_FROM="bookings@petshopskopje.mk"
export BOOKING_NOTIFICATION_EMAIL="bookings@petshopskopje.mk"
```
