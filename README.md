# PetShop Skopje Website

Static bilingual website with a small Node.js backend for appointment booking.

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

### Optional SMTP configuration

```bash
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="465"
export SMTP_USER="user@example.com"
export SMTP_PASS="your-password"
export EMAIL_FROM="bookings@petshopskopje.mk"
export BOOKING_NOTIFICATION_EMAIL="bookings@petshopskopje.mk"
```
