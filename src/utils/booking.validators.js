const { ValidationError } = require('./app-error');
const {
  BOOKING_PERIOD_VALUES,
  BOOKING_TYPE_VALUES,
} = require('./booking.constants');
const {
  getTodayDateString,
  isPastDate,
  parseDateString,
} = require('./date.utils');

const allowedStatuses = new Set(['confirmed', 'pending', 'cancelled']);
const phoneNumberPattern = /^07\d{8}$/;

function normalizeTextField(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function normalizeStatusField(value) {
  if (value === undefined || value === null || value === '') {
    return 'pending';
  }

  return String(value).trim().toLowerCase();
}

function normalizeBookingPeriodField(value) {
  const bookingPeriod = normalizeTextField(value);

  if (!bookingPeriod) {
    return '';
  }

  return BOOKING_PERIOD_VALUES.has(bookingPeriod) ? bookingPeriod : '';
}

function normalizeBookingTypeField(value) {
  const bookingType = normalizeTextField(value);

  if (!bookingType) {
    return '';
  }

  return BOOKING_TYPE_VALUES.has(bookingType) ? bookingType : '';
}

function normalizeAmountField(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function normalizePositiveIntegerField(value, defaultValue = null) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function validateBookingPayload(payload) {
  const errors = {};
  const guestName = normalizeTextField(payload.guestName);
  const guestCount = normalizePositiveIntegerField(payload.guestCount ?? payload.guests, null);
  const phoneNumber = normalizeTextField(payload.phoneNumber);
  const bookingDate = parseDateString(
    payload.bookingDate ?? payload.startDate ?? payload.endDate
  );
  const bookingPeriod = normalizeBookingPeriodField(
    payload.bookingPeriod ?? payload.timeSlot ?? payload.session
  );
  const bookingType = normalizeBookingTypeField(
    payload.bookingType ?? payload.purpose ?? payload.type
  );
  const bookingPrice = normalizeAmountField(payload.bookingPrice ?? payload.price, null);
  const depositAmount = normalizeAmountField(
    payload.depositAmount ?? payload.raboon ?? payload.deposit,
    0
  );
  const notes = normalizeTextField(payload.notes);
  const status = normalizeStatusField(payload.status);

  if (!guestName) {
    errors.guestName = 'اسم الضيف مطلوب.';
  }

  if (guestCount === null) {
    errors.guestCount = 'يجب إدخال عدد الضيوف كرقم صحيح أكبر من صفر.';
  }

  if (!phoneNumber) {
    errors.phoneNumber = 'رقم الهاتف مطلوب.';
  } else if (!/^\d+$/.test(phoneNumber)) {
    errors.phoneNumber = 'رقم الهاتف يجب أن يحتوي على أرقام فقط.';
  } else if (!phoneNumberPattern.test(phoneNumber)) {
    errors.phoneNumber = 'رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 07.';
  }

  if (!bookingDate) {
    errors.bookingDate = 'يجب أن يكون تاريخ الحجز بصيغة YYYY-MM-DD.';
  }

  if (!bookingPeriod) {
    errors.bookingPeriod = 'يجب اختيار الفترة: حجز صباحي أو حجز مسائي.';
  }

  if (!bookingType) {
    errors.bookingType = 'يجب اختيار نوع الحجز.';
  }

  if (bookingPrice === null) {
    errors.bookingPrice = 'يجب إدخال قيمة الحجز كرقم صحيح أكبر من أو يساوي صفرًا.';
  }

  if (depositAmount === null) {
    errors.depositAmount = 'يجب أن يكون الرعبون رقمًا صحيحًا أكبر من أو يساوي صفرًا.';
  }

  if (!allowedStatuses.has(status)) {
    errors.status = 'يجب أن تكون الحالة مؤكد أو قيد الانتظار أو ملغي.';
  }

  const today = getTodayDateString();

  // Calendar-day bookings cannot be saved for dates in the past.
  if (bookingDate && isPastDate(bookingDate, today)) {
    errors.bookingDate = 'لا يمكن الحجز لتواريخ سابقة.';
  }

  if (bookingPrice !== null && depositAmount !== null && depositAmount > bookingPrice) {
    errors.depositAmount = 'الرعبون لا يمكن أن يتجاوز قيمة الحجز.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('فشل التحقق من بيانات الحجز.', errors);
  }

  return {
    bookingDate,
    bookingPeriod,
    bookingPrice,
    bookingType,
    depositAmount,
    guestName,
    guestCount,
    notes,
    phoneNumber,
    remainingAmount: bookingPrice - depositAmount,
    status,
  };
}

module.exports = {
  validateBookingPayload,
};
