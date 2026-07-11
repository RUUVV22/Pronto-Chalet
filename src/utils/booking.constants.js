const BOOKING_PERIODS = {
  morning: {
    label: 'حجز صباحي',
    price: 140,
  },
  evening: {
    label: 'حجز مسائي',
    price: 120,
  },
};

const BOOKING_TYPES = {
  normal: 'عادي',
  graduationParty: 'حجز حفلة تتوجيهي',
  hennaParty: 'حجز حفل حناء',
  engagementParty: 'حجز حفل خطبة',
  wedding: 'حجز عرس',
};

const BOOKING_PERIOD_ORDER = ['morning', 'evening'];
const BOOKING_PERIOD_VALUES = new Set(Object.keys(BOOKING_PERIODS));
const BOOKING_TYPE_VALUES = new Set(Object.keys(BOOKING_TYPES));

function getBookingPeriodLabel(period) {
  return BOOKING_PERIODS[period]?.label || BOOKING_PERIODS.morning.label;
}

function getBookingPeriodPrice(period) {
  return BOOKING_PERIODS[period]?.price ?? BOOKING_PERIODS.morning.price;
}

function getBookingTypeLabel(type) {
  return BOOKING_TYPES[type] || BOOKING_TYPES.normal;
}

function getBookingPeriodOptions() {
  return Object.entries(BOOKING_PERIODS).map(([value, meta]) => ({
    label: meta.label,
    price: meta.price,
    value,
  }));
}

function getBookingTypeOptions() {
  return Object.entries(BOOKING_TYPES).map(([value, label]) => ({
    label,
    value,
  }));
}

module.exports = {
  BOOKING_PERIOD_ORDER,
  BOOKING_PERIOD_VALUES,
  BOOKING_PERIODS,
  BOOKING_TYPE_VALUES,
  BOOKING_TYPES,
  getBookingPeriodLabel,
  getBookingPeriodOptions,
  getBookingPeriodPrice,
  getBookingTypeLabel,
  getBookingTypeOptions,
};
