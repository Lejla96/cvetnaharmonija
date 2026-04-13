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
- Email sending is enabled when SMTP environment variables are configured

## Vercel deployment

- `index.html`, `en.html`, `styles.css`, and `script.js` are served as static files
- `api/bookings.js` handles appointment submissions as a serverless function
- `/en` rewrites to `/en.html` through `vercel.json`

On Vercel, filesystem writes may fall back to temporary storage, so SMTP email delivery is strongly recommended for production booking notifications.

### Optional SMTP configuration

```bash
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="465"
export SMTP_USER="user@example.com"
export SMTP_PASS="your-password"
export EMAIL_FROM="bookings@petshopskopje.mk"
export BOOKING_NOTIFICATION_EMAIL="bookings@petshopskopje.mk"
```
