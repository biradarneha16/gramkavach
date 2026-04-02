# gramkavach[README.md](https://github.com/user-attachments/files/26426404/README.md)

cybersecurity server alert system
[README.md](https://github.com/user-attachments/files/26426405/README.md)
# GRAMKAVACH

GRAMKAVACH is a shareable PWA prototype for instant bank account access alerts.

Core idea:
- whenever someone accesses or links an account
- the authorized user gets an instant in-app popup
- and a notification is sent to the registered mobile number

## Main Features

- PWA install support for Windows, macOS, Linux, Android, iPhone, and iPad
- Native app wrapper projects for Android and iOS
- Strong registration with Aadhaar validation, password rules, and live selfie capture
- Real-time popup alerts using Socket.IO
- Browser/PWA device notifications for instant phone pop-up alerts
- SMS alerts to the registered mobile number using Twilio
- Three-step alert verification using RIGHT/WRONG choice, Aadhaar last 4 digits, and signature
- Automatic cyber-crime escalation SMS after repeated high-risk alerts
- Event simulation for authorized, unauthorized, linking, new-device, overseas, and brute-force scenarios
- External bank-side APIs that trigger alerts by account number
- Settings for popup, SMS, email, and event-specific notifications
- GRAMKAVACH shield logo and app icons

## Project Structure

```text
bank-alert-system/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html
│   ├── app-config.js
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   ├── vendor/
│   └── icons/
├── android/
├── ios/
├── docs/
│   ├── README.md
│   ├── INSTALL_EVERY_OS.md
│   ├── GRAMKAVACH_CODE_FILES.md
│   └── NATIVE_APP.md
└── package.json
```

## Quick Start

1. Install dependencies:

```bash
npm run install:all
```

2. Create your env file:

```bash
cp backend/.env.example backend/.env
```

3. Configure environment variables in `backend/.env`

Important values:
- `JWT_SECRET`
- `BANK_EVENT_API_KEY` (optional but recommended for external bank event APIs)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE`
- `CYBER_CRIME_PHONE`
- `EMAIL_USER`
- `EMAIL_PASS`

4. Start the app:

```bash
npm start
```

5. Open:

```text
http://localhost:3000
```

## PWA Install

See:
- `docs/INSTALL_EVERY_OS.md`
- `docs/LOCAL_HTTPS.md`
- `docs/NATIVE_APP.md`

## Best Way To Share

For real cross-device sharing:

1. Deploy the app to a public HTTPS domain
2. Set real Twilio credentials in `backend/.env`
3. Share the public URL
4. Users install it from their browser as an app

HTTPS deployment guide:
- `docs/DEPLOY_HTTPS.md`
- `docs/DEPLOY_RENDER.md`

## Bank-Side Prototype Flow

This project now supports the exact project idea directly:

1. A banking-side system detects account access or linking activity.
2. It calls a GRAMKAVACH API with the user `account_number`.
3. GRAMKAVACH immediately:
   - stores the event
   - shows an in-app popup
   - sends an SMS to the registered mobile number
   - shows a browser/PWA notification on the authorized user's phone
   - asks the user to finish three-step verification
   - escalates to the cyber-crime number if repeated risky alerts cross the threshold

### External access alert API

`POST /api/bank-event`

```json
{
  "account_number": "123456789012",
  "event_type": "unauthorized",
  "ip": "45.227.12.3",
  "device": "Chrome/Windows 11",
  "location": "Mumbai, IN"
}
```

### External linking approval API

`POST /api/bank-link-request`

```json
{
  "account_number": "123456789012",
  "bank_name": "SBI",
  "target_account": "998877665544",
  "beneficiary_name": "Merchant Wallet",
  "amount": "INR 25,000",
  "ip": "45.227.12.3",
  "device": "Chrome/Windows 11",
  "location": "Mumbai, IN"
}
```

If you set `BANK_EVENT_API_KEY` in `backend/.env`, send it in the `x-integration-key` header.

## Important Files

- `frontend/index.html`
- `frontend/app-config.js`
- `frontend/manifest.webmanifest`
- `frontend/service-worker.js`
- `backend/server.js`
- `docs/INSTALL_EVERY_OS.md`
- `android/`
- `ios/`

## Current Status

This version is the best share-ready source version in the project right now:
- branded as GRAMKAVACH
- shield-logo PWA
- installable web app
- native Android/iOS app wrapper source
- real-time popup alert flow
- SMS notification pipeline
- three-step popup verification flow
- repeated-alert escalation to a cyber-crime contact number
- device notification support for the authorized user's phone
- bank-side account-number APIs for access and linking alerts

## Important Prototype Note

This prototype supports SMS as the fallback when the user's phone internet is off.
Fully automatic SMS delivery during a total backend or telecom outage is not realistic for a pure PWA alone.
For stronger offline behavior on Android/iPhone, sync the mobile wrapper after changes and connect the frontend to a native SMS capability.
