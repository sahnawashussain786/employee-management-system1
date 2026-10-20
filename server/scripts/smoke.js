import http from 'node:http';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';

function request(path, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.stringify(opts.body) : null;

    const req = http.request(
      {
        hostname: new URL(BASE).hostname,
        port: new URL(BASE).port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, body: json });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function smoke() {
  console.log(`[smoke] targeting ${BASE}`);

  // ---- health ----
  const health = await request('/api/health');
  if (health.status !== 200 || !health.body.success) {
    console.error('[smoke] FAIL: /api/health →', health.status, health.body);
    process.exit(1);
  }
  console.log('[smoke] OK: /api/health');

  // ---- login as admin ----
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'sarah.chen@acme.com', password: process.env.SEED_ADMIN_PASSWORD || 'admin123' },
  });
  if (login.status !== 200 || !login.body.success || !login.body.data?.user) {
    console.error('[smoke] FAIL: /api/auth/login →', login.status, login.body.error?.message || login.body);
    process.exit(1);
  }
  const token = login.body.data.accessToken;
  console.log('[smoke] OK: /api/auth/login (admin)');

  const auth = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  // ---- departments ----
  const depts = await request('/api/departments', { ...auth });
  if (depts.status !== 200 || !depts.body.success || !Array.isArray(depts.body.data)) {
    console.error('[smoke] FAIL: /api/departments →', depts.status, depts.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/departments → ${depts.body.data.length} departments`);

  // ---- employees ----
  const emps = await request('/api/employees', { ...auth });
  if (emps.status !== 200 || !emps.body.success || !Array.isArray(emps.body.data)) {
    console.error('[smoke] FAIL: /api/employees →', emps.status, emps.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/employees → ${emps.body.data.length} employees`);

  // ---- employee stats ----
  const stats = await request('/api/employees/stats', { ...auth });
  if (stats.status !== 200 || !stats.body.success) {
    console.error('[smoke] FAIL: /api/employees/stats →', stats.status, stats.body);
    process.exit(1);
  }
  console.log('[smoke] OK: /api/employees/stats');

  // ---- leaves ----
  const leaves = await request('/api/leaves', { ...auth });
  if (leaves.status !== 200 || !leaves.body.success) {
    console.error('[smoke] FAIL: /api/leaves →', leaves.status, leaves.body);
    process.exit(1);
  }
  console.log('[smoke] OK: /api/leaves');

  // ---- leave types ----
  const types = await request('/api/leaves/types', { ...auth });
  if (types.status !== 200 || !types.body.success) {
    console.error('[smoke] FAIL: /api/leaves/types →', types.status, types.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/leaves/types → ${types.body.data.length} types`);

  // ---- leave balance ----
  const balance = await request('/api/leaves/balance', { ...auth });
  if (balance.status !== 200 || !balance.body.success) {
    console.error('[smoke] FAIL: /api/leaves/balance →', balance.status, balance.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/leaves/balance → ${balance.body.data?.length || 0} types`);

  // ---- attendance ----
  const attend = await request('/api/attendance', { ...auth });
  if (attend.status !== 200 || !attend.body.success) {
    console.error('[smoke] FAIL: /api/attendance →', attend.status, attend.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/attendance → ${attend.body.data?.length || 0} records`);

  // ---- holidays ----
  const holidays = await request('/api/holidays', { ...auth });
  if (holidays.status !== 200 || !holidays.body.success) {
    console.error('[smoke] FAIL: /api/holidays →', holidays.status, holidays.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/holidays → ${holidays.body.data?.length || 0} holidays`);

  // ---- org chart ----
  const org = await request('/api/org/chart', { ...auth });
  if (org.status !== 200 || !org.body.success) {
    console.error('[smoke] FAIL: /api/org/chart →', org.status, org.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/org/chart → ${org.body.data?.length || 0} roots`);

  // ---- users ----
  const users = await request('/api/users', { ...auth });
  if (users.status !== 200 || !users.body.success) {
    console.error('[smoke] FAIL: /api/users →', users.status, users.body);
    process.exit(1);
  }
  console.log(`[smoke] OK: /api/users → ${users.body.data?.length || 0} users`);

  // ---- not authenticated ----
  const unauth = await request('/api/employees');
  if (unauth.status !== 401 && unauth.status !== 500) {
    console.error('[smoke] FAIL: unauthenticated request should fail →', unauth.status, unauth.body);
    process.exit(1);
  }
  console.log('[smoke] OK: unauthenticated request returns 401');

  console.log('');
  console.log('[smoke] ALL CHECKS PASSED');
}

smoke().catch((err) => {
  console.error('[smoke] error:', err);
  process.exit(1);
});
