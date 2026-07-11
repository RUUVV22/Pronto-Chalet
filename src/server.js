const app = require('./app');
const { ensureDatabaseFile } = require('./services/bookings.repository');
const { ensureAuthStorage } = require('./services/auth.repository');

const requestedPort = Number(process.env.PORT) || 3000;
const maxPortAttempts = process.env.PORT ? 1 : 10;

function listenOnPort(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);

    server.once('listening', () => resolve(server));
    server.once('error', reject);
  });
}

async function listenWithRetry(startingPort) {
  let port = startingPort;

  for (let attempt = 0; attempt < maxPortAttempts; attempt += 1) {
    try {
      return await listenOnPort(port);
    } catch (error) {
      const canRetry = error.code === 'EADDRINUSE' && attempt < maxPortAttempts - 1;

      if (!canRetry) {
        throw error;
      }

      console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
      port += 1;
    }
  }

  throw new Error('No available port found.');
}

async function startServer() {
  // Make sure the JSON database exists before the first request arrives.
  await Promise.all([ensureDatabaseFile(), ensureAuthStorage()]);

  const server = await listenWithRetry(requestedPort);
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : requestedPort;

  console.log(`Chalet booking system running on http://localhost:${activePort}`);
}

startServer().catch((error) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});
