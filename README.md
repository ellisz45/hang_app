# hang. 🤙

> One tap. Everyone gets a real push notification — even with the app closed.

---

## What this is

A tiny web app + backend you host yourself (free). When you hit the big button, everyone in your crew gets a **real push notification** on their phone — like a text, but free, no phone number needed.

Works on iPhone (Safari), Android (Chrome), and desktop.

---

## Deploy in 5 minutes (free on Railway)

### Step 1 — Get the code on GitHub

Upload this folder to a new GitHub repo (or use GitHub Desktop).

### Step 2 — Deploy to Railway

1. Go to **railway.app** and sign up (free, no credit card)
2. Click **"New Project" → "Deploy from GitHub repo"**
3. Pick your repo
4. Railway auto-detects Node.js and runs `npm start`
5. Go to **Settings → Networking → Generate Domain** to get a public URL like `hang-app.up.railway.app`

That's it. Share that URL with your friends.

---

## Alternative: Deploy to Render (also free)

1. Go to **render.com**, sign up
2. New → Web Service → Connect GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Free tier auto-sleeps after 15min inactivity (first tap wakes it up in ~30s)

---

## How your friends join

1. Everyone opens the URL on their phone
2. They enter their name + the same group name
3. They add each other as friends
4. Hit "enable notifications" when prompted
5. **Add to Home Screen** for the full app feel:
   - iPhone: Safari → Share → Add to Home Screen
   - Android: Chrome → Menu → Add to Home Screen

---

## How it works

- **Web Push API** — the browser standard for background notifications, works on iOS 16.4+ and all Android
- **Express backend** stores everyone's push subscriptions in memory and blasts them when someone hits the button
- **Service Worker** receives pushes even when the app is closed

---

## Environment variables (optional, for production)

Set these in Railway/Render settings instead of hardcoding:

```
VAPID_PUBLIC=your_public_key
VAPID_PRIVATE=your_private_key
VAPID_EMAIL=mailto:you@email.com
PORT=3000
```

To generate fresh VAPID keys:
```bash
node -e "const wp=require('web-push');console.log(JSON.stringify(wp.generateVAPIDKeys()))"
```

---

## Files

```
hang-app/
├── server.js          ← Node/Express backend + push logic
├── package.json
└── public/
    ├── index.html     ← Full frontend (setup, main, settings screens)
    ├── sw.js          ← Service worker (handles background pushes)
    └── manifest.json  ← PWA manifest (makes it installable)
```

---

## Notes

- Subscriptions live in memory — if the server restarts, everyone needs to re-open the app once to re-subscribe (takes 2 seconds automatically)
- For persistence across restarts, swap the in-memory Map for a free DB like [Turso](https://turso.tech) or [Upstash Redis](https://upstash.com)
- iOS requires Safari 16.4+ for web push (iPhone with iOS 16.4 or later)
