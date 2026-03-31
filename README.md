# Hostack Staff App v1

> Shift checklists + incident reporting + real-time notifications for hospitality teams.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (optional for demo mode)

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Fill in:
- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase public API key

**Demo mode**: App works without Supabase. Login with any email + password (4+ chars).

### Development Server

```bash
npm run dev
```

Opens at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Outputs to `dist/` — deploy to Vercel, Netlify, or any static host.

## Features

### ✓ Shift Checklist
- Daily task list with categories (Service, Housekeeping, Maintenance, Safety)
- Task status: To Do → In Progress → Done → Escalated
- Estimated duration per task
- Photo attachment for defects/room conditions
- Real-time sync with Supabase

### ✓ Incident Reporting
- Quick form: category + photo + notes
- Categories: Maintenance | Safety | Guest Complaint | Other
- Auto-notify manager on submission
- Status tracking (Open → In Progress → Resolved)

### ✓ Real-time Notifications
- Badge counter for unread incidents
- Toast alerts for critical incidents (Safety, Maintenance urgent)
- Subscription-based updates via Supabase

### ✓ Offline Support
- PWA-ready (service worker via Vite)
- Checklist loads once, works offline
- Syncs changes when online

## Database Schema

See `supabase_schema.sql` for the full schema.

### Key Tables
- **staff** — Team member records
- **shift_templates** — Reusable shift schedules
- **checklist_tasks** — Daily tasks assigned to staff
- **incidents** — Incident reports with photos & status
- **notifications** — Real-time alerts to staff

To set up:
1. Create a new Supabase project
2. Open SQL Editor
3. Copy & paste `supabase_schema.sql`
4. Click "Run"

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard → Settings → Environment Variables.

### Other Platforms
- Netlify: `npm run build` → drag `dist/` folder
- GitHub Pages: Configure GitHub Actions + `npm run build`

## Architecture

```
src/
├── main.jsx          — Entry point
├── App.jsx           — Routing & state
├── App.css           — Global styles
├── lib/
│   └── supabase.js   — Supabase client
├── pages/
│   ├── Login.jsx     — Auth UI
│   ├── ShiftChecklist.jsx    — Hero feature
│   └── IncidentReport.jsx    — Incident form
└── styles/
    ├── Login.css
    ├── ShiftChecklist.css
    └── IncidentReport.css
```

## Stack

- **Frontend**: React 19 + Vite
- **Auth & Database**: Supabase (PostgreSQL)
- **Styling**: CSS variables (no external CSS frameworks)
- **Hosting**: Vercel

## Demo Credentials

```
Email: demo@torridonia.local
Password: demo1234
```

(Works only in demo mode without Supabase)

## Roadmap (v1.1+)

- [ ] Twilio SMS notifications
- [ ] Dark mode for night shift
- [ ] Photo compression & CDN upload
- [ ] Offline sync queue
- [ ] Push notifications (PWA)
- [ ] Shift scheduling UI
- [ ] Team activity feed
- [ ] Mobile app (React Native)

## Support

Questions? Open an issue on GitHub or contact tech@hostack.com

---

Built for Torridonia Estate. Designed to ship lean and ruthless.
