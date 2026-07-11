const fs = require('fs/promises');
const path = require('path');

const { DatabaseError } = require('../utils/app-error');

const dataDirectory = path.resolve(__dirname, '..', '..', 'data');
const databaseFilePath = path.join(dataDirectory, 'bookings.json');

let writeQueue = Promise.resolve();

async function ensureDatabaseFile() {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });

    try {
      await fs.access(databaseFilePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(databaseFilePath, '[]\n', 'utf8');
        return;
      }

      throw error;
    }
  } catch (error) {
    throw new DatabaseError('تعذر تجهيز قاعدة بيانات الحجوزات.', error);
  }
}

async function readBookings() {
  await ensureDatabaseFile();

  try {
    const rawContent = await fs.readFile(databaseFilePath, 'utf8');

    if (!rawContent.trim()) {
      return [];
    }

    const parsedContent = JSON.parse(rawContent);

    if (!Array.isArray(parsedContent)) {
      throw new Error('يجب أن تحتوي قاعدة بيانات الحجوزات على مصفوفة.');
    }

    return parsedContent;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new DatabaseError('تحتوي قاعدة بيانات الحجوزات على JSON غير صالح.', error);
    }

    throw new DatabaseError('تعذر قراءة قاعدة بيانات الحجوزات.', error);
  }
}

async function writeBookings(bookings) {
  await ensureDatabaseFile();

  if (!Array.isArray(bookings)) {
    throw new DatabaseError('يجب حفظ الحجوزات على شكل مصفوفة.');
  }

  const temporaryFilePath = `${databaseFilePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    const serializedBookings = `${JSON.stringify(bookings, null, 2)}\n`;

    // Write to a temporary file first so the main JSON file is replaced atomically.
    await fs.writeFile(temporaryFilePath, serializedBookings, 'utf8');
    await fs.rename(temporaryFilePath, databaseFilePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryFilePath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.warn('تعذر تنظيف ملف الحجوزات المؤقت:', cleanupError);
      }
    }

    throw new DatabaseError('تعذر الكتابة إلى قاعدة بيانات الحجوزات.', error);
  }
}

function withWriteLock(operation) {
  const queuedOperation = writeQueue.then(() => operation());
  writeQueue = queuedOperation.then(() => undefined, () => undefined);
  return queuedOperation;
}

module.exports = {
  databaseFilePath,
  ensureDatabaseFile,
  readBookings,
  writeBookings,
  withWriteLock,
};
