# SavvyCal Booker

A lightweight one-click booking page for SavvyCal. Recipients can book a meeting with a single click—no calendar picker needed.

**Part of the [Propose Times](https://github.com/skinnyandbald/propose-times) system** — this handles the booking form, the Raycast extension generates the meeting time messages.

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fskinnyandbald%2Fsavvycal-booker&env=SAVVYCAL_TOKEN&envDescription=Your%20SavvyCal%20Personal%20Access%20Token&envLink=https%3A%2F%2Fsavvycal.com%2Fsettings%2Fintegrations)

### Setup

1. Click the "Deploy with Vercel" button above
2. Add your `SAVVYCAL_TOKEN` environment variable (get it from [SavvyCal Settings](https://savvycal.com/settings/integrations))
3. Deploy!

## How It Works

This app provides a simple booking form at `/book` that accepts URL parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `slot` | Yes | ISO timestamp of the meeting start time |
| `link_id` | Yes | SavvyCal scheduling link ID |
| `duration` | No | Meeting duration in minutes (default: 30) |
| `tz` | No | Timezone (default: America/New_York) |
| `host` | No | Host name to display |

### Example URL

```
https://your-app.vercel.app/book?slot=2024-01-15T14:00:00Z&link_id=link_abc123&duration=25&tz=America/New_York
```

## Use with Propose Times (Raycast Extension)

This app is the backend for the [Propose Times](https://github.com/skinnyandbald/propose-times) Raycast extension. The extension generates the meeting time messages; this app handles the one-click booking.

### Full Setup

1. **Deploy this app** using the button above
2. **Install the Raycast extension:**
   ```bash
   git clone https://github.com/skinnyandbald/propose-times.git
   cd propose-times
   npm install
   npm run build
   ```
   Then in Raycast: **Preferences → Extensions → + → Import Extension** → select the folder

3. **Connect them:** In Raycast extension preferences, set **Booker URL** to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

Now when you generate meeting times, each slot links directly to this booking form.

## Local Development

```bash
# Install dependencies
npm install

# Copy environment file and add your token
cp .env.example .env.local

# Run development server
npm run dev
```

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- SavvyCal API

## License

MIT
