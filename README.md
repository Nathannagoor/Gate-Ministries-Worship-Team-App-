# GATE Sandton Worship Team Hub

A static site (plain HTML/CSS/JS) for the worship team: song arrangements,
a transposing chord library, availability sign-ups, resources, and
feedback/suggestions. Backed by Firebase (Firestore + Auth) for data/sign-in
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
promote someone (e.g. yourself) to team lead, so they can edit songs, chord
sheets, resources, and approve/pass song suggestions:

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

## Data model

| Collection      | Written by                          | Notes |
|-----------------|--------------------------------------|-------|
| `songs`         | team leads only                      | practice arrangements |
| `chordsheets`   | any signed-in member (create), team leads (edit/delete) | plain text (transposed client-side) or an uploaded PDF/scan via Cloudinary (view-only, not transposable) |
| `resources`     | any signed-in member (create), team leads (edit/delete) | file uploads go to Cloudinary, or a plain link URL |
| `availability`  | each user, own doc only (`{weekId}_{uid}`) | Sunday-by-Sunday status; clicking the active status again clears it |
| `feedback`      | each user, own doc only              | set feedback per Sunday |
| `suggestions`   | each user (create own), team leads (update status) | song suggestions |
| `users`         | each user (own profile), team leads (can set `isTeamLead`) | `{ name, email, isTeamLead }` |

Editing/deleting a `resources` or `chordsheets` doc only removes the
Firestore record — for file resources, the underlying file stays in your
Cloudinary account (deleting it there requires a signed API call, which
needs a backend we don't have). Not a problem in practice for a small
team's free-tier usage.

## Notes

- The design, layout, CSS and all UI logic are unchanged from the original
  artifact. Only the backend wiring (`window.claude.use(...)`) was replaced
  with a small Firebase-backed shim inside `index.html` that mimics the
  same `db` / `userNs` interface, so the rest of the script didn't need to
  change.
- Chord sheet files are read as plain text in the browser and stored as
  text in Firestore — same as the original.
