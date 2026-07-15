const asyncHandler = require('../utils/async-handler');
const bookingsService = require('../services/bookings.service');

const listAvailability = asyncHandler(async (req, res) => {
  const availability = await bookingsService.listPublicAvailability();
  res.status(200).json({ data: availability });
});

module.exports = {
  listAvailability,
};
