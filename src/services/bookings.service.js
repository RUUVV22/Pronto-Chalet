const { ConflictError, NotFoundError } = require('../utils/app-error');
const {
  BOOKING_PERIOD_ORDER,
  BOOKING_TYPE_VALUES,
} = require('../utils/booking.constants');
const { compareDateStrings, isActiveBookingStatus } = require('../utils/date.utils');
const { generateBookingId } = require('../utils/id.utils');
const { validateBookingPayload } = require('../utils/booking.validators');
const {
  readBookings,
  writeBookings,
  withWriteLock,
} = require('./bookings.repository');

function normalizeBookingRecord(booking) {
  const bookingDate = String(
    booking.bookingDate || booking.startDate || booking.endDate || ''
  ).trim();
  const bookingPeriod = booking.bookingPeriod === 'evening' ? 'evening' : 'morning';
  const bookingType = BOOKING_TYPE_VALUES.has(booking.bookingType)
    ? booking.bookingType
    : 'normal';
  const bookingPrice = Number.isInteger(booking.bookingPrice) && booking.bookingPrice >= 0
    ? booking.bookingPrice
    : 0;
  const depositAmount = Number.isInteger(booking.depositAmount) && booking.depositAmount >= 0
    ? booking.depositAmount
    : 0;
  const remainingAmount =
    Number.isInteger(booking.remainingAmount) && booking.remainingAmount >= 0
      ? booking.remainingAmount
      : Math.max(bookingPrice - depositAmount, 0);
  const status = ['confirmed', 'pending', 'cancelled'].includes(booking.status)
    ? booking.status
    : 'pending';

  return {
    ...booking,
    bookingDate,
    bookingPeriod,
    bookingPrice,
    bookingType,
    depositAmount,
    guestName: String(booking.guestName || '').trim(),
    guestCount: Number.isInteger(Number(booking.guestCount)) && Number(booking.guestCount) > 0
      ? Number(booking.guestCount)
      : 0,
    notes: String(booking.notes || '').trim(),
    phoneNumber: String(booking.phoneNumber || '').trim(),
    remainingAmount,
    status,
  };
}

function sortBookings(bookings) {
  return bookings.slice().sort((leftBooking, rightBooking) => {
    const dateComparison = compareDateStrings(leftBooking.bookingDate, rightBooking.bookingDate);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const leftPeriodIndex = BOOKING_PERIOD_ORDER.indexOf(leftBooking.bookingPeriod);
    const rightPeriodIndex = BOOKING_PERIOD_ORDER.indexOf(rightBooking.bookingPeriod);

    if (leftPeriodIndex !== rightPeriodIndex) {
      return leftPeriodIndex - rightPeriodIndex;
    }

    const createdComparison = String(leftBooking.createdAt || '').localeCompare(
      String(rightBooking.createdAt || '')
    );

    if (createdComparison !== 0) {
      return createdComparison;
    }

    return String(leftBooking.id).localeCompare(String(rightBooking.id));
  });
}

function filterBookingsByGuestName(bookings, searchTerm) {
  const normalizedSearch = String(searchTerm || '').trim().toLowerCase();

  if (!normalizedSearch) {
    return bookings;
  }

  return bookings.filter((booking) =>
    String(booking.guestName || '').toLowerCase().includes(normalizedSearch)
  );
}

function toPublicAvailabilitySlot(booking) {
  return {
    bookingDate: booking.bookingDate,
    bookingPeriod: booking.bookingPeriod,
    status: 'booked',
  };
}

function assertBookingDoesNotOverlap(bookings, candidateBooking, currentBookingId = null) {
  if (!isActiveBookingStatus(candidateBooking.status)) {
    return;
  }

  // A chalet slot is reserved only when the same day and the same period are active.
  const overlappingBooking = bookings.find((booking) => {
    if (booking.id === currentBookingId) {
      return false;
    }

    if (!isActiveBookingStatus(booking.status)) {
      return false;
    }

    return (
      booking.bookingDate === candidateBooking.bookingDate &&
      booking.bookingPeriod === candidateBooking.bookingPeriod
    );
  });

  if (overlappingBooking) {
    throw new ConflictError(
      `الفترة المختارة محجوزة بالفعل للضيف ${overlappingBooking.guestName}.`,
      {
        conflictBookingId: overlappingBooking.id,
      }
    );
  }
}

async function listBookings(searchTerm = '') {
  const bookings = (await readBookings()).map(normalizeBookingRecord);
  const filteredBookings = filterBookingsByGuestName(bookings, searchTerm);
  return sortBookings(filteredBookings);
}

async function listPublicAvailability() {
  const bookings = (await readBookings()).map(normalizeBookingRecord);
  return sortBookings(bookings)
    .filter((booking) => isActiveBookingStatus(booking.status) && booking.bookingDate)
    .map(toPublicAvailabilitySlot);
}

async function getBookingById(bookingId) {
  const bookings = (await readBookings()).map(normalizeBookingRecord);
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) {
    throw new NotFoundError('لم يتم العثور على الحجز.');
  }

  return booking;
}

async function createBooking(payload) {
  const normalizedPayload = validateBookingPayload(payload);

  return withWriteLock(async () => {
    // Read the latest file snapshot inside the lock so concurrent admins cannot overwrite each other.
    const bookings = (await readBookings()).map(normalizeBookingRecord);

    assertBookingDoesNotOverlap(bookings, normalizedPayload);

    const booking = {
      id: generateBookingId(),
      bookingDate: normalizedPayload.bookingDate,
      bookingPeriod: normalizedPayload.bookingPeriod,
      bookingPrice: normalizedPayload.bookingPrice,
      bookingType: normalizedPayload.bookingType,
      createdAt: new Date().toISOString(),
      depositAmount: normalizedPayload.depositAmount,
      guestName: normalizedPayload.guestName,
      guestCount: normalizedPayload.guestCount,
      notes: normalizedPayload.notes,
      phoneNumber: normalizedPayload.phoneNumber,
      remainingAmount: normalizedPayload.remainingAmount,
      status: normalizedPayload.status,
    };

    bookings.push(booking);
    await writeBookings(bookings);

    return booking;
  });
}

async function updateBooking(bookingId, payload) {
  return withWriteLock(async () => {
    const bookings = (await readBookings()).map(normalizeBookingRecord);
    const bookingIndex = bookings.findIndex((booking) => booking.id === bookingId);

    if (bookingIndex === -1) {
      throw new NotFoundError('لم يتم العثور على الحجز.');
    }

    const currentBooking = bookings[bookingIndex];
    // Merge first, then validate the final record so partial edits still obey every rule.
    const mergedBooking = {
      ...currentBooking,
      ...payload,
      id: currentBooking.id,
      createdAt: currentBooking.createdAt,
    };
    const normalizedBooking = validateBookingPayload(mergedBooking);
    const updatedBooking = {
      ...currentBooking,
      ...normalizedBooking,
      id: currentBooking.id,
      createdAt: currentBooking.createdAt,
    };

    assertBookingDoesNotOverlap(bookings, updatedBooking, bookingId);

    bookings[bookingIndex] = updatedBooking;
    await writeBookings(bookings);

    return updatedBooking;
  });
}

async function deleteBooking(bookingId) {
  return withWriteLock(async () => {
    const bookings = (await readBookings()).map(normalizeBookingRecord);
    const bookingIndex = bookings.findIndex((booking) => booking.id === bookingId);

    if (bookingIndex === -1) {
      throw new NotFoundError('لم يتم العثور على الحجز.');
    }

    const [deletedBooking] = bookings.splice(bookingIndex, 1);
    await writeBookings(bookings);

    return deletedBooking;
  });
}

module.exports = {
  createBooking,
  deleteBooking,
  getBookingById,
  listBookings,
  listPublicAvailability,
  updateBooking,
};
