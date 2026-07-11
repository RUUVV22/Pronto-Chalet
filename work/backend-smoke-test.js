const service = require('../src/services/bookings.service');

async function run() {
  const before = await service.listBookings();

  const booking = await service.createBooking({
    guestName: 'Test Guest',
    phoneNumber: '0700000001',
    bookingDate: '2099-01-10',
    bookingPeriod: 'morning',
    bookingType: 'normal',
    depositAmount: 25,
    notes: '',
    status: 'pending',
  });

  const eveningBooking = await service.createBooking({
    guestName: 'Evening Test Guest',
    phoneNumber: '0700000002',
    bookingDate: '2099-01-10',
    bookingPeriod: 'evening',
    bookingType: 'wedding',
    depositAmount: 30,
    notes: '',
    status: 'confirmed',
  });

  let conflictDetected = false;

  try {
    await service.createBooking({
      guestName: 'Overlap Guest',
      phoneNumber: '0700000003',
      bookingDate: '2099-01-10',
      bookingPeriod: 'morning',
      bookingType: 'hennaParty',
      depositAmount: 20,
      notes: '',
      status: 'confirmed',
    });
  } catch (error) {
    conflictDetected = error && error.statusCode === 409;
  }

  const fetchedBooking = await service.getBookingById(booking.id);
  await service.deleteBooking(booking.id);
  await service.deleteBooking(eveningBooking.id);
  const after = await service.listBookings();

  console.log(
    JSON.stringify(
      {
        beforeCount: before.length,
        created: fetchedBooking.id === booking.id,
        eveningSlotAllowed: Boolean(eveningBooking.id),
        conflictDetected,
        afterCount: after.length,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
