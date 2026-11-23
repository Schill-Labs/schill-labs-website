// Schill Labs signup handler: POST https://schilllabs.com/api/subscribe
// Runs on the zone route schilllabs.com/api/subscribe, in front of the Pages site.
// Stores each signup in KV (SIGNUPS) and emails a notification to NOTIFY_TO through
// Cloudflare Email Sending (sender subdomain notify.schilllabs.com).

const ALLOWED_ORIGINS = ['https://schilllabs.com', 'https://www.schilllabs.com'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PER_IP_PER_HOUR = 10;

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

// One line of plain text: no control characters (keeps subjects and keys clean).
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/subscribe') return fetch(request);

    if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405, { Allow: 'POST' });

    const origin = request.headers.get('Origin');
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Forbidden.' }, 403);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Send JSON.' }, 400);
    }

    const email = clean(body.email, 254).toLowerCase();
    const topic = clean(body.topic, 80) || 'Schill Labs updates';
    const page = clean(body.page, 200);
    if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email address.' }, 400);

    // Light abuse guard: a handful of signups per IP per hour.
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rlKey = `rl:${ip}`;
    const hits = parseInt((await env.SIGNUPS.get(rlKey)) || '0', 10);
    if (hits >= MAX_PER_IP_PER_HOUR) return json({ error: 'Too many signups. Try again later.' }, 429);
    ctx.waitUntil(env.SIGNUPS.put(rlKey, String(hits + 1), { expirationTtl: 3600 }));

    const key = `sub:${topic}:${email}`;
    if (await env.SIGNUPS.get(key)) return json({ ok: true, already: true });

    const record = {
      email,
      topic,
      page,
      at: new Date().toISOString(),
      country: request.cf?.country || '',
    };
    await env.SIGNUPS.put(key, JSON.stringify(record));

    try {
      await env.EMAIL.send({
        from: { email: env.NOTIFY_FROM, name: 'Schill Labs website' },
        to: env.NOTIFY_TO,
        replyTo: email,
        subject: `New signup: ${topic}`,
        text:
          `${email} signed up for "${topic}".\n\n` +
          `Page: ${page || '(unknown)'}\n` +
          `Time: ${record.at}\n` +
          `Country: ${record.country || '(unknown)'}\n\n` +
          `Reply to this email to write back to them.\n`,
      });
    } catch (err) {
      // The signup is already saved; log the failure so it shows in `wrangler tail`.
      console.error('notify failed', err?.code || '', err?.message || err);
    }

    return json({ ok: true });
  },
};
