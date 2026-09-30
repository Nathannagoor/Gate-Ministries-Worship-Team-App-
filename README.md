# GATE Sandton Worship Team Hub

A static site (plain HTML/CSS/JS) for the worship team: song arrangements,
a roster/rota with auto-fill, availability per service, per-service
arrangements (the set list), a song library, WhatsApp-ready team messages, resources, and feedback/suggestions. Backed by Firebase (Firestore + Auth) for data/sign-in
and Cloudinary for file uploads (PDFs, video, audio, images, or any other
file type), so everything syncs
live between everyone who opens the site.

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project (free "Spark" plan is enough).
2. In the project, go to **Build > Authentication > Sign-in method** and enable **Google** as a sign-in provider.
3. Go to **Build > Firestore Database > Create database**. Start in production mode (rules are provided below).
4. Go to **Project settings > General**, scroll to "Your apps", click the web icon (`</>`) to register a web app, and copy the config object it gives you.

Note: Firebase Storage isn't used — it now requires the paid Blaze plan.
File uploads go through Cloudinary instead (see step 2), which has a free
tier that doesn't require a card.

## 2. Create a Cloudinary account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account.
2. In the console, note your **Cloud name** (shown on the dashboard).
3. Go to **Settings > Upload**, scroll to "Upload presets", click **Add upload preset**.
4. Set **Signing Mode** to **Unsigned**, give it any name, save it.

## 3. Configure this project

```bash
cp firebase-config.example.js firebase-config.js
cp cloudinary-config.example.js cloudinary-config.js
```

Paste your Firebase config into `firebase-config.js`, and your Cloudinary
cloud name + unsigned preset name into `cloudinary-config.js`. Neither file
holds a traditional secret (both are meant to run in the browser), so it's
fine to commit them — access control for Firestore lives in
`firestore.rules`. For Cloudinary, anyone who reads the preset name could
technically upload through it directly (there's no backend here to check
who's asking), which is an acceptable tradeoff for a small private team
site; keep an eye on your Cloudinary usage if you're worried about it.

## 4. Deploy the security rules

Install the Firebase CLI once if you don't have it:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # pick your project
firebase deploy --only firestore:rules
```

## 5. Make yourself a team lead

The first person to sign in is a regular member (`isTeamLead: false`). To
promote someone (e.g. yourself) to team lead, so they can edit songs, rosters, set lists,
resources, and approve/pass song suggestions:

1. Sign in to the site once with the Google account you want promoted.
2. In the Firebase console, go to **Firestore Database > users**, open the
   document with that person's uid, and set `isTeamLead` to `true`.

Repeat for anyone else who should be able to edit.

## 6. Run it locally

Any static file server works, e.g.:

```bash
npx serve .
```

Then open the printed URL. Google sign-in requires `http://localhost` or a
real domain to be in the Firebase Auth "Authorized domains" list (localhost
is allowed by default).

## 7. Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings > Pages**, set source to the `main` branch
   (root folder), and save.
3. In the Firebase console, go to **Authentication > Settings > Authorized
   domains** and add your `*.github.io` domain (and any custom domain you
   use).
4. Visit the GitHub Pages URL — you should see the sign-in gate, then the
   hub once you sign in with Google.

## Optional: AI clean-up for arrangement ideas

Voice-note ideas (see below) work out of the box for free with no setup —
the browser transcribes speech to text itself. If you'd also like a
"✨ Clean up with Claude" button that tidies up the transcript (fixes
wording, keeps it concise) before saving, you need two things of your own:
an Anthropic API key, and a small proxy server to call it from safely (a
browser can't hold that key without exposing it to anyone who opens dev
tools). This costs a little — usage-based, typically well under $2/month
for a small team's worth of notes — and takes about 10 minutes to set up.

1. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com) (Settings → API Keys). You'll need a card on file there; it's billed per use, not a subscription.
2. Install the Cloudflare CLI and log in:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. Deploy the Worker in this repo:
   ```bash
   cd cloudflare-worker
   wrangler secret put ANTHROPIC_API_KEY   # paste your key when prompted
   wrangler deploy
   ```
   `wrangler deploy` prints a URL like `https://gate-worship-idea-cleanup.<your-subdomain>.workers.dev` — that's your Worker's address.
4. (Optional but recommended) Lock it down to your own site: uncomment the `[vars]` / `ALLOWED_ORIGIN` lines in `cloudflare-worker/wrangler.toml`, set it to your GitHub Pages URL, and run `wrangler deploy` again.
5. Back in the main project folder, put that URL into `ai-config.js`:
   ```js
   export const AI_WORKER_URL = 'https://gate-worship-idea-cleanup.<your-subdomain>.workers.dev';
   ```
6. Commit and push `ai-config.js`. The "✨ Clean up with Claude" button appears in the idea recorder automatically once `AI_WORKER_URL` is set, and disappears (no error, just hidden) if left blank.

None of this touches your Firebase plan or bill — Cloudflare Workers' free tier (100,000 requests/day) is a separate, no-card-required account, and the only Firebase-adjacent cost stays the small, usage-based Anthropic bill.

## Data model

| Collection      | Written by                          | Notes |
|-----------------|--------------------------------------|-------|
| `songs`         | team leads only                      | the arrangement for each service (`serviceId`, `order`, key, tempo, leader, instrument notes, lyrics & chords); this is the set list |
| `songLibrary`   | team leads only                      | title, default key, CCLI, per-member keys, and the fixed arrangement details (`arr`: category, tempo, time, BVs, instrument notes, lyrics & chords) that prefill Arrangements |
| `ideas`         | team leads only (create); author or team lead (delete) | quick arrangement notes per song, typed or spoken (transcribed in-browser); everyone signed in can read them |
| `config/main`   | team leads only                      | church name, rehearsal time, roster positions (name + slot count), song repeat window |
| `services`      | team leads only (regular Sundays are auto-created blank by any client as `sunday-YYYY-MM-DD`) | a dated/named service or special event: roster `assign`, `notes` |
| `availability`  | each member (own answers), team leads (anyone) | one doc per person per service (`serviceId__userId`); private to the person and team leads |
| `teamSheets`    | any signed-in member (create), uploader or team lead (edit/delete) | chord/lead sheets: PDF/image via Cloudinary or text, saved under Praise/Worship with a key; same song in several keys is grouped |
| `resources`     | any signed-in member (create), team leads (edit/delete) | file uploads go to Cloudinary, or a plain link URL |
| `feedback`      | each user (create/edit/delete own)   | private: readable only by its author and team leads |
| `suggestions`   | each user (create own), team leads (update status) | private: readable only by the submitter and team leads |
| `users`         | each user (own profile), team leads (anyone) | `{ name, email, phone, roles, inactive, isTeamLead }` — this is the team roster; people appear once they sign in, or a team lead can pre-add them (see below) |
| `invites`       | team leads (create/edit/delete); the invited person (self-claim only) | pre-adds someone by email before they've signed in; links to their profile automatically on first sign-in (see below) |

Editing/deleting a `resources` doc only removes the
Firestore record — for file resources, the underlying file stays in your
Cloudinary account (deleting it there requires a signed API call, which
needs a backend we don't have). Not a problem in practice for a small
team's free-tier usage.

### Pre-adding team members (invites)

Team leads don't have to wait for someone to sign in first. On the **Team**
tab, **"+ Invite team member"** adds their name, WhatsApp number, positions
and (optionally) "will become team lead" ahead of time, tied to their
email address. The moment that person signs in with Google using that
exact email, the app automatically links the two: their profile is created
already filled in with that name/phone/positions, and if "team lead" was
ticked, they're promoted to team lead the next time any existing team lead
has the app open (this last step needs a team lead's browser to apply the
promotion, since only a team lead's own sign-in is allowed to grant team
lead access — usually within moments if a lead already has it open).
Pending invites are listed lower down on the Team tab and can be cancelled
any time before they're claimed.

## Notes

- The design, layout, CSS and all UI logic are unchanged from the original
  artifact. Only the backend wiring (`window.claude.use(...)`) was replaced
  with a small Firebase-backed shim inside `index.html` that mimics the
  same `db` / `userNs` interface, so the rest of the script didn't need to
  change.
- **Lyrics & chords**: each song (in Arrangements and the Song Library) has
  an optional "Lyrics & chords" text field. When filled in, an
  "Lyrics & chords ▾" toggle appears on that song's arrangement card so the
  team can expand it in place.
- **Arrangement ideas (voice notes)**: team leads can tap "🎤 Idea" on a
  song card to record a quick arrangement note. Recording uses the
  browser's built-in speech-to-text (the Web Speech API — supported in
  Chrome and Edge, not Safari or Firefox), which is free and runs entirely
  client-side, so no extra account or API key is needed; the transcript can
  be edited before saving. An optional "✨ Clean up with Claude" button can
  also tidy up the transcript using the real Anthropic API — see "Optional:
  AI clean-up for arrangement ideas" below for the (small) cost and setup.
