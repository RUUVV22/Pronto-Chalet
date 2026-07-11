const express = require('express');

const bookingsController = require('../controllers/bookings.controller');

const router = express.Router();

router.get('/', bookingsController.listBookings);
router.get('/:id', bookingsController.getBookingById);
router.post('/', bookingsController.createBooking);
router.put('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);

module.exports = router;
