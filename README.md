# A Sea of Blessings for Aurora

Next.js 14 (App Router) + TypeScript + GSAP/ScrollTrigger + Tailwind. Art is original inline SVG (`src/components/Art.tsx`).

## Run
```
npm install
npm run dev      # http://localhost:3000
```
## Edit content (no animation code changes)
`src/config/invitation.ts` - date/time/venue/address (currently `[... to be confirmed]` placeholders), dress-code on/off, photo list (put files in `public/photos`), family message, section toggles, post-event memories link.
Setting `event.startIso` (e.g. `"2026-09-06T15:00:00"`) enables Add to Calendar; `event.mapsQuery` enables Get Directions.

## Data / privacy
- Copy `.env.example` to `.env.local`. With `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set, RSVPs/guestbook use Supabase (run `supabase/schema.sql`; RLS blocks all public access - only server routes touch data).
- Without them, data goes to `.data/store.json` (local testing only; not suitable for Vercel).
- `/admin`: private dashboard (RSVPs, approve/remove wishes). Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`. `.env.local` currently holds a local-test password - change it.
- Anti-spam: honeypot, minimum-time check, per-IP rate limit (in-memory; use Upstash/Turnstile for stronger production protection). Wishes show publicly only after approval. No analytics/tracking. Site is `noindex`.

## Still to connect / provide
Supabase credentials, verified event details, family photos (set `meet.photosEnabled=false` to hide), optional real music file (currently a soft synthesized ambience, starts only after a tap, mute button bottom-right). Not deployed anywhere.
