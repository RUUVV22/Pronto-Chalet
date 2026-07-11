const fs = require('fs/promises');
const path = require('path');

const { DatabaseError } = require('../utils/app-error');

const authDirectory = path.resolve(__dirname, '..', '..', 'data', 'auth');
const usersFilePath = path.join(authDirectory, 'users.json');
const sessionsFilePath = path.join(authDirectory, 'sessions.json');

let usersWriteQueue = Promise.resolve();
let sessionsWriteQueue = Promise.resolve();

async function ensureArrayFile(filePath) {
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function ensureAuthStorage() {
  try {
    await fs.mkdir(authDirectory, { recursive: true });
    await Promise.all([ensureArrayFile(usersFilePath), ensureArrayFile(sessionsFilePath)]);
  } catch (error) {
    throw new DatabaseError('تعذر تجهيز تخزين بيانات تسجيل الدخول.', error);
  }
}

async function readArrayFile(filePath, errorMessage) {
  await ensureAuthStorage();

  try {
    const rawContent = await fs.readFile(filePath, 'utf8');

    if (!rawContent.trim()) {
      return [];
    }

    const parsedContent = JSON.parse(rawContent);

    if (!Array.isArray(parsedContent)) {
      throw new Error('يجب أن يحتوي الملف على مصفوفة.');
    }

    return parsedContent;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DatabaseError(`${errorMessage} يحتوي على JSON غير صالح.`, error);
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(errorMessage, error);
  }
}

async function writeArrayFile(filePath, items, errorMessage) {
  await ensureAuthStorage();

  if (!Array.isArray(items)) {
    throw new DatabaseError('يجب حفظ البيانات على شكل مصفوفة.', null);
  }

  const temporaryFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    const serializedContent = `${JSON.stringify(items, null, 2)}\n`;
    await fs.writeFile(temporaryFilePath, serializedContent, 'utf8');
    await fs.rename(temporaryFilePath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryFilePath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.warn('تعذر حذف ملف مؤقت لبيانات تسجيل الدخول:', cleanupError);
      }
    }

    throw new DatabaseError(errorMessage, error);
  }
}

async function readUsers() {
  return readArrayFile(usersFilePath, 'تعذر قراءة ملف المستخدمين.');
}

async function readSessions() {
  return readArrayFile(sessionsFilePath, 'تعذر قراءة ملف الجلسات.');
}

async function writeUsers(users) {
  return writeArrayFile(usersFilePath, users, 'تعذر حفظ ملف المستخدمين.');
}

async function writeSessions(sessions) {
  return writeArrayFile(sessionsFilePath, sessions, 'تعذر حفظ ملف الجلسات.');
}

function withUsersWriteLock(operation) {
  const queuedOperation = usersWriteQueue.then(() => operation());
  usersWriteQueue = queuedOperation.then(
    () => undefined,
    () => undefined
  );
  return queuedOperation;
}

function withSessionsWriteLock(operation) {
  const queuedOperation = sessionsWriteQueue.then(() => operation());
  sessionsWriteQueue = queuedOperation.then(
    () => undefined,
    () => undefined
  );
  return queuedOperation;
}

module.exports = {
  ensureAuthStorage,
  readSessions,
  readUsers,
  withSessionsWriteLock,
  withUsersWriteLock,
  writeSessions,
  writeUsers,
};
