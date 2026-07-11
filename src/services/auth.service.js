const { ConflictError, UnauthorizedError } = require('../utils/app-error');
const {
  generateSessionToken,
  generateUserId,
} = require('../utils/id.utils');
const {
  hashPassword,
  verifyPassword,
} = require('../utils/password.utils');
const {
  validateChangePasswordPayload,
  validateCreateAccountPayload,
  validateLoginPayload,
  validateSetupPayload,
} = require('../utils/auth.validators');
const {
  readSessions,
  readUsers,
  withSessionsWriteLock,
  withUsersWriteLock,
  writeSessions,
  writeUsers,
} = require('./auth.repository');

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function nowIso() {
  return new Date().toISOString();
}

function normalizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isSessionActive(session) {
  return new Date(session.expiresAt).getTime() > Date.now();
}

async function findSessionContext(token) {
  if (!token) {
    return null;
  }

  const sessions = await readSessions();
  const session = sessions.find((item) => item.token === token && isSessionActive(item));

  if (!session) {
    return null;
  }

  const users = await readUsers();
  const user = users.find((item) => item.id === session.userId);

  if (!user) {
    return null;
  }

  return {
    session,
    user: normalizeUser(user),
  };
}

async function createSessionForUser(userId) {
  return withSessionsWriteLock(async () => {
    const sessions = await readSessions();
    const createdAt = nowIso();
    const session = {
      token: generateSessionToken(),
      userId,
      createdAt,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    sessions.push(session);
    await writeSessions(sessions);

    return session;
  });
}

async function getStatus(token) {
  const users = await readUsers();

  if (users.length === 0) {
    return {
      authenticated: false,
      needsSetup: true,
      user: null,
    };
  }

  const context = await findSessionContext(token);

  if (context) {
    return {
      authenticated: true,
      needsSetup: false,
      user: context.user,
    };
  }

  return {
    authenticated: false,
    needsSetup: false,
    user: null,
  };
}

async function setupInitialAdmin(payload) {
  const normalizedPayload = validateSetupPayload(payload);

  const user = await withUsersWriteLock(async () => {
    const users = await readUsers();

    if (users.length > 0) {
      throw new ConflictError('تم إعداد الحساب الإداري مسبقًا.');
    }

    const passwordRecord = await hashPassword(normalizedPayload.password);
    const adminUser = {
      id: generateUserId(),
      username: normalizedPayload.username,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    users.push(adminUser);
    await writeUsers(users);

    return normalizeUser(adminUser);
  });

  const session = await createSessionForUser(user.id);

  return {
    session,
    user,
  };
}

async function login(payload) {
  const normalizedPayload = validateLoginPayload(payload);
  const users = await readUsers();
  const user = users.find(
    (item) => item.username.toLowerCase() === normalizedPayload.username.toLowerCase()
  );

  if (!user) {
    throw new UnauthorizedError('اسم المستخدم أو كلمة المرور غير صحيحة.');
  }

  const passwordIsValid = await verifyPassword(
    normalizedPayload.password,
    user.passwordSalt,
    user.passwordHash
  );

  if (!passwordIsValid) {
    throw new UnauthorizedError('اسم المستخدم أو كلمة المرور غير صحيحة.');
  }

  const session = await createSessionForUser(user.id);

  return {
    session,
    user: normalizeUser(user),
  };
}

async function logout(token) {
  if (!token) {
    return;
  }

  await withSessionsWriteLock(async () => {
    const sessions = await readSessions();
    const updatedSessions = sessions.filter((session) => session.token !== token);
    await writeSessions(updatedSessions);
  });
}

async function createAccount(token, payload) {
  const context = await findSessionContext(token);

  if (!context) {
    throw new UnauthorizedError('يجب تسجيل الدخول أولًا.');
  }

  const normalizedPayload = validateCreateAccountPayload(payload);

  return withUsersWriteLock(async () => {
    const users = await readUsers();

    const existingUser = users.find(
      (user) => user.username.toLowerCase() === normalizedPayload.username.toLowerCase()
    );

    if (existingUser) {
      throw new ConflictError('اسم المستخدم مستخدم بالفعل.');
    }

    const passwordRecord = await hashPassword(normalizedPayload.password);
    const account = {
      id: generateUserId(),
      username: normalizedPayload.username,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    users.push(account);
    await writeUsers(users);

    return normalizeUser(account);
  });
}

async function changePassword(token, payload) {
  const context = await findSessionContext(token);

  if (!context) {
    throw new UnauthorizedError('يجب تسجيل الدخول أولًا.');
  }

  const normalizedPayload = validateChangePasswordPayload(payload);

  const updatedUser = await withUsersWriteLock(async () => {
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === context.user.id);

    if (userIndex === -1) {
      throw new UnauthorizedError('لم يعد الحساب متاحًا.');
    }

    const user = users[userIndex];
    const passwordIsValid = await verifyPassword(
      normalizedPayload.currentPassword,
      user.passwordSalt,
      user.passwordHash
    );

    if (!passwordIsValid) {
      throw new UnauthorizedError('كلمة المرور الحالية غير صحيحة.');
    }

    const passwordRecord = await hashPassword(normalizedPayload.newPassword);
    users[userIndex] = {
      ...user,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      updatedAt: nowIso(),
    };

    await writeUsers(users);
    return normalizeUser(users[userIndex]);
  });

  await withSessionsWriteLock(async () => {
    const sessions = await readSessions();
    const updatedSessions = sessions.filter(
      (session) => session.userId !== updatedUser.id || session.token === token
    );

    await writeSessions(updatedSessions);
  });

  return updatedUser;
}

module.exports = {
  changePassword,
  createAccount,
  findSessionContext,
  getStatus,
  login,
  logout,
  setupInitialAdmin,
};
