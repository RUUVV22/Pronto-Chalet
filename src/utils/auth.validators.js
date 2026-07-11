const { ValidationError } = require('./app-error');

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;
const MAX_FIELD_LENGTH = 80;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function validateUsername(value, errors, fieldName = 'username') {
  const username = normalizeText(value);

  if (!username) {
    errors[fieldName] = 'اسم المستخدم مطلوب.';
    return '';
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    errors[fieldName] = `يجب أن يكون اسم المستخدم بطول ${MIN_USERNAME_LENGTH} أحرف على الأقل.`;
    return '';
  }

  if (username.length > MAX_FIELD_LENGTH) {
    errors[fieldName] = `يجب ألا يزيد اسم المستخدم عن ${MAX_FIELD_LENGTH} حرفًا.`;
    return '';
  }

  return username;
}

function validatePassword(value, errors, fieldName = 'password') {
  const password = normalizeText(value);

  if (!password) {
    errors[fieldName] = 'كلمة المرور مطلوبة.';
    return '';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors[fieldName] = `يجب أن تكون كلمة المرور بطول ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`;
    return '';
  }

  if (password.length > MAX_FIELD_LENGTH) {
    errors[fieldName] = `يجب ألا تزيد كلمة المرور عن ${MAX_FIELD_LENGTH} حرفًا.`;
    return '';
  }

  return password;
}

function validatePasswordRequiredOnly(value, errors, fieldName = 'password') {
  const password = normalizeText(value);

  if (!password) {
    errors[fieldName] = 'كلمة المرور مطلوبة.';
    return '';
  }

  if (password.length > MAX_FIELD_LENGTH) {
    errors[fieldName] = `يجب ألا تزيد كلمة المرور عن ${MAX_FIELD_LENGTH} حرفًا.`;
    return '';
  }

  return password;
}

function validateConfirmPassword(value, password, errors, fieldName = 'confirmPassword') {
  const confirmPassword = normalizeText(value);

  if (!confirmPassword) {
    errors[fieldName] = 'تأكيد كلمة المرور مطلوب.';
    return '';
  }

  if (confirmPassword !== password) {
    errors[fieldName] = 'كلمتا المرور غير متطابقتين.';
    return '';
  }

  return confirmPassword;
}

function validateSetupPayload(payload) {
  const errors = {};
  const username = validateUsername(payload.username, errors);
  const password = validatePassword(payload.password, errors);
  validateConfirmPassword(payload.confirmPassword, password, errors);

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('فشل التحقق من بيانات إنشاء الحساب.', errors);
  }

  return { username, password };
}

function validateLoginPayload(payload) {
  const errors = {};
  const username = validateUsername(payload.username, errors);
  const password = validatePasswordRequiredOnly(payload.password, errors);

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('فشل التحقق من بيانات تسجيل الدخول.', errors);
  }

  return { username, password };
}

function validateCreateAccountPayload(payload) {
  const errors = {};
  const username = validateUsername(payload.username, errors);
  const password = validatePassword(payload.password, errors);
  validateConfirmPassword(payload.confirmPassword, password, errors);

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('فشل التحقق من بيانات إنشاء الحساب.', errors);
  }

  return { username, password };
}

function validateChangePasswordPayload(payload) {
  const errors = {};
  const currentPassword = validatePasswordRequiredOnly(payload.currentPassword, errors, 'currentPassword');
  const newPassword = validatePassword(payload.newPassword, errors, 'newPassword');
  validateConfirmPassword(payload.confirmPassword, newPassword, errors, 'confirmPassword');

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('فشل التحقق من بيانات تغيير كلمة المرور.', errors);
  }

  return { currentPassword, newPassword };
}

module.exports = {
  validateChangePasswordPayload,
  validateCreateAccountPayload,
  validateLoginPayload,
  validateSetupPayload,
};
