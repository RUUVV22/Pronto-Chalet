const assert = require('assert');

const service = require('../src/services/bookings.service');

async function run() {
  const created = await service.createBooking({
    guestName: 'Update Test',
    phoneNumber: '0700000006',
    bookingDate: '2099-03-10',
    bookingPeriod: 'morning',
    bookingType: 'normal',
    depositAmount: 20,
    notes: 'Before update',
    status: 'pending',
  });

  const updated = await service.updateBooking(created.id, {
    guestName: 'Update Test Changed',
    phoneNumber: '0700000006',
    bookingDate: '2099-03-10',
    bookingPeriod: 'evening',
    bookingType: 'wedding',
    depositAmount: 30,
    notes: 'After update',
    status: 'confirmed',
  });

  assert.strictEqual(updated.id, created.id);
  assert.strictEqual(updated.createdAt, created.createdAt);
  assert.strictEqual(updated.guestName, 'Update Test Changed');
  assert.strictEqual(updated.status, 'confirmed');
  assert.strictEqual(updated.bookingPrice, 120);
  assert.strictEqual(updated.remainingAmount, 90);

  await service.deleteBooking(created.id);

  console.log(
    JSON.stringify(
      {
        updatePreservesId: true,
        updatePreservesCreatedAt: true,
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
