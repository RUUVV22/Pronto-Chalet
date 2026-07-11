const API_BASE = '/api/bookings';
const AUTH_BASE = '/api/auth';
const STATIC_STORAGE_KEY = 'pronto-chalet-static-store-v1';
const STATIC_SESSION_KEY = 'pronto-chalet-static-session-v1';
const ARABIC_LOCALE = 'ar-SA-u-ca-gregory';
const PHONE_NUMBER_MAX_LENGTH = 10;

const receiptInsuranceAmount = 30;
const receiptCleaningDeduction = 20;
const receiptLogoPath = 'assets/NoBackLogo.png';

const receiptPage = {
  canvasWidth: 1240,
  canvasHeight: 1754,
  pdfWidth: 595.28,
  pdfHeight: 841.89,
};

const weekdayLabels = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

const statusLabels = {
  confirmed: 'مؤكد',
  pending: 'قيد الانتظار',
  cancelled: 'ملغي',
};

const bookingPeriodLabels = {
  morning: 'حجز صباحي',
  evening: 'حجز مسائي',
};

const bookingPeriodPrices = {
  morning: 140,
  evening: 120,
};

const bookingPeriodTimes = {
  morning: {
    from: '10:00 صباحًا',
    to: '8:00 مساءً',
  },
  evening: {
    from: '8:00 مساءً',
    to: '2:00 صباحًا',
  },
};

const bookingPeriodOrder = ['morning', 'evening'];

const bookingTypeLabels = {
  normal: 'عادي',
  graduationParty: 'حجز حفلة توجيهي',
  hennaParty: 'حجز حفل حناء',
  engagementParty: 'حجز حفل خطبة',
  wedding: 'حجز عرس',
};

const state = {
  authenticated: false,
  bookings: [],
  currentMonth: startOfMonth(new Date()),
  editingBookingId: null,
  needsSetup: false,
  searchTerm: '',
  selectedDate: null,
  user: null,
};

// Cache DOM references once so the rest of the file can stay focused on state updates.
const elements = {
  authView: document.getElementById('authView'),
  setupPanel: document.getElementById('setupPanel'),
  loginPanel: document.getElementById('loginPanel'),
  setupForm: document.getElementById('setupForm'),
  setupUsername: document.getElementById('setupUsername'),
  setupPassword: document.getElementById('setupPassword'),
  setupConfirmPassword: document.getElementById('setupConfirmPassword'),
  setupMessage: document.getElementById('setupMessage'),
  loginForm: document.getElementById('loginForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  loginMessage: document.getElementById('loginMessage'),
  dashboardView: document.getElementById('dashboardView'),
  currentUserLabel: document.getElementById('currentUserLabel'),
  accountButton: document.getElementById('accountButton'),
  logoutButton: document.getElementById('logoutButton'),
  bookingForm: document.getElementById('bookingForm'),
  bookingId: document.getElementById('bookingId'),
  guestName: document.getElementById('guestName'),
  phoneNumber: document.getElementById('phoneNumber'),
  bookingDate: document.getElementById('bookingDate'),
  bookingPeriodRadios: document.querySelectorAll('input[name="bookingPeriod"]'),
  bookingType: document.getElementById('bookingType'),
  depositAmount: document.getElementById('depositAmount'),
  bookingPriceLabel: document.getElementById('bookingPriceLabel'),
  remainingAmountLabel: document.getElementById('remainingAmountLabel'),
  notes: document.getElementById('notes'),
  status: document.getElementById('status'),
  formHeading: document.getElementById('formHeading'),
  bookingMessage: document.getElementById('bookingMessage'),
  submitButton: document.getElementById('submitButton'),
  cancelEditButton: document.getElementById('cancelEditButton'),
  statTotal: document.getElementById('statTotal'),
  statConfirmed: document.getElementById('statConfirmed'),
  statPending: document.getElementById('statPending'),
  statCancelled: document.getElementById('statCancelled'),
  calendarTitle: document.getElementById('calendarTitle'),
  prevMonthButton: document.getElementById('prevMonthButton'),
  todayButton: document.getElementById('todayButton'),
  nextMonthButton: document.getElementById('nextMonthButton'),
  selectedDateDetails: document.getElementById('selectedDateDetails'),
  calendarGrid: document.getElementById('calendarGrid'),
  bookingsTableBody: document.getElementById('bookingsTableBody'),
  searchInput: document.getElementById('searchInput'),
  accountModal: document.getElementById('accountModal'),
  closeAccountModalButton: document.getElementById('closeAccountModalButton'),
  bookingConflictModal: document.getElementById('bookingConflictModal'),
  bookingConflictMessage: document.getElementById('bookingConflictMessage'),
  closeBookingConflictButton: document.getElementById('closeBookingConflictButton'),
  createAccountForm: document.getElementById('createAccountForm'),
  createUsername: document.getElementById('createUsername'),
  createPassword: document.getElementById('createPassword'),
  createConfirmPassword: document.getElementById('createConfirmPassword'),
  createAccountMessage: document.getElementById('createAccountMessage'),
  currentPassword: document.getElementById('currentPassword'),
  newPassword: document.getElementById('newPassword'),
  confirmNewPassword: document.getElementById('confirmNewPassword'),
  changePasswordForm: document.getElementById('changePasswordForm'),
  changePasswordMessage: document.getElementById('changePasswordMessage'),
};

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatNumber(value) {
  return new Intl.NumberFormat('ar-SA').format(value);
}

function formatPlainNumber(value) {
  return new Intl.NumberFormat('ar-SA', { useGrouping: false }).format(value);
}

function formatCurrency(value) {
  return `${formatNumber(Number(value) || 0)} دينار`;
}

function formatDateInput(date) {
  return [date.getFullYear(), padNumber(date.getMonth() + 1), padNumber(date.getDate())].join('-');
}

function parseDateInput(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateDisplay(dateString) {
  const date = parseDateInput(dateString);

  if (!date) {
    return 'تاريخ غير صالح';
  }

  return new Intl.DateTimeFormat(ARABIC_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatMonthTitle(date) {
  return `${formatPlainNumber(date.getMonth() + 1)} / ${formatPlainNumber(date.getFullYear())}`;
}

function getTodayString() {
  return formatDateInput(new Date());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getStatusLabel(status) {
  return statusLabels[status] || status;
}

function getBookingPeriodLabel(period) {
  return bookingPeriodLabels[period] || bookingPeriodLabels.morning;
}

function getBookingTypeLabel(type) {
  return bookingTypeLabels[type] || bookingTypeLabels.normal;
}

function getBookingDate(booking) {
  return booking.bookingDate || booking.startDate || booking.endDate || '';
}

function getBookingPeriod(booking) {
  return booking.bookingPeriod === 'evening' ? 'evening' : 'morning';
}

function getBookingPrice(booking) {
  const price = Number(booking.bookingPrice);
  return Number.isInteger(price) && price >= 0
    ? price
    : bookingPeriodPrices[getBookingPeriod(booking)];
}

function getDepositAmount(booking) {
  const deposit = Number(booking.depositAmount);
  return Number.isInteger(deposit) && deposit >= 0 ? deposit : 0;
}

function getRemainingAmount(booking) {
  const remaining = Number(booking.remainingAmount);
  return Number.isInteger(remaining) && remaining >= 0
    ? remaining
    : Math.max(getBookingPrice(booking) - getDepositAmount(booking), 0);
}

function formatReceiptNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    useGrouping: false,
  }).format(Number(value) || 0);
}

function formatReceiptShortDate(dateString) {
  const date = parseDateInput(dateString);

  if (!date) {
    return 'تاريخ غير صالح';
  }

  return `${formatReceiptNumber(date.getDate())}/${formatReceiptNumber(date.getMonth() + 1)}`;
}

function formatReceiptWeekday(dateString) {
  const date = parseDateInput(dateString);

  if (!date) {
    return 'غير محدد';
  }

  return new Intl.DateTimeFormat(ARABIC_LOCALE, { weekday: 'long' }).format(date);
}

function getReceiptTimes(booking) {
  return bookingPeriodTimes[getBookingPeriod(booking)] || bookingPeriodTimes.morning;
}

function buildReceiptLines(booking) {
  const bookingDate = getBookingDate(booking);
  const bookingPrice = getBookingPrice(booking);
  const depositAmount = getDepositAmount(booking);
  const remainingAmount = getRemainingAmount(booking);
  const receiptTimes = getReceiptTimes(booking);
  const depositLineText =
    depositAmount > 0
      ? `العربون: ${formatReceiptNumber(depositAmount)} دينارًا (تم الاستلام)`
      : `العربون: ${formatReceiptNumber(depositAmount)} دينارًا`;

  return [
    { text: 'السلام عليكم ورحمة الله وبركاته،', variant: 'title' },
    {
      text: 'تم تأكيد حجزكم في شالية برونتو – بيت راس وفق التفاصيل التالية:',
      variant: 'intro',
    },
    {
      text: `📅 التاريخ: ${formatReceiptWeekday(bookingDate)} ${formatReceiptShortDate(bookingDate)}`,
      variant: 'detail',
    },
    {
      text: `🕙 الوقت: من ${receiptTimes.from} حتى ${receiptTimes.to}`,
      variant: 'detail',
    },
    {
      text: `💰 قيمة الحجز: ${formatReceiptNumber(bookingPrice)} دينارًا`,
      variant: 'detail',
    },
    {
      text: depositLineText,
      variant: 'bullet',
    },
    {
      text: `المتبقي: ${formatReceiptNumber(remainingAmount)} دينارًا يُدفع عند استلام الشالية.`,
      variant: 'bullet',
    },
    {
      text: `تأمين مسترد: ${formatReceiptNumber(
        receiptInsuranceAmount
      )} دينارًا يُعاد عند المغادرة بعد التأكد من سلامة الشالية.`,
      variant: 'bullet',
    },
    { text: `اسم الحجز: ${booking.guestName || 'غير محدد'}`, variant: 'section' },
    { text: 'يرجى الالتزام بما يلي:', variant: 'section' },
    {
      text: `تسليم الشالية بالحالة نفسها من حيث النظافة، وإلا يتم خصم ${formatReceiptNumber(
        receiptCleaningDeduction
      )} دينارًا من مبلغ التأمين.`,
      variant: 'bullet',
    },
    {
      text: 'الالتزام بموعد الاستلام وموعد المغادرة.',
      variant: 'bullet',
    },
    {
      text: 'المحافظة على نظافة مياه المسبح وعدم رمي الطعام أو المخلفات داخل البركة.',
      variant: 'bullet',
    },
    {
      text: 'ملاحظة: في حال إلغاء الحجز لأي سبب، فإن العربون غير مسترد.',
      variant: 'note',
    },
    { text: 'نتمنى لكم قضاء وقت ممتع، ونرحب بكم دائمًا.', variant: 'closing' },
  ];
}

function drawRoundedRectangle(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function loadReceiptLogo() {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('Unable to load receipt logo.')), {
      once: true,
    });
    image.src = receiptLogoPath;
  });
}

function drawReceiptHeader(context, logo) {
  const centerX = receiptPage.canvasWidth / 2;
  const logoSize = 280;
  const logoY = 88;

  context.drawImage(logo, centerX - logoSize / 2, logoY, logoSize, logoSize);

  return logoY + logoSize;
}

function wrapCanvasText(context, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(nextLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [''];
}

function getReceiptTextStyle(variant, scale = 1) {
  const styles = {
    title: {
      weight: 700,
      size: 40,
      color: '#322312',
      lineHeight: 52,
      marginBottom: 18,
      align: 'center',
    },
    intro: {
      weight: 400,
      size: 29,
      color: '#2f2419',
      lineHeight: 40,
      marginBottom: 14,
      align: 'center',
    },
    detail: {
      weight: 700,
      size: 31,
      color: '#7b4f17',
      lineHeight: 42,
      marginBottom: 8,
      align: 'center',
    },
    section: {
      weight: 700,
      size: 31,
      color: '#5c3b12',
      lineHeight: 42,
      marginTop: 14,
      marginBottom: 10,
      align: 'center',
    },
    bullet: {
      weight: 400,
      size: 26,
      color: '#382719',
      lineHeight: 36,
      marginBottom: 8,
      align: 'center',
      prefix: '• ',
    },
    note: {
      weight: 700,
      size: 27,
      color: '#322312',
      lineHeight: 38,
      marginTop: 14,
      marginBottom: 10,
      align: 'center',
    },
    closing: {
      weight: 700,
      size: 31,
      color: '#322312',
      lineHeight: 42,
      marginTop: 8,
      marginBottom: 0,
      align: 'center',
    },
  };
  const style = styles[variant] || styles.intro;
  const size = Math.round(style.size * scale);
  const lineHeight = Math.round(style.lineHeight * scale);
  const marginTop = Math.round((style.marginTop || 0) * scale);
  const marginBottom = Math.round((style.marginBottom || 0) * scale);

  return {
    ...style,
    font: `${style.weight} ${size}px Tahoma, Arial, sans-serif`,
    lineHeight,
    marginTop,
    marginBottom,
  };
}

function getReceiptLineText(line, style) {
  return `${style.prefix || ''}${line.text}`;
}

function measureReceiptTextHeight(context, receiptLines, maxTextWidth, scale) {
  return receiptLines.reduce((height, line) => {
    const style = getReceiptTextStyle(line.variant, scale);
    context.font = style.font;
    const wrappedLines = wrapCanvasText(context, getReceiptLineText(line, style), maxTextWidth);

    return (
      height +
      style.marginTop +
      wrappedLines.length * style.lineHeight +
      style.marginBottom
    );
  }, 0);
}

function getReceiptTextScale(context, receiptLines, maxTextWidth, availableHeight) {
  let scale = 1;

  while (
    scale > 0.72 &&
    measureReceiptTextHeight(context, receiptLines, maxTextWidth, scale) > availableHeight
  ) {
    scale -= 0.04;
  }

  return scale;
}

function drawReceiptText(context, receiptLines, startY, maxY) {
  const centerX = receiptPage.canvasWidth / 2;
  const maxTextWidth = receiptPage.canvasWidth - 250;
  const availableHeight = maxY - startY;
  const scale = getReceiptTextScale(context, receiptLines, maxTextWidth, availableHeight);
  const textHeight = measureReceiptTextHeight(context, receiptLines, maxTextWidth, scale);
  let y = startY + Math.max((availableHeight - textHeight) / 2, 0);

  context.textBaseline = 'top';
  context.direction = 'rtl';

  receiptLines.forEach((line) => {
    const style = getReceiptTextStyle(line.variant, scale);
    context.font = style.font;
    context.fillStyle = style.color;
    context.textAlign = 'center';
    y += style.marginTop || 0;

    wrapCanvasText(context, getReceiptLineText(line, style), maxTextWidth).forEach((textLine) => {
      context.fillText(textLine, centerX, y);
      y += style.lineHeight;
    });

    y += style.marginBottom || 0;
  });
}

async function createBookingReceiptCanvas(booking) {
  const logo = await loadReceiptLogo();
  const canvas = document.createElement('canvas');
  canvas.width = receiptPage.canvasWidth;
  canvas.height = receiptPage.canvasHeight;

  const context = canvas.getContext('2d');

  // The PDF is generated from this canvas so Arabic text keeps correct RTL shaping.
  context.fillStyle = '#f8efe2';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#1f1710';
  drawRoundedRectangle(context, 54, 54, canvas.width - 108, canvas.height - 108, 40);
  context.fill();

  context.fillStyle = '#fff8ee';
  drawRoundedRectangle(context, 74, 74, canvas.width - 148, canvas.height - 148, 34);
  context.fill();

  context.strokeStyle = '#b8893b';
  context.lineWidth = 8;
  drawRoundedRectangle(context, 94, 94, canvas.width - 188, canvas.height - 188, 28);
  context.stroke();

  const headerBottom = drawReceiptHeader(context, logo);

  drawReceiptText(context, buildReceiptLines(booking), headerBottom + 34, canvas.height - 145);

  return canvas;
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function createPdfBlobFromJpeg(jpegBytes, imageWidth, imageHeight) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [];
  let byteOffset = 0;

  const addPart = (part) => {
    const bytes = typeof part === 'string' ? encoder.encode(part) : part;
    parts.push(bytes);
    byteOffset += bytes.length;
  };

  const addObject = (objectNumber, objectParts) => {
    offsets[objectNumber] = byteOffset;
    addPart(`${objectNumber} 0 obj\n`);
    objectParts.forEach(addPart);
    addPart('\nendobj\n');
  };

  const imageDrawCommand = `q\n${receiptPage.pdfWidth} 0 0 ${receiptPage.pdfHeight} 0 0 cm\n/ReceiptImage Do\nQ`;
  const imageDrawLength = encoder.encode(imageDrawCommand).length;

  // This small PDF writer embeds the canvas JPEG as one full-page image.
  addPart('%PDF-1.4\n');
  addObject(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  addObject(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  addObject(3, [
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${receiptPage.pdfWidth} ${receiptPage.pdfHeight}] `,
    '/Resources << /XObject << /ReceiptImage 4 0 R >> >> /Contents 5 0 R >>',
  ]);
  addObject(4, [
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} `,
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
    jpegBytes,
    '\nendstream',
  ]);
  addObject(5, [
    `<< /Length ${imageDrawLength} >>\nstream\n`,
    imageDrawCommand,
    '\nendstream',
  ]);

  const xrefOffset = byteOffset;
  addPart('xref\n0 6\n0000000000 65535 f \n');

  for (let objectNumber = 1; objectNumber <= 5; objectNumber += 1) {
    addPart(`${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`);
  }

  addPart(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: 'application/pdf' });
}

function sanitizeFileName(value) {
  return (
    String(value || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'booking'
  );
}

function downloadBlob(blob, fileName) {
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function downloadBookingPdf(booking) {
  const canvas = await createBookingReceiptCanvas(booking);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const jpegBytes = dataUrlToBytes(jpegDataUrl);
  const pdfBlob = createPdfBlobFromJpeg(jpegBytes, canvas.width, canvas.height);
  const bookingDate = sanitizeFileName(getBookingDate(booking));
  const guestName = sanitizeFileName(booking.guestName);

  downloadBlob(pdfBlob, `pronto-booking-${bookingDate}-${guestName}.pdf`);
}

function isActiveStatus(status) {
  return status === 'pending' || status === 'confirmed';
}

function findOverlappingBooking(candidateBooking, currentBookingId = null) {
  if (!candidateBooking || !isActiveStatus(candidateBooking.status)) {
    return null;
  }

  return state.bookings.find((booking) => {
    if (booking.id === currentBookingId) {
      return false;
    }

    return (
      isActiveStatus(booking.status) &&
      getBookingDate(booking) === candidateBooking.bookingDate &&
      getBookingPeriod(booking) === getBookingPeriod(candidateBooking)
    );
  });
}

function getBookingConflictMessage(conflictBooking = null) {
  const guestName = conflictBooking && conflictBooking.guestName
    ? ` للضيف ${conflictBooking.guestName}`
    : '';

  return `يوجد حجز في هذا الوقت بالفعل${guestName}. الرجاء اختيار وقت آخر.`;
}

function openBookingConflictModal(message) {
  elements.bookingConflictMessage.textContent = message;
  elements.bookingConflictModal.classList.remove('hidden');
  elements.bookingConflictModal.setAttribute('aria-hidden', 'false');
  elements.closeBookingConflictButton.focus();
}

function closeBookingConflictModal() {
  elements.bookingConflictModal.classList.add('hidden');
  elements.bookingConflictModal.setAttribute('aria-hidden', 'true');
}

function showBookingConflictModal(conflictBooking = null) {
  const message = getBookingConflictMessage(conflictBooking);
  setFormMessage(elements.bookingMessage, message, 'error');
  openBookingConflictModal(message);
}

function isDateInBooking(dateString, booking) {
  return isActiveStatus(booking.status) && getBookingDate(booking) === dateString;
}

function getBookingsForDate(dateString) {
  return state.bookings.filter((booking) => isDateInBooking(dateString, booking));
}

function getSelectedDateBookings() {
  if (!state.selectedDate) {
    return [];
  }

  return getBookingsForDate(state.selectedDate);
}

function setMessage(element, message, type = 'info') {
  element.textContent = message;
  element.dataset.type = type;
}

function clearMessage(element) {
  element.textContent = '';
  delete element.dataset.type;
}

function setFormMessage(element, message, type = 'info') {
  if (!message) {
    clearMessage(element);
    return;
  }

  setMessage(element, message, type);
}

function showView(viewName) {
  const dashboardVisible = viewName === 'dashboard';

  elements.authView.classList.toggle('hidden', dashboardVisible);
  elements.dashboardView.classList.toggle('hidden', !dashboardVisible);
}

function syncAuthPanels() {
  elements.setupPanel.classList.toggle('hidden', !state.needsSetup || state.authenticated);
  elements.loginPanel.classList.toggle('hidden', state.needsSetup || state.authenticated);
}

function renderCurrentUser() {
  if (!state.user) {
    elements.currentUserLabel.textContent = 'مرحبًا';
    return;
  }

  elements.currentUserLabel.textContent = `مرحبًا، ${state.user.username}`;
}

function renderStats() {
  const total = state.bookings.length;
  const confirmed = state.bookings.filter((booking) => booking.status === 'confirmed').length;
  const pending = state.bookings.filter((booking) => booking.status === 'pending').length;
  const cancelled = state.bookings.filter((booking) => booking.status === 'cancelled').length;

  elements.statTotal.textContent = formatNumber(total);
  elements.statConfirmed.textContent = formatNumber(confirmed);
  elements.statPending.textContent = formatNumber(pending);
  elements.statCancelled.textContent = formatNumber(cancelled);
}

function renderCalendar() {
  const monthStart = startOfMonth(state.currentMonth);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (monthStart.getDay() + 1) % 7;
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const todayString = getTodayString();
  const cells = [];

  elements.calendarTitle.textContent = formatMonthTitle(monthStart);

  weekdayLabels.forEach((weekday) => {
    cells.push(`<div class="calendar-weekday">${weekday}</div>`);
  });

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - firstDayIndex + 1;

    if (index < firstDayIndex || dayNumber > daysInMonth) {
      cells.push('<div class="calendar-day empty" aria-hidden="true"></div>');
      continue;
    }

    const dateString = formatDateInput(new Date(year, month, dayNumber));
    const bookings = getBookingsForDate(dateString);
    const dayClasses = ['calendar-day', bookings.length > 0 ? 'booked' : 'available'];

    if (bookings.length === bookingPeriodOrder.length) {
      dayClasses.push('full');
    }

    if (dateString === todayString) {
      dayClasses.push('today');
    }

    if (dateString === state.selectedDate) {
      dayClasses.push('selected');
    }

    const slotHtml = bookingPeriodOrder
      .map((period) => {
        const booking = bookings.find((item) => getBookingPeriod(item) === period);
        const label = getBookingPeriodLabel(period).replace('حجز ', '');

        if (!booking) {
          return `<span class="day-slot available-slot">${label}: متاح</span>`;
        }

        return `
          <span class="day-slot booked-slot">
            ${label}: ${escapeHtml(booking.guestName)}
          </span>
        `;
      })
      .join('');

    cells.push(`
      <button class="${dayClasses.join(' ')}" type="button" data-date="${dateString}">
        <span class="day-number">${formatNumber(dayNumber)}</span>
        <span class="day-status ${bookings.length ? 'confirmed' : 'available'}">
          ${bookings.length ? 'محجوز' : 'متاح'}
        </span>
        <span class="day-guest">${slotHtml}</span>
      </button>
    `);
  }

  elements.calendarGrid.innerHTML = cells.join('');
}

function renderSelectedDateDetails() {
  if (!state.selectedDate) {
    elements.selectedDateDetails.innerHTML = `
      <div class="date-details-empty">
        اختر تاريخًا من التقويم لعرض حجوزات الصباح والمساء.
      </div>
    `;
    return;
  }

  const bookings = getSelectedDateBookings();
  const selectedDateTitle = formatDateDisplay(state.selectedDate);
  const slotCards = bookingPeriodOrder
    .map((period) => {
      const booking = bookings.find((item) => getBookingPeriod(item) === period);
      const periodLabel = getBookingPeriodLabel(period);
      const defaultPrice = bookingPeriodPrices[period];

      if (!booking) {
        return `
          <article class="slot-detail available">
            <div>
              <strong>${periodLabel}</strong>
              <span>متاح للحجز</span>
            </div>
            <span class="slot-price">${formatCurrency(defaultPrice)}</span>
          </article>
        `;
      }

      return `
        <article class="slot-detail booked">
          <div class="slot-detail-header">
            <div>
              <strong>${periodLabel}</strong>
              <span>${getStatusLabel(booking.status)}</span>
            </div>
            <span class="status-pill ${booking.status}">${getStatusLabel(booking.status)}</span>
          </div>
          <dl>
            <div><dt>الضيف</dt><dd>${escapeHtml(booking.guestName)}</dd></div>
            <div><dt>الهاتف</dt><dd>${escapeHtml(booking.phoneNumber)}</dd></div>
            <div><dt>نوع الحجز</dt><dd>${getBookingTypeLabel(booking.bookingType)}</dd></div>
            <div><dt>قيمة الحجز</dt><dd>${formatCurrency(getBookingPrice(booking))}</dd></div>
            <div><dt>الرعبون</dt><dd>${formatCurrency(getDepositAmount(booking))}</dd></div>
            <div><dt>المتبقي</dt><dd>${formatCurrency(getRemainingAmount(booking))}</dd></div>
            <div><dt>ملاحظات</dt><dd>${escapeHtml(booking.notes || 'لا توجد ملاحظات')}</dd></div>
          </dl>
        </article>
      `;
    })
    .join('');

  elements.selectedDateDetails.innerHTML = `
    <div class="date-details-header">
      <div>
        <span>تفاصيل التاريخ</span>
        <strong>${selectedDateTitle}</strong>
      </div>
      <span class="date-details-count">${formatNumber(bookings.length)} من ${formatNumber(bookingPeriodOrder.length)} محجوز</span>
    </div>
    <div class="date-details-grid">${slotCards}</div>
  `;
}

function getFilteredBookings() {
  const searchTerm = state.searchTerm.trim().toLowerCase();
  const sortedBookings = state.bookings.slice().sort((leftBooking, rightBooking) => {
    const leftDate = getBookingDate(leftBooking);
    const rightDate = getBookingDate(rightBooking);

    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }

    const leftPeriodIndex = bookingPeriodOrder.indexOf(getBookingPeriod(leftBooking));
    const rightPeriodIndex = bookingPeriodOrder.indexOf(getBookingPeriod(rightBooking));

    if (leftPeriodIndex !== rightPeriodIndex) {
      return leftPeriodIndex - rightPeriodIndex;
    }

    return String(leftBooking.createdAt || '').localeCompare(String(rightBooking.createdAt || ''));
  });

  if (!searchTerm) {
    return sortedBookings;
  }

  return sortedBookings.filter((booking) =>
    String(booking.guestName || '').toLowerCase().includes(searchTerm)
  );
}

function renderTable() {
  const bookings = getFilteredBookings();

  if (bookings.length === 0) {
    elements.bookingsTableBody.innerHTML = `
      <tr>
        <td class="table-empty" colspan="8">لا توجد حجوزات مطابقة للبحث.</td>
      </tr>
    `;
    return;
  }

  elements.bookingsTableBody.innerHTML = bookings
    .map((booking) => {
      const notesPreview = booking.notes
        ? booking.notes.length > 72
          ? `${booking.notes.slice(0, 72)}...`
          : booking.notes
        : 'لا توجد ملاحظات';
      const bookingDate = getBookingDate(booking);
      const createdAt = booking.createdAt
        ? new Intl.DateTimeFormat(ARABIC_LOCALE, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(booking.createdAt))
        : 'غير معروف';

      return `
        <tr>
          <td>
            <div class="booking-meta">
              <strong>${escapeHtml(booking.guestName)}</strong>
              <span>${escapeHtml(booking.phoneNumber)}</span>
              <span>#${escapeHtml(booking.id.slice(0, 8))}</span>
            </div>
          </td>
          <td>
            <div class="booking-meta">
              <strong>${formatDateDisplay(bookingDate)}</strong>
              <span>${getBookingPeriodLabel(getBookingPeriod(booking))}</span>
            </div>
          </td>
          <td>${getBookingTypeLabel(booking.bookingType)}</td>
          <td>
            <div class="booking-meta">
              <strong>${formatCurrency(getBookingPrice(booking))}</strong>
              <span>رعبون: ${formatCurrency(getDepositAmount(booking))}</span>
              <span>متبقي: ${formatCurrency(getRemainingAmount(booking))}</span>
            </div>
          </td>
          <td><span class="status-pill ${booking.status}">${getStatusLabel(booking.status)}</span></td>
          <td><span class="notes-preview">${escapeHtml(notesPreview)}</span></td>
          <td>${createdAt}</td>
          <td>
            <div class="table-actions">
              <button class="row-button" type="button" data-action="edit" data-id="${booking.id}">
                تعديل
              </button>
              <button class="row-button" type="button" data-action="delete" data-id="${booking.id}">
                حذف
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderDashboard() {
  if (!state.authenticated) {
    return;
  }

  renderCurrentUser();
  renderStats();
  renderCalendar();
  renderSelectedDateDetails();
  renderTable();
}

function getSelectedBookingPeriod() {
  const selectedRadio = Array.from(elements.bookingPeriodRadios).find((radio) => radio.checked);
  return selectedRadio ? selectedRadio.value : 'morning';
}

function setSelectedBookingPeriod(period) {
  elements.bookingPeriodRadios.forEach((radio) => {
    radio.checked = radio.value === period;
  });
}

function getDepositInputValue() {
  const deposit = Number(elements.depositAmount.value || 0);
  return Number.isFinite(deposit) && deposit >= 0 ? deposit : 0;
}

function normalizePhoneNumberInput(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, PHONE_NUMBER_MAX_LENGTH);
}

function handlePhoneNumberInput(event) {
  event.target.value = normalizePhoneNumberInput(event.target.value);
}

function updatePriceSummary() {
  const bookingPeriod = getSelectedBookingPeriod();
  const bookingPrice = bookingPeriodPrices[bookingPeriod] || bookingPeriodPrices.morning;
  const deposit = getDepositInputValue();

  elements.depositAmount.max = String(bookingPrice);
  elements.bookingPriceLabel.textContent = formatCurrency(bookingPrice);
  elements.remainingAmountLabel.textContent = formatCurrency(Math.max(bookingPrice - deposit, 0));
}

function resetBookingForm() {
  state.editingBookingId = null;
  elements.bookingId.value = '';
  elements.bookingForm.reset();
  elements.status.value = 'pending';
  elements.bookingType.value = 'normal';
  elements.depositAmount.value = '0';
  setSelectedBookingPeriod('morning');
  elements.formHeading.textContent = 'إضافة حجز';
  elements.submitButton.textContent = 'حفظ الحجز';
  elements.cancelEditButton.classList.add('hidden');
  clearMessage(elements.bookingMessage);
  elements.bookingDate.min = getTodayString();
  updatePriceSummary();
}

function fillBookingForm(booking) {
  state.editingBookingId = booking.id;
  elements.bookingId.value = booking.id;
  elements.guestName.value = booking.guestName;
  elements.phoneNumber.value = normalizePhoneNumberInput(booking.phoneNumber);
  elements.bookingDate.value = getBookingDate(booking);
  elements.bookingType.value = booking.bookingType || 'normal';
  elements.depositAmount.value = String(getDepositAmount(booking));
  elements.notes.value = booking.notes || '';
  elements.status.value = booking.status;
  setSelectedBookingPeriod(getBookingPeriod(booking));
  updatePriceSummary();
  elements.formHeading.textContent = 'تعديل الحجز';
  elements.submitButton.textContent = 'تحديث الحجز';
  elements.cancelEditButton.classList.remove('hidden');
  setFormMessage(elements.bookingMessage, 'أنت الآن تقوم بتعديل هذا الحجز.', 'info');
  elements.bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleSessionExpired(message = 'انتهت الجلسة، سجّل الدخول مرة أخرى.') {
  state.authenticated = false;
  state.user = null;
  state.bookings = [];
  state.searchTerm = '';
  state.editingBookingId = null;
  state.needsSetup = false;
  closeAccountModal();
  resetBookingForm();
  elements.loginForm.reset();
  syncAuthPanels();
  showView('auth');
  setFormMessage(elements.loginMessage, message, 'error');
}

function isStaticOnlyHost() {
  return window.location.protocol === 'file:' || /\.github\.io$/i.test(window.location.hostname);
}

let useStaticApi = isStaticOnlyHost();
let staticMemoryStore = null;
let staticMemorySessionUserId = '';

function createApiError(message, status = 400, errors = null) {
  const error = new Error(message);
  error.status = status;
  error.data = { message };

  if (errors) {
    error.data.errors = errors;
  }

  return error;
}

function processApiError(error) {
  if (error.status === 401 && state.authenticated) {
    handleSessionExpired(error.message);
  }
}

function readStorageValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorageValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function removeStorageValue(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // The in-memory fallback is already updated by the caller.
  }
}

function normalizeStaticStore(store) {
  return {
    users: Array.isArray(store && store.users) ? store.users : [],
    bookings: Array.isArray(store && store.bookings) ? store.bookings : [],
  };
}

function readStaticStore() {
  if (staticMemoryStore) {
    return staticMemoryStore;
  }

  const storedValue = readStorageValue(STATIC_STORAGE_KEY);

  if (!storedValue) {
    staticMemoryStore = normalizeStaticStore(null);
    return staticMemoryStore;
  }

  try {
    staticMemoryStore = normalizeStaticStore(JSON.parse(storedValue));
  } catch (error) {
    staticMemoryStore = normalizeStaticStore(null);
  }

  return staticMemoryStore;
}

function writeStaticStore(store) {
  staticMemoryStore = normalizeStaticStore(store);
  writeStorageValue(STATIC_STORAGE_KEY, JSON.stringify(staticMemoryStore));
}

function getStaticSessionUserId() {
  return readStorageValue(STATIC_SESSION_KEY) || staticMemorySessionUserId;
}

function setStaticSessionUserId(userId) {
  staticMemorySessionUserId = userId || '';

  if (userId) {
    writeStorageValue(STATIC_SESSION_KEY, userId);
    return;
  }

  removeStorageValue(STATIC_SESSION_KEY);
}

function normalizeStaticText(value) {
  return String(value ?? '').trim();
}

function getStaticRequestBody(options) {
  if (!options.body) {
    return {};
  }

  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch (error) {
      return {};
    }
  }

  return options.body;
}

function createStaticId(prefix) {
  const randomId = window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function toPublicStaticUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function findStaticUserByUsername(store, username) {
  const normalizedUsername = username.toLowerCase();
  return store.users.find((user) => user.username.toLowerCase() === normalizedUsername);
}

function getStaticCurrentUser(store) {
  const userId = getStaticSessionUserId();
  return store.users.find((user) => user.id === userId) || null;
}

function requireStaticUser(store) {
  const user = getStaticCurrentUser(store);

  if (!user) {
    setStaticSessionUserId('');
    throw createApiError('يجب تسجيل الدخول أولًا.', 401);
  }

  return user;
}

function validateStaticUsername(value, errors, fieldName = 'username') {
  const username = normalizeStaticText(value);

  if (!username) {
    errors[fieldName] = 'اسم المستخدم مطلوب.';
    return '';
  }

  if (username.length < 3) {
    errors[fieldName] = 'يجب أن يكون اسم المستخدم بطول 3 أحرف على الأقل.';
    return '';
  }

  if (username.length > 80) {
    errors[fieldName] = 'يجب ألا يزيد اسم المستخدم عن 80 حرفًا.';
    return '';
  }

  return username;
}

function validateStaticPassword(value, errors, fieldName = 'password', minimumLength = 8) {
  const password = normalizeStaticText(value);

  if (!password) {
    errors[fieldName] = 'كلمة المرور مطلوبة.';
    return '';
  }

  if (password.length < minimumLength) {
    errors[fieldName] = `يجب أن تكون كلمة المرور بطول ${minimumLength} أحرف على الأقل.`;
    return '';
  }

  if (password.length > 80) {
    errors[fieldName] = 'يجب ألا تزيد كلمة المرور عن 80 حرفًا.';
    return '';
  }

  return password;
}

function validateStaticConfirmPassword(value, password, errors, fieldName = 'confirmPassword') {
  const confirmPassword = normalizeStaticText(value);

  if (!confirmPassword) {
    errors[fieldName] = 'تأكيد كلمة المرور مطلوب.';
    return '';
  }

  if (confirmPassword !== password) {
    errors[fieldName] = 'كلمتا المرور غير متطابقتين.';
    return '';
  }

  return confirmPassword;
}

function validateStaticSetupPayload(payload) {
  const errors = {};
  const username = validateStaticUsername(payload.username, errors);
  const password = validateStaticPassword(payload.password, errors);
  validateStaticConfirmPassword(payload.confirmPassword, password, errors);

  if (Object.keys(errors).length > 0) {
    throw createApiError('فشل التحقق من بيانات إنشاء الحساب.', 400, errors);
  }

  return { username, password };
}

function validateStaticLoginPayload(payload) {
  const errors = {};
  const username = validateStaticUsername(payload.username, errors);
  const password = validateStaticPassword(payload.password, errors, 'password', 1);

  if (Object.keys(errors).length > 0) {
    throw createApiError('فشل التحقق من بيانات تسجيل الدخول.', 400, errors);
  }

  return { username, password };
}

function validateStaticChangePasswordPayload(payload) {
  const errors = {};
  const currentPassword = validateStaticPassword(payload.currentPassword, errors, 'currentPassword', 1);
  const newPassword = validateStaticPassword(payload.newPassword, errors, 'newPassword');
  validateStaticConfirmPassword(payload.confirmPassword, newPassword, errors, 'confirmPassword');

  if (Object.keys(errors).length > 0) {
    throw createApiError('فشل التحقق من بيانات تغيير كلمة المرور.', 400, errors);
  }

  return { currentPassword, newPassword };
}

function validateStaticBookingPayload(payload) {
  const errors = {};
  const guestName = normalizeStaticText(payload.guestName);
  const phoneNumber = normalizeStaticText(payload.phoneNumber);
  const bookingDate = parseDateInput(payload.bookingDate) ? payload.bookingDate : '';
  const bookingPeriod = bookingPeriodPrices[payload.bookingPeriod] ? payload.bookingPeriod : '';
  const bookingType = bookingTypeLabels[payload.bookingType] ? payload.bookingType : '';
  const parsedDeposit = payload.depositAmount === '' || payload.depositAmount === undefined
    ? 0
    : Number(payload.depositAmount);
  const depositAmount = Number.isInteger(parsedDeposit) && parsedDeposit >= 0 ? parsedDeposit : null;
  const notes = normalizeStaticText(payload.notes);
  const status = ['confirmed', 'pending', 'cancelled'].includes(payload.status)
    ? payload.status
    : 'pending';

  if (!guestName) {
    errors.guestName = 'اسم الضيف مطلوب.';
  }

  if (!phoneNumber) {
    errors.phoneNumber = 'رقم الهاتف مطلوب.';
  } else if (!/^\d+$/.test(phoneNumber)) {
    errors.phoneNumber = 'رقم الهاتف يجب أن يحتوي على أرقام فقط.';
  } else if (!/^07\d{8}$/.test(phoneNumber)) {
    errors.phoneNumber = 'رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 07.';
  }

  if (!bookingDate) {
    errors.bookingDate = 'يجب أن يكون تاريخ الحجز بصيغة YYYY-MM-DD.';
  } else if (bookingDate < getTodayString()) {
    errors.bookingDate = 'لا يمكن الحجز لتواريخ سابقة.';
  }

  if (!bookingPeriod) {
    errors.bookingPeriod = 'يجب اختيار الفترة: حجز صباحي أو حجز مسائي.';
  }

  if (!bookingType) {
    errors.bookingType = 'يجب اختيار نوع الحجز.';
  }

  if (depositAmount === null) {
    errors.depositAmount = 'يجب أن يكون الرعبون رقمًا صحيحًا أكبر من أو يساوي صفرًا.';
  }

  const bookingPrice = bookingPeriod ? bookingPeriodPrices[bookingPeriod] : bookingPeriodPrices.morning;

  if (depositAmount !== null && depositAmount > bookingPrice) {
    errors.depositAmount = 'الرعبون لا يمكن أن يتجاوز قيمة الحجز.';
  }

  if (Object.keys(errors).length > 0) {
    throw createApiError('فشل التحقق من بيانات الحجز.', 400, errors);
  }

  return {
    bookingDate,
    bookingPeriod,
    bookingPrice,
    bookingType,
    depositAmount,
    guestName,
    notes,
    phoneNumber,
    remainingAmount: bookingPrice - depositAmount,
    status,
  };
}

function assertStaticBookingDoesNotOverlap(bookings, candidateBooking, currentBookingId = null) {
  if (!isActiveStatus(candidateBooking.status)) {
    return;
  }

  const overlappingBooking = bookings.find((booking) => {
    if (booking.id === currentBookingId || !isActiveStatus(booking.status)) {
      return false;
    }

    return (
      getBookingDate(booking) === candidateBooking.bookingDate &&
      getBookingPeriod(booking) === candidateBooking.bookingPeriod
    );
  });

  if (overlappingBooking) {
    throw createApiError(
      `الفترة المختارة محجوزة بالفعل للضيف ${overlappingBooking.guestName}.`,
      409,
      { conflictBookingId: overlappingBooking.id }
    );
  }
}

function getApiPath(url) {
  const parsedUrl = new URL(url, window.location.origin);
  return parsedUrl.pathname.replace(/\/$/, '');
}

async function staticApiRequest(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const path = getApiPath(url);
  const store = readStaticStore();
  const body = getStaticRequestBody(options);

  if (path === `${AUTH_BASE}/status` && method === 'GET') {
    const user = getStaticCurrentUser(store);

    return {
      authenticated: Boolean(user),
      needsSetup: store.users.length === 0,
      user: user ? toPublicStaticUser(user) : null,
    };
  }

  if (path === `${AUTH_BASE}/setup` && method === 'POST') {
    if (store.users.length > 0) {
      throw createApiError('تم إعداد الحساب الإداري مسبقًا.', 409);
    }

    const payload = validateStaticSetupPayload(body);
    const now = new Date().toISOString();
    const user = {
      id: createStaticId('usr'),
      username: payload.username,
      password: payload.password,
      createdAt: now,
      updatedAt: now,
    };

    store.users.push(user);
    writeStaticStore(store);
    setStaticSessionUserId(user.id);

    return {
      message: 'تم إنشاء أول حساب إداري بنجاح.',
      data: toPublicStaticUser(user),
    };
  }

  if (path === `${AUTH_BASE}/login` && method === 'POST') {
    const payload = validateStaticLoginPayload(body);
    const user = findStaticUserByUsername(store, payload.username);

    if (!user || user.password !== payload.password) {
      throw createApiError('اسم المستخدم أو كلمة المرور غير صحيحة.', 401);
    }

    setStaticSessionUserId(user.id);

    return {
      message: 'تم تسجيل الدخول بنجاح.',
      data: toPublicStaticUser(user),
    };
  }

  if (path === `${AUTH_BASE}/logout` && method === 'POST') {
    setStaticSessionUserId('');
    return { message: 'تم تسجيل الخروج بنجاح.' };
  }

  if (path === `${AUTH_BASE}/create-account` && method === 'POST') {
    requireStaticUser(store);
    const payload = validateStaticSetupPayload(body);

    if (findStaticUserByUsername(store, payload.username)) {
      throw createApiError('اسم المستخدم مستخدم بالفعل.', 409);
    }

    const now = new Date().toISOString();
    const user = {
      id: createStaticId('usr'),
      username: payload.username,
      password: payload.password,
      createdAt: now,
      updatedAt: now,
    };

    store.users.push(user);
    writeStaticStore(store);

    return {
      message: 'تم إنشاء الحساب بنجاح.',
      data: toPublicStaticUser(user),
    };
  }

  if (path === `${AUTH_BASE}/change-password` && method === 'POST') {
    const user = requireStaticUser(store);
    const payload = validateStaticChangePasswordPayload(body);

    if (user.password !== payload.currentPassword) {
      throw createApiError('كلمة المرور الحالية غير صحيحة.', 401);
    }

    user.password = payload.newPassword;
    user.updatedAt = new Date().toISOString();
    writeStaticStore(store);

    return { message: 'تم تغيير كلمة المرور بنجاح.' };
  }

  if (path === API_BASE && method === 'GET') {
    requireStaticUser(store);
    return { data: store.bookings };
  }

  if (path === API_BASE && method === 'POST') {
    requireStaticUser(store);
    const payload = validateStaticBookingPayload(body);
    assertStaticBookingDoesNotOverlap(store.bookings, payload);

    const booking = {
      id: createStaticId('bk'),
      ...payload,
      createdAt: new Date().toISOString(),
    };

    store.bookings.push(booking);
    writeStaticStore(store);

    return {
      message: 'تم إنشاء الحجز بنجاح.',
      data: booking,
    };
  }

  if (path.startsWith(`${API_BASE}/`)) {
    requireStaticUser(store);
    const bookingId = decodeURIComponent(path.slice(API_BASE.length + 1));
    const bookingIndex = store.bookings.findIndex((booking) => booking.id === bookingId);

    if (bookingIndex === -1) {
      throw createApiError('لم يتم العثور على الحجز.', 404);
    }

    if (method === 'PUT') {
      const currentBooking = store.bookings[bookingIndex];
      const payload = validateStaticBookingPayload({
        ...currentBooking,
        ...body,
      });
      const updatedBooking = {
        ...currentBooking,
        ...payload,
        id: currentBooking.id,
        createdAt: currentBooking.createdAt,
      };

      assertStaticBookingDoesNotOverlap(store.bookings, updatedBooking, bookingId);
      store.bookings[bookingIndex] = updatedBooking;
      writeStaticStore(store);

      return {
        message: 'تم تحديث الحجز بنجاح.',
        data: updatedBooking,
      };
    }

    if (method === 'DELETE') {
      const [deletedBooking] = store.bookings.splice(bookingIndex, 1);
      writeStaticStore(store);

      return {
        message: 'تم حذف الحجز بنجاح.',
        data: deletedBooking,
      };
    }
  }

  throw createApiError('تعذر العثور على نقطة نهاية API.', 404);
}

async function runStaticApiRequest(url, options = {}) {
  try {
    return await staticApiRequest(url, options);
  } catch (error) {
    processApiError(error);
    throw error;
  }
}

async function apiRequest(url, options = {}) {
  if (useStaticApi) {
    return runStaticApiRequest(url, options);
  }

  const requestOptions = {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  if (options.body && !requestOptions.headers['Content-Type']) {
    requestOptions.headers['Content-Type'] = 'application/json';
  }

  let response;

  try {
    response = await fetch(url, requestOptions);
  } catch (error) {
    useStaticApi = true;
    return runStaticApiRequest(url, options);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    if (response.status === 404 && !contentType.includes('application/json')) {
      useStaticApi = true;
      return runStaticApiRequest(url, options);
    }

    const error = new Error(payload.message || 'حدث خطأ غير متوقع.');
    error.status = response.status;
    error.data = payload;

    processApiError(error);

    throw error;
  }

  return payload;
}

async function loadAuthStatus() {
  try {
    const payload = await apiRequest(`${AUTH_BASE}/status`, { method: 'GET' });
    state.authenticated = Boolean(payload.authenticated);
    state.needsSetup = Boolean(payload.needsSetup);
    state.user = payload.user || null;

    syncAuthPanels();

    if (state.authenticated) {
      showView('dashboard');
      await loadBookings();
      return;
    }

    showView('auth');
    if (state.needsSetup) {
      setFormMessage(
        elements.setupMessage,
        'لم يتم العثور على حساب بعد. أنشئ الحساب الأول للبدء.',
        'info'
      );
      clearMessage(elements.loginMessage);
    } else {
      clearMessage(elements.setupMessage);
      setFormMessage(elements.loginMessage, 'سجّل الدخول للوصول إلى لوحة التحكم.', 'info');
    }
  } catch (error) {
    setFormMessage(elements.loginMessage, error.message, 'error');
    showView('auth');
  }
}

async function loadBookings() {
  if (!state.authenticated) {
    return;
  }

  elements.bookingsTableBody.innerHTML = `
    <tr>
      <td class="table-empty" colspan="8">جارٍ تحميل الحجوزات...</td>
    </tr>
  `;

  try {
    const payload = await apiRequest(API_BASE, { method: 'GET' });
    state.bookings = Array.isArray(payload.data) ? payload.data : [];
    renderDashboard();
  } catch (error) {
    if (error.status === 401) {
      return;
    }

    elements.bookingsTableBody.innerHTML = `
      <tr>
        <td class="table-empty" colspan="8">${escapeHtml(error.message)}</td>
      </tr>
    `;
  }
}

function buildBookingPayload() {
  return {
    guestName: elements.guestName.value.trim(),
    phoneNumber: normalizePhoneNumberInput(elements.phoneNumber.value),
    bookingDate: elements.bookingDate.value,
    bookingPeriod: getSelectedBookingPeriod(),
    bookingType: elements.bookingType.value,
    depositAmount: Number(elements.depositAmount.value || 0),
    notes: elements.notes.value.trim(),
    status: elements.status.value,
  };
}

function buildAuthPayload(usernameInput, passwordInput, confirmInput = null) {
  const payload = {
    username: usernameInput.value.trim(),
    password: passwordInput.value,
  };

  if (confirmInput) {
    payload.confirmPassword = confirmInput.value;
  }

  return payload;
}

async function submitSetupForm(event) {
  event.preventDefault();
  setFormMessage(elements.setupMessage, '');

  try {
    const payload = buildAuthPayload(
      elements.setupUsername,
      elements.setupPassword,
      elements.setupConfirmPassword
    );
    const result = await apiRequest(`${AUTH_BASE}/setup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    state.authenticated = true;
    state.needsSetup = false;
    state.user = result.data;
    syncAuthPanels();
    showView('dashboard');
    clearMessage(elements.setupMessage);
    elements.setupForm.reset();
    resetBookingForm();
    setFormMessage(elements.bookingMessage, result.message, 'success');
    await loadBookings();
  } catch (error) {
    const validationError = formatValidationErrors(error.data && error.data.errors);
    setFormMessage(elements.setupMessage, validationError || error.message, 'error');
  }
}

async function submitLoginForm(event) {
  event.preventDefault();
  setFormMessage(elements.loginMessage, '');

  try {
    const payload = buildAuthPayload(elements.loginUsername, elements.loginPassword);
    const result = await apiRequest(`${AUTH_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    state.authenticated = true;
    state.needsSetup = false;
    state.user = result.data;
    state.searchTerm = '';
    elements.loginForm.reset();
    clearMessage(elements.loginMessage);
    syncAuthPanels();
    showView('dashboard');
    resetBookingForm();
    await loadBookings();
  } catch (error) {
    const validationError = formatValidationErrors(error.data && error.data.errors);
    setFormMessage(elements.loginMessage, validationError || error.message, 'error');
  }
}

async function submitLogout() {
  try {
    await apiRequest(`${AUTH_BASE}/logout`, { method: 'POST' });
  } catch (error) {
    // Even if the token is already gone, we still return the UI to the login screen.
  } finally {
    state.authenticated = false;
    state.user = null;
    state.bookings = [];
    state.searchTerm = '';
    state.editingBookingId = null;
    state.needsSetup = false;
    closeAccountModal();
    resetBookingForm();
    elements.loginForm.reset();
    syncAuthPanels();
    showView('auth');
    setFormMessage(elements.loginMessage, 'تم تسجيل الخروج بنجاح.', 'success');
  }
}

async function submitBooking(event) {
  event.preventDefault();
  setFormMessage(elements.bookingMessage, '');

  const isEditing = Boolean(state.editingBookingId);
  const endpoint = isEditing ? `${API_BASE}/${state.editingBookingId}` : API_BASE;
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const payload = buildBookingPayload();
    const overlappingBooking = findOverlappingBooking(payload, state.editingBookingId);

    if (overlappingBooking) {
      showBookingConflictModal(overlappingBooking);
      return;
    }

    const result = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    let pdfDownloaded = false;

    if (result.data) {
      try {
        await downloadBookingPdf(result.data);
        pdfDownloaded = true;
      } catch (pdfError) {
        console.error('PDF download failed:', pdfError);
      }
    }

    resetBookingForm();
    setFormMessage(
      elements.bookingMessage,
      pdfDownloaded
        ? `${result.message} وتم تنزيل ملف PDF.`
        : `${result.message} لكن تعذر تنزيل ملف PDF.`,
      pdfDownloaded ? 'success' : 'info'
    );
    await loadBookings();
  } catch (error) {
    if (error.status === 409) {
      const conflictBookingId =
        error.data && error.data.errors ? error.data.errors.conflictBookingId : '';
      const conflictBooking = state.bookings.find((booking) => booking.id === conflictBookingId);
      showBookingConflictModal(conflictBooking);
      return;
    }

    const validationError = formatValidationErrors(error.data && error.data.errors);
    setFormMessage(elements.bookingMessage, validationError || error.message, 'error');
  }
}

async function deleteBooking(bookingId) {
  const booking = state.bookings.find((item) => item.id === bookingId);
  const confirmed = window.confirm(
    `هل تريد حذف حجز ${booking ? booking.guestName : 'هذا الضيف'}؟`
  );

  if (!confirmed) {
    return;
  }

  try {
    const result = await apiRequest(`${API_BASE}/${bookingId}`, { method: 'DELETE' });
    setFormMessage(elements.bookingMessage, result.message, 'success');
    if (state.editingBookingId === bookingId) {
      resetBookingForm();
    }
    await loadBookings();
  } catch (error) {
    setFormMessage(elements.bookingMessage, error.message, 'error');
  }
}

function handleTableClick(event) {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  const bookingId = button.dataset.id;
  const booking = state.bookings.find((item) => item.id === bookingId);

  if (!booking) {
    return;
  }

  if (button.dataset.action === 'edit') {
    const overlappingBooking = findOverlappingBooking(booking, booking.id);

    if (overlappingBooking) {
      showBookingConflictModal(overlappingBooking);
      return;
    }

    fillBookingForm(booking);
    return;
  }

  if (button.dataset.action === 'delete') {
    deleteBooking(bookingId);
  }
}

function handleCalendarClick(event) {
  const dayButton = event.target.closest('button[data-date]');

  if (!dayButton) {
    return;
  }

  state.selectedDate = dayButton.dataset.date;
  renderCalendar();
  renderSelectedDateDetails();
}

function updateMonth(offset) {
  state.currentMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() + offset,
    1
  );
  renderCalendar();
  renderSelectedDateDetails();
}

function jumpToToday() {
  state.currentMonth = startOfMonth(new Date());
  renderCalendar();
}

function formatValidationErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return '';
  }

  return Object.values(errors)
    .filter(Boolean)
    .join(' ');
}

function openAccountModal() {
  if (!state.authenticated) {
    return;
  }

  resetAccountMessages();
  elements.accountModal.classList.remove('hidden');
  elements.accountModal.setAttribute('aria-hidden', 'false');
}

function closeAccountModal() {
  elements.accountModal.classList.add('hidden');
  elements.accountModal.setAttribute('aria-hidden', 'true');
}

function resetAccountMessages() {
  clearMessage(elements.createAccountMessage);
  clearMessage(elements.changePasswordMessage);
}

async function submitCreateAccountForm(event) {
  event.preventDefault();
  setFormMessage(elements.createAccountMessage, '');

  try {
    const payload = buildAuthPayload(
      elements.createUsername,
      elements.createPassword,
      elements.createConfirmPassword
    );
    const result = await apiRequest(`${AUTH_BASE}/create-account`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setFormMessage(elements.createAccountMessage, result.message, 'success');
    elements.createAccountForm.reset();
  } catch (error) {
    const validationError = formatValidationErrors(error.data && error.data.errors);
    setFormMessage(elements.createAccountMessage, validationError || error.message, 'error');
  }
}

async function submitChangePasswordForm(event) {
  event.preventDefault();
  setFormMessage(elements.changePasswordMessage, '');

  try {
    const payload = {
      currentPassword: elements.currentPassword.value,
      newPassword: elements.newPassword.value,
      confirmPassword: elements.confirmNewPassword.value,
    };
    const result = await apiRequest(`${AUTH_BASE}/change-password`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setFormMessage(elements.changePasswordMessage, result.message, 'success');
    elements.changePasswordForm.reset();
  } catch (error) {
    const validationError = formatValidationErrors(error.data && error.data.errors);
    setFormMessage(elements.changePasswordMessage, validationError || error.message, 'error');
  }
}

function bindEvents() {
  elements.setupForm.addEventListener('submit', submitSetupForm);
  elements.loginForm.addEventListener('submit', submitLoginForm);
  elements.logoutButton.addEventListener('click', submitLogout);
  elements.accountButton.addEventListener('click', openAccountModal);
  elements.closeAccountModalButton.addEventListener('click', closeAccountModal);
  elements.accountModal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-account-modal]')) {
      closeAccountModal();
    }
  });
  elements.closeBookingConflictButton.addEventListener('click', closeBookingConflictModal);
  elements.bookingConflictModal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-booking-conflict]')) {
      closeBookingConflictModal();
    }
  });
  elements.createAccountForm.addEventListener('submit', submitCreateAccountForm);
  elements.changePasswordForm.addEventListener('submit', submitChangePasswordForm);
  elements.bookingForm.addEventListener('submit', submitBooking);
  elements.phoneNumber.addEventListener('input', handlePhoneNumberInput);
  elements.cancelEditButton.addEventListener('click', resetBookingForm);
  elements.bookingsTableBody.addEventListener('click', handleTableClick);
  elements.calendarGrid.addEventListener('click', handleCalendarClick);
  elements.searchInput.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    renderTable();
  });
  elements.bookingPeriodRadios.forEach((radio) => {
    radio.addEventListener('change', updatePriceSummary);
  });
  elements.depositAmount.addEventListener('input', updatePriceSummary);
  elements.prevMonthButton.addEventListener('click', () => updateMonth(-1));
  elements.nextMonthButton.addEventListener('click', () => updateMonth(1));
  elements.todayButton.addEventListener('click', jumpToToday);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeBookingConflictModal();
      closeAccountModal();
    }
  });
}

function initializeFormLimits() {
  elements.bookingDate.min = getTodayString();
}

function initializeDashboardState() {
  showView('auth');
  syncAuthPanels();
  initializeFormLimits();
  updatePriceSummary();
  elements.currentUserLabel.textContent = 'مرحبًا';
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

async function bootstrap() {
  registerServiceWorker();
  bindEvents();
  initializeDashboardState();
  await loadAuthStatus();
}

bootstrap();
