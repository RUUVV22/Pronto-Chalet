function padNumber(value) {
  return String(value).padStart(2, '0');
}

function getTodayDateString(referenceDate = new Date()) {
  return [
    referenceDate.getFullYear(),
    padNumber(referenceDate.getMonth() + 1),
    padNumber(referenceDate.getDate()),
  ].join('-');
}

function parseDateString(dateString) {
  if (typeof dateString !== 'string') {
    return null;
  }

  const trimmedDateString = dateString.trim();
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = trimmedDateString.match(datePattern);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return trimmedDateString;
}

function compareDateStrings(leftDate, rightDate) {
  if (leftDate === rightDate) {
    return 0;
  }

  return leftDate < rightDate ? -1 : 1;
}

function isPastDate(dateString, referenceDate = getTodayDateString()) {
  return compareDateStrings(dateString, referenceDate) < 0;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

function isActiveBookingStatus(status) {
  return status === 'confirmed' || status === 'pending';
}

module.exports = {
  compareDateStrings,
  getTodayDateString,
  isActiveBookingStatus,
  isPastDate,
  parseDateString,
  rangesOverlap,
};
