const asyncHandler = require('../utils/async-handler');
const bookingsService = require('../services/bookings.service');

const listBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingsService.listBookings(req.query.search);
  res.status(200).json({ data: bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingsService.getBookingById(req.params.id);
  res.status(200).json({ data: booking });
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.createBooking(req.body);
  res.status(201).json({
    message: 'تم إنشاء الحجز بنجاح.',
    data: booking,
  });
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.updateBooking(req.params.id, req.body);
  res.status(200).json({
    message: 'تم تحديث الحجز بنجاح.',
    data: booking,
  });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const deletedBooking = await bookingsService.deleteBooking(req.params.id);
  res.status(200).json({
    message: 'تم حذف الحجز بنجاح.',
    data: deletedBooking,
  });
});

module.exports = {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
};
