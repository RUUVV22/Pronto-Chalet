const assert = require('assert');
const fs = require('fs/promises');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin12345!';
const UPDATED_PASSWORD = 'Admin12345!New';
const SECOND_USERNAME = 'assistant';
const SECOND_PASSWORD = 'Assistant123!';
const BOOKING_DATE = '2099-02-10';
const USERS_FILE = path.resolve(__dirname, '..', 'data', 'auth', 'users.json');
const SESSIONS_FILE = path.resolve(__dirname, '..', 'data', 'auth', 'sessions.json');

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return '';
  }

  const match = setCookieHeader.match(/chalet_session=([^;]+)/);
  return match ? `chalet_session=${match[1]}` : '';
}

async function request(path, options = {}, cookie = '') {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });

  const payload = await response.json();
  const setCookie = response.headers.get('set-cookie');

  return {
    cookie: extractCookie(setCookie),
    payload,
    response,
  };
}

async function run() {
  const originalUsers = await fs.readFile(USERS_FILE, 'utf8');
  const originalSessions = await fs.readFile(SESSIONS_FILE, 'utf8');

  try {
    await fs.writeFile(USERS_FILE, '[]\n', 'utf8');
    await fs.writeFile(SESSIONS_FILE, '[]\n', 'utf8');

    const status = await request('/api/auth/status');
    assert.strictEqual(status.response.status, 200);
    assert.strictEqual(status.payload.needsSetup, true);

    const setup = await request('/api/auth/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        confirmPassword: ADMIN_PASSWORD,
      }),
    });

    assert.strictEqual(setup.response.status, 201);
    assert.ok(setup.cookie);

    const sessionCookie = setup.cookie;
    const me = await request('/api/auth/me', {}, sessionCookie);
    assert.strictEqual(me.response.status, 200);
    assert.strictEqual(me.payload.data.username, ADMIN_USERNAME);

    const createAccount = await request(
      '/api/auth/create-account',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: SECOND_USERNAME,
          password: SECOND_PASSWORD,
          confirmPassword: SECOND_PASSWORD,
        }),
      },
      sessionCookie
    );

    assert.strictEqual(createAccount.response.status, 201);

    const changePassword = await request(
      '/api/auth/change-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: ADMIN_PASSWORD,
          newPassword: UPDATED_PASSWORD,
          confirmPassword: UPDATED_PASSWORD,
        }),
      },
      sessionCookie
    );

    assert.strictEqual(changePassword.response.status, 200);

    const logout = await request('/api/auth/logout', { method: 'POST' }, sessionCookie);
    assert.strictEqual(logout.response.status, 200);

    const relogin = await request('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: UPDATED_PASSWORD,
      }),
    });

    assert.strictEqual(relogin.response.status, 200);
    const reloginCookie = relogin.cookie;

    const createBooking = await request(
      '/api/bookings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: 'Smoke Test Guest',
          phoneNumber: '0700000004',
          bookingDate: BOOKING_DATE,
          bookingPeriod: 'morning',
          bookingType: 'graduationParty',
          depositAmount: 40,
          notes: 'Auth smoke test',
          status: 'confirmed',
        }),
      },
      reloginCookie
    );

    assert.strictEqual(createBooking.response.status, 201);

    const conflictBooking = await request(
      '/api/bookings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: 'Overlap Guest',
          phoneNumber: '0700000005',
          bookingDate: BOOKING_DATE,
          bookingPeriod: 'morning',
          bookingType: 'normal',
          depositAmount: 10,
          notes: '',
          status: 'pending',
        }),
      },
      reloginCookie
    );

    assert.strictEqual(conflictBooking.response.status, 409);

    const bookingId = createBooking.payload.data.id;
    const deleteBooking = await request(
      `/api/bookings/${bookingId}`,
      { method: 'DELETE' },
      reloginCookie
    );

    assert.strictEqual(deleteBooking.response.status, 200);

    console.log(
      JSON.stringify(
        {
          setup: status.payload.needsSetup,
          accountCreated: true,
          passwordChanged: true,
          relogin: true,
          bookingConflictRejected: true,
        },
        null,
        2
      )
    );
  } finally {
    await fs.writeFile(USERS_FILE, originalUsers, 'utf8');
    await fs.writeFile(SESSIONS_FILE, originalSessions, 'utf8');
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
