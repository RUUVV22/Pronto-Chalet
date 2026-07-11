const { timingSafeEqual, scrypt } = require('crypto');
const { promisify } = require('util');

const { generateSessionToken } = require('./id.utils');

const scryptAsync = promisify(scrypt);

async function hashPassword(password, salt = null) {
  const passwordSalt = salt || generateSessionToken().replace('ses_', '');
  const derivedKey = await scryptAsync(String(password), passwordSalt, 64);

  return {
    salt: passwordSalt,
    hash: derivedKey.toString('hex'),
  };
}

async function verifyPassword(password, salt, expectedHash) {
  const { hash } = await hashPassword(password, salt);
  const receivedBuffer = Buffer.from(hash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
