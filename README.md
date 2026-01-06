# SavvyCal Booker

A lightweight one-click booking page for SavvyCal. Recipients can book a meeting with a single click—no calendar picker needed.

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

## Use with Propose Times

This app is designed to work with the [Propose Times](https://github.com/skinnyandbald/propose-times) Raycast extension:

1. Deploy this app to Vercel
2. In the Raycast extension preferences, set **Booker URL** to your Vercel deployment URL
3. Generated meeting time links will now point to this one-click booking form

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

- Next.js 14 (App Router)
- TypeScript
- SavvyCal API

## License

MIT
