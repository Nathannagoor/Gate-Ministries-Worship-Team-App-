# GATE Sandton Worship Team Hub

A static site (plain HTML/CSS/JS) for the worship team: song arrangements,
a transposing chord library, availability sign-ups, resources, and
feedback/suggestions. Backed by Firebase (Firestore + Auth) so everything
syncs live between everyone who opens the site.

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project (free "Spark" plan is enough).
2. In the project, go to **Build > Authentication > Sign-in method** and enable **Google** as a sign-in provider.
3. Go to **Build > Firestore Database > Create database**. Start in production mode (rules are provided below).
4. Go to **Project settings > General**, scroll to "Your apps", click the web icon (`</>`) to register a web app, and copy the config object it gives you.

Note: Firebase Storage isn't used here — it now requires the paid Blaze
plan, so Resources uses plain link URLs (YouTube, Google Drive, Dropbox,
etc.) instead of file uploads. See "Adding file uploads later" below if you
want to change that.

## 2. Configure this project

```bash
cp firebase-config.example.js firebase-config.js
```

Paste your config values into `firebase-config.js`. This file is **not**
secret — Firebase web config always ships to the browser — so it's fine to
commit it. Actual access control lives in `firestore.rules`.

## 3. Deploy the security rules

Install the Firebase CLI once if you don't have it:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # pick your project
firebase deploy --only firestore:rules
```

## 4. Make yourself a team lead

The first person to sign in is a regular member (`isTeamLead: false`). To
promote someone (e.g. yourself) to team lead, so they can edit songs, chord
sheets, resources, and approve/pass song suggestions:

1. Sign in to the site once with the Google account you want promoted.
2. In the Firebase console, go to **Firestore Database > users**, open the
   document with that person's uid, and set `isTeamLead` to `true`.

Repeat for anyone else who should be able to edit.

## 5. Run it locally

Any static file server works, e.g.:

```bash
npx serve .
```

Then open the printed URL. Google sign-in requires `http://localhost` or a
real domain to be in the Firebase Auth "Authorized domains" list (localhost
is allowed by default).

## 6. Deploy to GitHub Pages

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
| `chordsheets`   | any signed-in member (create), team leads (edit/delete) | plain-text chord sheets, transposed client-side |
| `resources`     | any signed-in member (create), team leads (edit/delete) | link URLs only for now (see note above) |
| `availability`  | each user, own doc only (`{weekId}_{uid}`) | Sunday-by-Sunday status |
| `feedback`      | each user, own doc only              | set feedback per Sunday |
| `suggestions`   | each user (create own), team leads (update status) | song suggestions |
| `users`         | each user (own profile), team leads (can set `isTeamLead`) | `{ name, email, isTeamLead }` |

## Adding file uploads later

If you later want direct file uploads for Resources (PDFs, audio, video)
instead of links:

1. In the Firebase console, upgrade the project to the **Blaze** plan
   (Storage's free tier still applies on Blaze, plus $300 in credit for
   new upgrades) and enable **Storage**.
2. Add a `storage.rules` entry back to `firebase.json` and deploy it (a
   starting-point rules file is easy to write: allow read/write under
   `/resources/**` to any signed-in user).
3. In `index.html`, re-add a `getStorage`/`uploadBytes`/`getDownloadURL`
   shim (it was removed to keep the app on the free plan) and restore the
   file-upload option in the "Add resource" modal.

## Notes

- The design, layout, CSS and all UI logic are unchanged from the original
  artifact. Only the backend wiring (`window.claude.use(...)`) was replaced
  with a small Firebase-backed shim inside `index.html` that mimics the
  same `db` / `userNs` interface, so the rest of the script didn't need to
  change.
- Chord sheet files are read as plain text in the browser and stored as
  text in Firestore — same as the original.
