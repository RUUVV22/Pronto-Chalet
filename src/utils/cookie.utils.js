const AUTH_COOKIE_NAME = 'chalet_session';

function parseCookies(cookieHeader = '') {
  if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) {
    return {};
  }

  return cookieHeader.split(';').reduce((accumulator, cookiePart) => {
    const [rawName, ...rawValueParts] = cookiePart.split('=');
    const name = rawName.trim();

    if (!name) {
      return accumulator;
    }

    const value = rawValueParts.join('=').trim();
    accumulator[name] = decodeURIComponent(value);
    return accumulator;
  }, {});
}

function buildCookieHeader(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  parts.push('Path=/');
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');

  if (options.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function buildAuthCookie(token, expiresAt) {
  return buildCookieHeader(AUTH_COOKIE_NAME, token, {
    expires: new Date(expiresAt),
  });
}

function buildClearedAuthCookie() {
  return buildCookieHeader(AUTH_COOKIE_NAME, '', {
    expires: new Date(0),
  });
}

module.exports = {
  AUTH_COOKIE_NAME,
  buildAuthCookie,
  buildClearedAuthCookie,
  buildCookieHeader,
  parseCookies,
};
