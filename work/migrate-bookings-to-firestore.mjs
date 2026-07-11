import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const firebaseConfig = {
  apiKey: 'AIzaSyDjmBwQn2i5S94g7lB5guDAfH9Wn8AhDlo',
  projectId: 'prontochalet-f75b6',
};

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const apiKey = process.env.FIREBASE_API_KEY || firebaseConfig.apiKey;
const email = process.env.FIREBASE_EMAIL;
const password = process.env.FIREBASE_PASSWORD;
const databaseId = '(default)';
const bookingsPath = path.resolve('data', 'bookings.json');

if (!email || !password) {
  console.error(
    'Set FIREBASE_EMAIL and FIREBASE_PASSWORD for an admin account before running this script.'
  );
  process.exit(1);
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Number.isInteger(value)) {
    return { integerValue: String(value) };
  }

  if (typeof value === 'number') {
    return { doubleValue: value };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  return { stringValue: String(value) };
}

function toTimestampValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? { timestampValue: new Date().toISOString() }
    : { timestampValue: date.toISOString() };
}

function toFirestoreFields(booking) {
  const bookingPrice = Number.isInteger(Number(booking.bookingPrice))
    ? Number(booking.bookingPrice)
    : 0;
  const depositAmount = Number.isInteger(Number(booking.depositAmount))
    ? Number(booking.depositAmount)
    : 0;

  return {
    bookingDate: toFirestoreValue(booking.bookingDate || booking.startDate || booking.endDate || ''),
    bookingPeriod: toFirestoreValue(booking.bookingPeriod === 'evening' ? 'evening' : 'morning'),
    bookingPrice: toFirestoreValue(bookingPrice),
    bookingType: toFirestoreValue(booking.bookingType || 'normal'),
    createdAt: toTimestampValue(booking.createdAt),
    depositAmount: toFirestoreValue(depositAmount),
    guestName: toFirestoreValue(booking.guestName || ''),
    notes: toFirestoreValue(booking.notes || ''),
    phoneNumber: toFirestoreValue(booking.phoneNumber || ''),
    remainingAmount: toFirestoreValue(
      Number.isInteger(Number(booking.remainingAmount))
        ? Number(booking.remainingAmount)
        : Math.max(bookingPrice - depositAmount, 0)
    ),
    status: toFirestoreValue(booking.status || 'pending'),
    updatedAt: toTimestampValue(booking.updatedAt || booking.createdAt),
  };
}

async function signIn() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Firebase sign-in failed.');
  }

  return payload.idToken;
}

async function commitChunk(idToken, bookings) {
  const writes = bookings.map((booking) => {
    const documentId = String(booking.id || randomUUID()).replace(/[/?#]/g, '-');

    return {
      update: {
        name: `projects/${projectId}/databases/${databaseId}/documents/bookings/${documentId}`,
        fields: toFirestoreFields(booking),
      },
    };
  });

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:commit`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes }),
    }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Firestore commit failed.');
  }
}

const rawBookings = await fs.readFile(bookingsPath, 'utf8');
const bookings = JSON.parse(rawBookings);

if (!Array.isArray(bookings)) {
  throw new Error('data/bookings.json must contain an array.');
}

const idToken = await signIn();

for (let index = 0; index < bookings.length; index += 450) {
  await commitChunk(idToken, bookings.slice(index, index + 450));
}

console.log(`Migrated ${bookings.length} bookings to Firestore.`);
