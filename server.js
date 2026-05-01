const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ── VAPID keys (replace with your own if regenerating) ──
// To generate fresh keys: node -e "const wp=require('web-push');console.log(JSON.stringify(wp.generateVAPIDKeys()))"
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC  || 'BDPPK-tJE95m8WZZwMPjWzniO1o8ThDSja3ZlO36BHNCyJ_OpaFWYZ3mhffTkYjZInO3UhEeOlxdyKgmEXvqqqc';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'PFGGCtPP5Jp5FRIW6F5dLG4l-C24yQ1FB1d9oP00ic0';
const VAPID_EMAIL   = process.env.VAPID_EMAIL   || 'mailto:hang@example.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// ── In-memory store (survives as long as server is running) ──
// For persistence across restarts, swap with a simple JSON file or free DB like Turso/Upstash
const subscriptions = new Map(); // name -> { subscription, joinedAt }
const hangLog = [];              // { from, msg, ts }

// ── Routes ──

// Get VAPID public key (used by browser to subscribe)
app.get('/api/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// Register a push subscription for a user
app.post('/api/subscribe', (req, res) => {
  const { name, subscription } = req.body;
  if (!name || !subscription) return res.status(400).json({ error: 'name and subscription required' });

  subscriptions.set(name.trim(), { subscription, joinedAt: Date.now() });
  console.log(`[+] ${name} subscribed (${subscriptions.size} total)`);
  res.json({ ok: true, members: [...subscriptions.keys()] });
});

// Get current members
app.get('/api/members', (req, res) => {
  res.json({ members: [...subscriptions.keys()] });
});

// Get recent hang log
app.get('/api/log', (req, res) => {
  res.json({ log: hangLog.slice(-30) });
});

// Fire the hang signal — notifies everyone else
app.post('/api/hang', async (req, res) => {
  const { from, message } = req.body;
  if (!from) return res.status(400).json({ error: 'from required' });

  const msg = message || `${from} wants to hang — right now!`;
  const entry = { from, msg, ts: Date.now() };
  hangLog.unshift(entry);
  if (hangLog.length > 100) hangLog.length = 100;

  const payload = JSON.stringify({
    title: '🤙 hang.',
    body: msg,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'hang-alert',
    data: { from, ts: entry.ts }
  });

  const results = { sent: 0, failed: 0, skipped: 0 };
  const toDelete = [];

  for (const [name, { subscription }] of subscriptions.entries()) {
    if (name === from) { results.skipped++; continue; }
    try {
      await webpush.sendNotification(subscription, payload);
      results.sent++;
    } catch (err) {
      console.warn(`Failed to notify ${name}:`, err.statusCode);
      if (err.statusCode === 410 || err.statusCode === 404) {
        toDelete.push(name); // subscription expired
      }
      results.failed++;
    }
  }

  toDelete.forEach(n => subscriptions.delete(n));
  console.log(`[hang] ${from} → sent:${results.sent} failed:${results.failed}`);
  res.json({ ok: true, ...results, members: [...subscriptions.keys()] });
});

// Unsubscribe
app.post('/api/unsubscribe', (req, res) => {
  const { name } = req.body;
  if (name) subscriptions.delete(name);
  res.json({ ok: true });
});

// Catch-all: serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`hang. running on http://localhost:${PORT}`));
