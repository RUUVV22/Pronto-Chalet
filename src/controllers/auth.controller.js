const asyncHandler = require('../utils/async-handler');
const {
  AUTH_COOKIE_NAME,
  buildAuthCookie,
  buildClearedAuthCookie,
  parseCookies,
} = require('../utils/cookie.utils');
const authService = require('../services/auth.service');

function readTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[AUTH_COOKIE_NAME] || '';
}

function attachAuthCookie(res, session) {
  res.setHeader('Set-Cookie', buildAuthCookie(session.token, session.expiresAt));
}

const getStatus = asyncHandler(async (req, res) => {
  const token = readTokenFromRequest(req);
  const status = await authService.getStatus(token);
  res.status(200).json(status);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    data: req.auth.user,
  });
});

const setupInitialAdmin = asyncHandler(async (req, res) => {
  const result = await authService.setupInitialAdmin(req.body);
  attachAuthCookie(res, result.session);

  res.status(201).json({
    message: 'تم إنشاء أول حساب إداري بنجاح.',
    data: result.user,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  attachAuthCookie(res, result.session);

  res.status(200).json({
    message: 'تم تسجيل الدخول بنجاح.',
    data: result.user,
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = readTokenFromRequest(req);
  await authService.logout(token);
  res.setHeader('Set-Cookie', buildClearedAuthCookie());

  res.status(200).json({
    message: 'تم تسجيل الخروج بنجاح.',
  });
});

const createAccount = asyncHandler(async (req, res) => {
  const token = readTokenFromRequest(req);
  const account = await authService.createAccount(token, req.body);

  res.status(201).json({
    message: 'تم إنشاء الحساب بنجاح.',
    data: account,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const token = readTokenFromRequest(req);
  await authService.changePassword(token, req.body);

  res.status(200).json({
    message: 'تم تغيير كلمة المرور بنجاح.',
  });
});

module.exports = {
  changePassword,
  createAccount,
  getCurrentUser,
  getStatus,
  login,
  logout,
  setupInitialAdmin,
};
