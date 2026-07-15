const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();

  assert.strictEqual(response.status, 200);
  assert.ok(html.includes('lang="ar"'));
  assert.ok(html.includes('dir="rtl"'));
  assert.ok(html.includes('تسجيل الدخول'));
  assert.ok(html.includes('إدارة الحساب'));
  assert.ok(html.includes('حجز صباحي'));
  assert.ok(html.includes('حجز مسائي'));
  assert.ok(html.includes('الرعبون'));
  assert.ok(html.includes('التقويم العام'));

  const availabilityResponse = await fetch(`${BASE_URL}/availability`);
  const availabilityHtml = await availabilityResponse.text();

  assert.strictEqual(availabilityResponse.status, 200);
  assert.ok(availabilityHtml.includes('تقويم توفر شاليه برونتو'));
  assert.ok(availabilityHtml.includes('availabilityGrid'));
  assert.ok(availabilityHtml.includes('public-availability-6'));
  assert.ok(availabilityHtml.includes('backgroundStage'));
  assert.ok(availabilityHtml.includes('gsap.min.js'));
  assert.ok(!availabilityHtml.includes('loginForm'));

  const cssResponse = await fetch(`${BASE_URL}/css/styles.css`);
  const css = await cssResponse.text();

  assert.strictEqual(cssResponse.status, 200);
  assert.ok(css.includes('@media (max-width: 860px)'));
  assert.ok(css.includes('.dashboard-grid'));
  assert.ok(css.includes('.segmented-field'));
  assert.ok(css.includes('.price-summary'));

  const availabilityCssResponse = await fetch(`${BASE_URL}/css/availability.css`);
  const availabilityCss = await availabilityCssResponse.text();

  assert.strictEqual(availabilityCssResponse.status, 200);
  assert.ok(availabilityCss.includes('.availability-grid'));
  assert.ok(availabilityCss.includes('.background-slide'));
  assert.ok(availabilityCss.includes('min-height: 75px'));
  assert.ok(availabilityCss.includes('width: min(1540px, calc(100% - 28px))'));
  assert.ok(availabilityCss.includes('.slot-pill'));
  assert.ok(availabilityCss.includes('.slot-copy'));

  const availabilityJsResponse = await fetch(`${BASE_URL}/js/availability.js`);
  const availabilityJs = await availabilityJsResponse.text();

  assert.strictEqual(availabilityJsResponse.status, 200);
  assert.ok(availabilityJs.includes('backgroundImages'));
  assert.ok(availabilityJs.includes('backgroundSlideInterval = 8200'));
  assert.ok(availabilityJs.includes('preloadBackgroundImages'));
  assert.ok(availabilityJs.includes('getCompactPeriodTimeRange'));
  assert.ok(availabilityJs.includes('chalet-bg-01.jpg'));
  assert.ok(availabilityJs.includes('10:00 صباحاً'));
  assert.ok(availabilityJs.includes('8:00 مساءً'));

  const backgroundResponse = await fetch(`${BASE_URL}/assets/chalet-backgrounds/chalet-bg-01.jpg`);

  assert.strictEqual(backgroundResponse.status, 200);

  console.log(
    JSON.stringify(
      {
        arabicHtml: true,
        responsiveCss: true,
        newBookingFields: true,
        publicAvailabilityPage: true,
        publicBackgroundAnimation: true,
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
