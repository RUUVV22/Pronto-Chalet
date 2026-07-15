const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const publicRoutes = require('./routes/public.routes');
const { requireAuth } = require('./middlewares/auth.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const publicDirectory = path.resolve(__dirname, '..', 'public');
const indexFilePath = path.join(publicDirectory, 'index.html');
const availabilityFilePath = path.join(publicDirectory, 'availability.html');

// Parse JSON request bodies before the API routes run.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend assets from the public directory.
app.use(express.static(publicDirectory));

// Public read-only routes expose only safe availability status.
app.use('/api/public', publicRoutes);

app.get(['/availability', '/availability/'], (req, res) => {
  res.sendFile(availabilityFilePath);
});

// Public authentication routes handle first-time setup and sign-in.
app.use('/api/auth', authRoutes);

// Mount the booking API.
app.use('/api/bookings', requireAuth, bookingsRoutes);

// Return a helpful JSON response when a client asks for an unknown API route.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'تعذر العثور على نقطة نهاية API.' });
});

// Serve the dashboard for any non-API route so the app still opens cleanly.
app.get('*', (req, res) => {
  res.sendFile(indexFilePath);
});

// Centralized error handling keeps responses consistent across the app.
app.use(errorMiddleware);

module.exports = app;
