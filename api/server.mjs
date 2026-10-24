// Tiny fake API for the RxJS session — no dependencies, just Node.
// Run:  npm run api      (listens on http://localhost:3100)

import http from 'node:http';

const PORT = 3100;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China',
  'Colombia', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Ghana', 'Greece', 'Iceland', 'India',
  'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Nepal',
  'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Peru', 'Poland', 'Portugal', 'Qatar',
  'Singapore', 'South Africa', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey',
  'Uganda', 'Ukraine', 'United Kingdom', 'United States', 'Vietnam',
];

let ordersToday = 120;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const started = Date.now();
  let finished = false;
  res.on('finish', () => (finished = true));
  req.on('close', () => !finished && console.log(`    ${req.url} cancelled by the browser after ${Date.now() - started}ms`));
  console.log(`GET ${req.url}`);

  // GET /api/search?q=in
  // SHORT queries are SLOW, long queries are FAST → old requests can finish AFTER new ones.
  // That race is exactly what switchMap protects you from.
  if (url.pathname === '/api/search') {
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    await delay(Math.max(200, 1600 - q.length * 350));
    if (q.includes('error')) return send(res, 500, { message: 'Search server crashed (you typed "error")' });
    return send(res, 200, { query: q, results: COUNTRIES.filter((c) => c.toLowerCase().includes(q)) });
  }

  // Three "dashboard" endpoints with different speeds — for forkJoin
  if (url.pathname === '/api/user') {
    await delay(600);
    return send(res, 200, { name: 'Asha', city: 'Pune' });
  }
  if (url.pathname === '/api/orders') {
    await delay(1500);
    if (url.searchParams.get('fail')) return send(res, 500, { message: 'Orders service is down' });
    return send(res, 200, [{ id: 101, total: 2200 }, { id: 102, total: 900 }]);
  }

  // GET /api/live — numbers that change every call (for auto-refresh)
  if (url.pathname === '/api/live') {
    ordersToday += Math.floor(Math.random() * 3);
    return send(res, 200, {
      activeUsers: 40 + Math.floor(Math.random() * 20),
      ordersToday,
      time: new Date().toLocaleTimeString(),
    });
  }
  if (url.pathname === '/api/settings') {
    await delay(300);
    return send(res, 200, { theme: 'dark', currency: 'INR' });
  }

  send(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => console.log(`RxJS demo API on http://localhost:${PORT}/api`));
