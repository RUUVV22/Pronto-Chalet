const ARABIC_LOCALE = 'ar-SA-u-ca-gregory';
const PUBLIC_AVAILABILITY_COLLECTION = 'publicAvailability';
const bookingPeriodOrder = ['morning', 'evening'];
const bookingPeriodTimes = {
  morning: {
    from: '10:00 صباحاً',
    to: '8:00 مساءً',
  },
  evening: {
    from: '10:00 مساءً',
    to: '8:00 صباحاً',
  },
};
const weekdayLabels = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const backgroundImages = [
  'assets/chalet-backgrounds/chalet-bg-01.jpg',
  'assets/chalet-backgrounds/chalet-bg-02.jpg',
  'assets/chalet-backgrounds/chalet-bg-03.jpg',
  'assets/chalet-backgrounds/chalet-bg-04.jpg',
  'assets/chalet-backgrounds/chalet-bg-05.jpg',
  'assets/chalet-backgrounds/chalet-bg-06.jpg',
  'assets/chalet-backgrounds/chalet-bg-07.jpg',
  'assets/chalet-backgrounds/chalet-bg-08.jpg',
  'assets/chalet-backgrounds/chalet-bg-09.jpg',
  'assets/chalet-backgrounds/chalet-bg-10.jpg',
  'assets/chalet-backgrounds/chalet-bg-11.jpg',
  'assets/chalet-backgrounds/chalet-bg-12.jpg',
  'assets/chalet-backgrounds/chalet-bg-13.jpg',
  'assets/chalet-backgrounds/chalet-bg-14.jpg',
  'assets/chalet-backgrounds/chalet-bg-15.jpg',
  'assets/chalet-backgrounds/chalet-bg-16.jpg',
  'assets/chalet-backgrounds/chalet-bg-17.jpeg',
  'assets/chalet-backgrounds/chalet-bg-18.jpeg',
  'assets/chalet-backgrounds/chalet-bg-19.jpeg',
  'assets/chalet-backgrounds/chalet-bg-20.jpeg',
  'assets/chalet-backgrounds/chalet-bg-21.jpeg',
  'assets/chalet-backgrounds/chalet-bg-22.jpeg',
  'assets/chalet-backgrounds/chalet-bg-23.jpeg',
  'assets/chalet-backgrounds/chalet-bg-24.jpeg',
  'assets/chalet-backgrounds/chalet-bg-25.jpeg',
  'assets/chalet-backgrounds/chalet-bg-26.jpeg',
];
const backgroundSlideInterval = 8200;

const firebaseConfig = {
  apiKey: 'AIzaSyDjmBwQn2i5S94g7lB5guDAfH9Wn8AhDlo',
  authDomain: 'prontochalet-f75b6.firebaseapp.com',
  projectId: 'prontochalet-f75b6',
  storageBucket: 'prontochalet-f75b6.firebasestorage.app',
  messagingSenderId: '107619810614',
  appId: '1:107619810614:web:b3b1dad78a0a8c08054797',
  measurementId: 'G-ZERN51SPDY',
};

const elements = {
  availabilityGrid: document.getElementById('availabilityGrid'),
  availabilityMessage: document.getElementById('availabilityMessage'),
  backgroundStage: document.getElementById('backgroundStage'),
  calendarTitle: document.getElementById('calendarTitle'),
  nextMonthButton: document.getElementById('nextMonthButton'),
  prevMonthButton: document.getElementById('prevMonthButton'),
  selectedDayStatus: document.getElementById('selectedDayStatus'),
  selectedDayTitle: document.getElementById('selectedDayTitle'),
  todayButton: document.getElementById('todayButton'),
};

const state = {
  currentMonth: startOfMonth(new Date()),
  selectedDate: '',
  slotsByDate: new Map(),
};

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getBackgroundMotion() {
  return {
    scale: 1.08 + Math.random() * 0.04,
    xPercent: Math.random() * 4 - 2,
    yPercent: Math.random() * 4 - 2,
  };
}

function buildBackgroundSlide(imagePath, index) {
  const slide = document.createElement('div');
  slide.className = 'background-slide';
  slide.style.backgroundImage = `url("${imagePath}")`;
  slide.style.backgroundPosition = index % 2 === 0 ? 'center' : 'center top';

  return slide;
}

function preloadBackgroundImages() {
  backgroundImages.forEach((imagePath) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = imagePath;
  });
}

function startCssBackgroundRotation(slides) {
  let activeIndex = 0;

  slides[activeIndex].classList.add('active');

  if (prefersReducedMotion() || slides.length < 2) {
    return;
  }

  window.setInterval(() => {
    const nextIndex = (activeIndex + 1) % slides.length;

    slides[activeIndex].classList.remove('active');
    slides[nextIndex].classList.add('active');
    activeIndex = nextIndex;
  }, backgroundSlideInterval);
}

function startGsapBackgroundRotation(slides) {
  const gsap = window.gsap;
  let activeIndex = 0;

  if (!gsap || prefersReducedMotion() || slides.length < 2) {
    startCssBackgroundRotation(slides);
    return;
  }

  gsap.set(slides, {
    autoAlpha: 0,
    filter: 'blur(14px)',
    scale: 1.08,
    xPercent: 0,
    yPercent: 0,
  });
  gsap.set(slides[activeIndex], {
    autoAlpha: 1,
    filter: 'blur(0px)',
    scale: 1.06,
  });
  slides[activeIndex].classList.add('active');

  gsap.to(slides[activeIndex], {
    ...getBackgroundMotion(),
    duration: backgroundSlideInterval / 1000 + 1.8,
    ease: 'sine.inOut',
  });

  window.setInterval(() => {
    const currentSlide = slides[activeIndex];
    const nextIndex = (activeIndex + 1) % slides.length;
    const nextSlide = slides[nextIndex];
    const nextMotion = getBackgroundMotion();

    slides.forEach((slide) => slide.classList.remove('active'));
    nextSlide.classList.add('active');
    gsap.killTweensOf([currentSlide, nextSlide]);
    gsap.set(nextSlide, {
      autoAlpha: 0,
      filter: 'blur(18px)',
      scale: 1.11,
      xPercent: -nextMotion.xPercent,
      yPercent: -nextMotion.yPercent,
    });

    gsap
      .timeline()
      .to(
        currentSlide,
        {
          autoAlpha: 0,
          filter: 'blur(10px)',
          scale: 1.04,
          duration: 3,
          ease: 'sine.inOut',
        },
        0
      )
      .to(
        nextSlide,
        {
          autoAlpha: 1,
          filter: 'blur(0px)',
          scale: 1.06,
          duration: 3,
          ease: 'sine.inOut',
        },
        0
      )
      .to(
        nextSlide,
        {
          ...nextMotion,
          duration: backgroundSlideInterval / 1000 + 2.2,
          ease: 'sine.inOut',
        },
        0
      );

    activeIndex = nextIndex;
  }, backgroundSlideInterval);
}

function initializeBackgroundSlideshow() {
  if (!elements.backgroundStage || backgroundImages.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();
  const slides = backgroundImages.map((imagePath, index) => buildBackgroundSlide(imagePath, index));

  preloadBackgroundImages();
  slides.forEach((slide) => fragment.appendChild(slide));
  elements.backgroundStage.appendChild(fragment);
  startGsapBackgroundRotation(slides);
}

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateInput(date) {
  return [date.getFullYear(), padNumber(date.getMonth() + 1), padNumber(date.getDate())].join('-');
}

function getTodayString() {
  return formatDateInput(new Date());
}

function formatPlainNumber(value) {
  return new Intl.NumberFormat('ar-SA', { useGrouping: false }).format(value);
}

function formatMonthTitle(date) {
  return `${formatPlainNumber(date.getMonth() + 1)} / ${formatPlainNumber(date.getFullYear())}`;
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

function setMessage(message, type = 'info') {
  elements.availabilityMessage.textContent = message;
  elements.availabilityMessage.dataset.type = type;
}

function clearMessage() {
  elements.availabilityMessage.textContent = '';
  delete elements.availabilityMessage.dataset.type;
}

function isLocalApiHost() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function normalizeSlot(rawSlot) {
  const bookingDate = String(rawSlot && rawSlot.bookingDate ? rawSlot.bookingDate : '').trim();
  const bookingPeriod = rawSlot && rawSlot.bookingPeriod === 'evening' ? 'evening' : 'morning';

  if (!parseDateInput(bookingDate)) {
    return null;
  }

  return {
    bookingDate,
    bookingPeriod,
    status: 'booked',
  };
}

function setAvailabilitySlots(slots) {
  state.slotsByDate = new Map();

  slots
    .map(normalizeSlot)
    .filter(Boolean)
    .forEach((slot) => {
      const daySlots = state.slotsByDate.get(slot.bookingDate) || new Set();
      daySlots.add(slot.bookingPeriod);
      state.slotsByDate.set(slot.bookingDate, daySlots);
    });
}

function getBookedPeriods(dateString) {
  return state.slotsByDate.get(dateString) || new Set();
}

function getDayStatus(dateString) {
  const bookedPeriods = getBookedPeriods(dateString);
  const bookedCount = bookedPeriods.size;

  if (bookedCount >= bookingPeriodOrder.length) {
    return {
      className: 'booked',
      label: 'محجوز',
    };
  }

  if (bookedCount > 0) {
    return {
      className: 'partial',
      label: 'متاح جزئياً',
    };
  }

  return {
    className: 'available',
    label: 'متاح',
  };
}

function getPeriodLabel(period) {
  return period === 'evening' ? 'الفترة المسائية' : 'الفترة الصباحية';
}

function getPeriodShortLabel(period) {
  return period === 'evening' ? 'مساء' : 'صباح';
}

function getPeriodTimeRange(period) {
  const times = bookingPeriodTimes[period] || bookingPeriodTimes.morning;
  return `${times.from} - ${times.to}`;
}

function getCompactPeriodTimeRange(period) {
  return period === 'evening' ? '10:00 م - 8:00 ص' : '10:00 ص - 8:00 م';
}

function renderLoadingCalendar() {
  const cells = weekdayLabels.map((weekday) => `<div class="calendar-weekday">${weekday}</div>`);

  for (let index = 0; index < 21; index += 1) {
    cells.push(`
      <div class="calendar-day available" aria-hidden="true">
        <span class="skeleton-line short"></span>
        <span class="skeleton-line medium"></span>
        <span class="skeleton-line"></span>
      </div>
    `);
  }

  elements.availabilityGrid.classList.add('loading-grid');
  elements.availabilityGrid.innerHTML = cells.join('');
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
  elements.availabilityGrid.classList.remove('loading-grid');

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
    const status = getDayStatus(dateString);
    const dayClasses = ['calendar-day', status.className];
    const bookedPeriods = getBookedPeriods(dateString);
    const slotSummary = bookingPeriodOrder
      .map(
        (period) => {
          const isBooked = bookedPeriods.has(period);

          return `
          <span class="${isBooked ? 'booked' : 'available'}">
            <strong>${getPeriodShortLabel(period)}: ${isBooked ? 'محجوز' : 'متاح'}</strong>
            <small>${getCompactPeriodTimeRange(period)}</small>
          </span>
        `;
        }
      )
      .join('');

    if (dateString === todayString) {
      dayClasses.push('today');
    }

    if (dateString === state.selectedDate) {
      dayClasses.push('selected');
    }

    cells.push(`
      <button class="${dayClasses.join(' ')}" type="button" data-date="${dateString}">
        <span class="day-number">${formatPlainNumber(dayNumber)}</span>
        <span class="day-label ${status.className}">${status.label}</span>
        <span class="day-slots">${slotSummary}</span>
      </button>
    `);
  }

  elements.availabilityGrid.innerHTML = cells.join('');
}

function renderSelectedDay() {
  if (!state.selectedDate) {
    elements.selectedDayTitle.textContent = 'اختر يوماً';
    elements.selectedDayStatus.textContent =
      'اختر أي يوم من التقويم لمعرفة حالة الفترة الصباحية والمسائية.';
    return;
  }

  const bookedPeriods = getBookedPeriods(state.selectedDate);
  const statusRows = bookingPeriodOrder
    .map((period) => {
      const isBooked = bookedPeriods.has(period);

      return `
        <div class="slot-status">
          <span class="slot-copy">
            <strong>${getPeriodLabel(period)}</strong>
            <small>${getPeriodTimeRange(period)}</small>
          </span>
          <span class="slot-pill ${isBooked ? 'booked' : 'available'}">
            ${isBooked ? 'محجوز' : 'متاح'}
          </span>
        </div>
      `;
    })
    .join('');

  elements.selectedDayTitle.textContent = formatDateDisplay(state.selectedDate);
  elements.selectedDayStatus.innerHTML = statusRows;
}

async function loadAvailabilityFromApi() {
  const response = await fetch('/api/public/availability', {
    headers: {
      Accept: 'application/json',
    },
  });
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error('Local public availability API is not available.');
  }

  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

async function loadAvailabilityFromFirestore() {
  const [{ getApps, initializeApp }, firestore] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js'),
  ]);
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = firestore.getFirestore(app);
  const snapshot = await firestore.getDocs(firestore.collection(db, PUBLIC_AVAILABILITY_COLLECTION));

  return snapshot.docs.map((slotDocument) => slotDocument.data());
}

async function loadAvailability() {
  renderLoadingCalendar();
  setMessage('جاري تحميل التقويم...');

  const loaders = isLocalApiHost()
    ? [loadAvailabilityFromApi, loadAvailabilityFromFirestore]
    : [loadAvailabilityFromFirestore, loadAvailabilityFromApi];
  let lastError = null;

  for (const loader of loaders) {
    try {
      const slots = await loader();
      setAvailabilitySlots(slots);
      clearMessage();
      renderCalendar();
      renderSelectedDay();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  setAvailabilitySlots([]);
  renderCalendar();
  renderSelectedDay();
  setMessage('تعذر تحميل التقويم حالياً. حاول مرة أخرى لاحقاً.', 'error');
  console.error('Availability load failed:', lastError);
}

function updateMonth(offset) {
  state.currentMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() + offset,
    1
  );
  renderCalendar();
}

function jumpToToday() {
  state.currentMonth = startOfMonth(new Date());
  state.selectedDate = getTodayString();
  renderCalendar();
  renderSelectedDay();
}

function bindEvents() {
  elements.prevMonthButton.addEventListener('click', () => updateMonth(-1));
  elements.nextMonthButton.addEventListener('click', () => updateMonth(1));
  elements.todayButton.addEventListener('click', jumpToToday);
  elements.availabilityGrid.addEventListener('click', (event) => {
    const dayButton = event.target.closest('button[data-date]');

    if (!dayButton) {
      return;
    }

    state.selectedDate = dayButton.dataset.date;
    renderCalendar();
    renderSelectedDay();
  });
}

initializeBackgroundSlideshow();
bindEvents();
loadAvailability();
