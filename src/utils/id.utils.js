const { randomBytes, randomUUID } = require('crypto');

function generateBookingId() {
  if (typeof randomUUID === 'function') {
    return `bk_${randomUUID()}`;
  }

  const timestampPart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `bk_${timestampPart}_${randomPart}`;
}

function generateUserId() {
  if (typeof randomUUID === 'function') {
    return `usr_${randomUUID()}`;
  }

  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateSessionToken() {
  return `ses_${randomBytes(32).toString('hex')}`;
}

module.exports = {
  generateBookingId,
  generateSessionToken,
  generateUserId,
};
