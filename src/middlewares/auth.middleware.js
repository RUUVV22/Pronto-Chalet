const { UnauthorizedError } = require('../utils/app-error');
const { AUTH_COOKIE_NAME, buildClearedAuthCookie, parseCookies } = require('../utils/cookie.utils');
const authService = require('../services/auth.service');

async function requireAuth(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[AUTH_COOKIE_NAME];
    const context = await authService.findSessionContext(token);

    if (!context) {
      res.setHeader('Set-Cookie', buildClearedAuthCookie());
      throw new UnauthorizedError('يجب تسجيل الدخول أولًا.');
    }

    req.auth = context;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
};
