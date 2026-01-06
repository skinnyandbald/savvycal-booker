# SavvyCal-Booker

A lightweight one-click booking page that works with both **SavvyCal** and **Cal.com**. Recipients can book a meeting with a single click—no calendar picker needed.

**Part of the [Propose Times](https://github.com/skinnyandbald/propose-times) system** — this handles the booking form, the Raycast extension generates the meeting time messages.

## What You'll Need

**Vercel account** — A hosting service that runs this small web app. Deploying is as simple as clicking a button.
- 💰 **Free** — The free tier handles plenty of bookings
- 🔗 [Sign up for Vercel](https://vercel.com/signup) (you can use your GitHub account)

**A scheduling account** — Either one:
- [SavvyCal](https://savvycal.com) — Starts at $12/month
- [Cal.com](https://cal.com) — Free tier available

---

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fskinnyandbald%2Fsavvycal-booker&env=SAVVYCAL_TOKEN,CALCOM_API_KEY&envDescription=API%20tokens%20for%20your%20calendar%20providers&envLink=https%3A%2F%2Fsavvycal.com%2Fsettings%2Fintegrations)

### Setup

1. Click the "Deploy with Vercel" button above
2. Add your environment variables:
   - `SAVVYCAL_TOKEN` - Get from [SavvyCal Settings](https://savvycal.com/settings/integrations) (optional if using Cal.com only)
   - `CALCOM_API_KEY` - Get from [Cal.com API Keys](https://app.cal.com/settings/developer/api-keys) (optional if using SavvyCal only)
3. Deploy!

## How It Works

This app provides a simple booking form at `/book` that accepts URL parameters. The `provider` parameter determines which calendar service to use.

### SavvyCal Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `provider` | No | Set to `savvycal` (default) |
| `slot` | Yes | ISO timestamp of the meeting start time |
| `link_id` | Yes | SavvyCal scheduling link ID |
| `duration` | No | Meeting duration in minutes (default: 30) |
| `tz` | No | Timezone (default: America/New_York) |

### Cal.com Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `provider` | Yes | Set to `calcom` |
| `slot` | Yes | ISO timestamp of the meeting start time |
| `username` | Yes | Cal.com username |
| `event_slug` | Yes | Event type slug |
| `duration` | No | Meeting duration in minutes (default: 30) |
| `tz` | No | Timezone (default: America/New_York) |

### Example URLs

**SavvyCal:**
```text
https://your-app.vercel.app/book?slot=2024-01-15T14:00:00Z&link_id=link_abc123&duration=25&tz=America/New_York
```

**Cal.com:**
```text
https://your-app.vercel.app/book?provider=calcom&slot=2024-01-15T14:00:00Z&username=skinnyandbald&event_slug=pow-wow&duration=30&tz=America/New_York
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

4. **Choose your provider:** In extension preferences, select either SavvyCal or Cal.com and enter the appropriate credentials.

Now when you generate meeting times, each slot links directly to this booking form.

## Local Development

```bash
# Install dependencies
npm install

# Copy environment file and add your tokens
cp .env.example .env.local

# Run development server
npm run dev
```

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- SavvyCal API / Cal.com API v2

## License

MIT
