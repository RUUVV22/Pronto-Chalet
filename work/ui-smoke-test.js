const assert = require('assert');

async function run() {
  const response = await fetch('http://localhost:3000/');
  const html = await response.text();

  assert.strictEqual(response.status, 200);
  assert.ok(html.includes('lang="ar"'));
  assert.ok(html.includes('dir="rtl"'));
  assert.ok(html.includes('تسجيل الدخول'));
  assert.ok(html.includes('إدارة الحساب'));
  assert.ok(html.includes('حجز صباحي'));
  assert.ok(html.includes('حجز مسائي'));
  assert.ok(html.includes('الرعبون'));

  const cssResponse = await fetch('http://localhost:3000/css/styles.css');
  const css = await cssResponse.text();

  assert.strictEqual(cssResponse.status, 200);
  assert.ok(css.includes('@media (max-width: 860px)'));
  assert.ok(css.includes('.dashboard-grid'));
  assert.ok(css.includes('.segmented-field'));
  assert.ok(css.includes('.price-summary'));

  console.log(
    JSON.stringify(
      {
        arabicHtml: true,
        responsiveCss: true,
        newBookingFields: true,
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
