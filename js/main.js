// 1. Валидация форм и toast об успешной отправке
const forms = document.querySelectorAll('.js-validate-form');
const toastElement = document.getElementById('formToast');

forms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    form.reset();
    form.classList.remove('was-validated');

    const modalElement = form.closest('.modal');
    if (modalElement) {
      bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    }

    if (toastElement) {
      bootstrap.Toast.getOrCreateInstance(toastElement).show();
    }
  });
});

// 2. Фильтр по группе птиц и сортировка по возрасту в каталоге
const birdList = document.getElementById('birdList');

if (birdList) {
  const filterButtons = document.querySelectorAll('input[name="birdFilter"]');
  const sortSelect = document.getElementById('birdSort');
  const countElement = document.getElementById('birdCount');
  const emptyMessage = document.getElementById('birdEmpty');
  const items = Array.from(birdList.querySelectorAll('.bird-item'));

  function updateCatalog() {
    const type = document.querySelector('input[name="birdFilter"]:checked').value;
    const sort = sortSelect.value;

    const sorted = [...items];
    if (sort === 'young') {
      sorted.sort((a, b) => a.dataset.age - b.dataset.age);
    } else if (sort === 'old') {
      sorted.sort((a, b) => b.dataset.age - a.dataset.age);
    }

    let visible = 0;
    sorted.forEach((item) => {
      const show = type === 'all' || item.dataset.type === type;
      item.classList.toggle('d-none', !show);
      birdList.appendChild(item);
      if (show) visible++;
    });

    countElement.textContent = visible;
    emptyMessage.classList.toggle('d-none', visible > 0);
  }

  filterButtons.forEach((button) => button.addEventListener('change', updateCatalog));
  sortSelect.addEventListener('change', updateCatalog);
}

// 3. Подстановка выбранной птицы в форму заявки (order.html?bird=filya)
const birdSelect = document.getElementById('order-bird');

if (birdSelect) {
  const birdId = new URLSearchParams(window.location.search).get('bird');
  const option = birdId ? birdSelect.querySelector(`option[value="${CSS.escape(birdId)}"]`) : null;

  if (option) {
    birdSelect.value = birdId;
    const alertElement = document.getElementById('selectedBirdAlert');
    alertElement.textContent = `Вы выбрали: ${option.textContent}. Осталось заполнить анкету.`;
    alertElement.classList.remove('d-none');
  }
}

// 4. Переключение светлой и тёмной темы с анимацией:
//    в тёмную тему птица летит слева направо и закрывает занавес («наступает ночь»),
//    в светлую — летит справа налево и открывает его («наступает утро»).
const themeToggle = document.getElementById('themeToggle');
let themeAnimating = false;

function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    // localStorage может быть недоступен — тема просто не запомнится
  }
}

function runBirdCurtain(toDark, onCovered) {
  const curtain = document.createElement('div');
  curtain.className = 'theme-curtain';

  // Внешний блок двигается по экрану, внутренний машет крыльями
  const bird = document.createElement('div');
  bird.className = toDark ? 'theme-bird' : 'theme-bird theme-bird--left';
  bird.innerHTML = '<div class="theme-bird__sprite"></div>';

  document.body.append(curtain, bird);

  const duration = 1300;
  const birdWidth = 168;
  const screenWidth = window.innerWidth;
  // Птица пролетает от -birdWidth до screenWidth (или обратно),
  // а край занавеса всегда привязан к её хвосту
  const path = screenWidth + birdWidth;
  let startTime = null;

  if (!toDark) {
    // Занавес сразу закрывает экран, под ним включается светлая тема
    curtain.style.width = `${path}px`;
    onCovered();
  }

  function frame(time) {
    if (startTime === null) startTime = time;
    const t = Math.min((time - startTime) / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    // Лёгкая «волна» по вертикали — птица то набирает, то теряет высоту
    const wave = Math.sin(t * Math.PI * 3) * 18;

    let birdLeft;
    if (toDark) {
      // Летит вправо: хвост слева, занавес тянется за ним
      birdLeft = -birdWidth + eased * path;
      curtain.style.width = `${Math.max(birdLeft, 0)}px`;
    } else {
      // Летит влево: хвост справа, занавес уезжает вслед за ним
      birdLeft = screenWidth - eased * path;
      curtain.style.width = `${Math.max(birdLeft + birdWidth, 0)}px`;
    }
    bird.style.left = `${birdLeft}px`;
    bird.style.marginTop = `${wave}px`;

    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }

    bird.remove();
    if (toDark) {
      onCovered();
      curtain.classList.add('is-hiding');
      setTimeout(() => curtain.remove(), 300);
    } else {
      curtain.remove();
    }
    themeAnimating = false;
  }

  requestAnimationFrame(frame);
}

applyTheme(document.documentElement.getAttribute('data-bs-theme') || 'light');

// 5. Закреплённая шапка и возврат к началу на всех страницах.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty('--site-header-height', `${siteHeader.offsetHeight}px`);
  };
  new ResizeObserver(updateHeaderHeight).observe(siteHeader);
  updateHeaderHeight();
}

const backToTop = document.createElement('button');
backToTop.type = 'button';
backToTop.className = 'back-to-top btn btn-primary';
backToTop.setAttribute('aria-label', 'Вернуться наверх');
backToTop.title = 'Наверх';
const backToTopBird = document.createElement('img');
backToTopBird.src = 'images/bird-up.svg';
backToTopBird.alt = '';
backToTopBird.width = 34;
backToTopBird.height = 34;
backToTopBird.setAttribute('aria-hidden', 'true');
backToTop.append(backToTopBird);
backToTop.hidden = true;
document.body.append(backToTop);

function updateBackToTop() {
  backToTop.hidden = window.scrollY < window.innerHeight;
}

window.addEventListener('scroll', updateBackToTop, { passive: true });
window.addEventListener('resize', updateBackToTop);
window.addEventListener('pageshow', updateBackToTop);
updateBackToTop();

backToTop.addEventListener('click', () => {
  // Переносим фокус с исчезающей кнопки на начало навигации.
  siteHeader?.querySelector('.navbar-brand')?.focus({ preventScroll: true });
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
});


// 6. Цифры появляются от нуля один раз при показе блока статистики.
const counters = document.querySelectorAll('[data-count]');
if (counters.length && 'IntersectionObserver' in window) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const formatter = new Intl.NumberFormat('ru-RU');
  const runningFrames = new Map();
  const showFinal = (counter) => {
    cancelAnimationFrame(runningFrames.get(counter));
    runningFrames.delete(counter);
    counter.querySelector('span').textContent = formatter.format(Number(counter.dataset.count));
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      if (motionPreference.matches) {
        showFinal(target);
        return;
      }
      let started;
      const total = Number(target.dataset.count);
      function tick(now) {
        started ??= now;
        const progress = Math.min((now - started) / 1500, 1);
        const eased = 1 - (1 - progress) ** 3;
        target.querySelector('span').textContent = formatter.format(Math.round(total * eased));
        if (progress < 1) runningFrames.set(target, requestAnimationFrame(tick));
        else runningFrames.delete(target);
      }
      runningFrames.set(target, requestAnimationFrame(tick));
    });
  }, { threshold: 0.5 });
  if (!motionPreference.matches) {
    counters.forEach((counter) => {
      counter.querySelector('span').textContent = '0';
      observer.observe(counter);
    });
  }
  motionPreference.addEventListener('change', ({ matches }) => {
    if (!matches) return;
    observer.disconnect();
    counters.forEach(showFinal);
  });
}

// 7. Закреплённый чат-помощник: быстрые ответы и переход к форме связи.
// Сообщения не отправляются на сервер, поэтому не обещаем ответ оператора.
const chatPanel = document.createElement('section');
chatPanel.id = 'supportChat';
chatPanel.className = 'support-chat card shadow-lg';
chatPanel.hidden = true;
chatPanel.setAttribute('role', 'region');
chatPanel.setAttribute('aria-labelledby', 'supportChatTitle');
chatPanel.innerHTML = `
  <div class="card-header d-flex justify-content-between align-items-center gap-3">
    <div>
      <h2 class="h6 mb-1" id="supportChatTitle">Помощник «Крылья»</h2>
      <p class="small text-body-secondary mb-0">Подсказки и связь с центром</p>
    </div>
    <button class="btn btn-outline-secondary btn-sm" type="button" data-chat-close aria-label="Закрыть чат">✕</button>
  </div>
  <div class="card-body support-chat__body">
    <p class="small mb-3">Здравствуйте! Выберите вопрос — помогу найти нужную информацию.</p>
    <div class="d-flex flex-column align-items-start gap-2 mb-3" aria-label="Частые вопросы">
      <button class="btn btn-outline-primary btn-sm text-start" type="button" data-chat-topic="found">Нашли раненую птицу?</button>
      <button class="btn btn-outline-primary btn-sm text-start" type="button" data-chat-topic="help">Как помочь центру?</button>
      <button class="btn btn-outline-primary btn-sm text-start" type="button" data-chat-topic="visit">Как приехать в центр?</button>
    </div>
    <div class="small border-top pt-3" role="status" aria-live="polite" aria-atomic="true" data-chat-answer>
      Для личного вопроса воспользуйтесь формой на странице контактов.
    </div>
    <a class="btn btn-primary btn-sm mt-3" href="contacts.html#feedback-name">Написать в центр</a>
  </div>`;
const chatToggle = document.createElement('button');
chatToggle.type = 'button';
chatToggle.className = 'support-chat-toggle btn btn-primary';
chatToggle.textContent = 'Чат с центром';
chatToggle.setAttribute('aria-controls', chatPanel.id);
chatToggle.setAttribute('aria-expanded', 'false');
document.body.append(chatPanel, chatToggle);

function setChatOpen(open) {
  chatPanel.hidden = !open;
  chatToggle.setAttribute('aria-expanded', String(open));
  if (open) chatPanel.querySelector('[data-chat-close]').focus();
  else chatToggle.focus({ preventScroll: true });
}
chatToggle.addEventListener('click', () => setChatOpen(chatPanel.hidden));
chatPanel.querySelector('[data-chat-close]').addEventListener('click', () => setChatOpen(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !chatPanel.hidden) {
    setChatOpen(false);
  }
});
const chatAnswers = {
  found: 'Поместите птицу в коробку с отверстиями, держите в тихом месте. Не кормите, не поите насильно и не давайте лекарства. Перед поездкой свяжитесь с центром. Подробная инструкция — на странице «Контакты».',
  help: 'Можно поддержать сборы на корм, лечение и вольер, стать опекуном или волонтёром. Все способы помощи и анкета волонтёра — на странице «Помочь».',
  visit: 'Адрес: г. Москва, ул. Лесная, д. 12. Офис: с 9:00 до 18:00. Экскурсии — сб–вс в 12:00, по записи. Согласуйте визит заранее через страницу контактов.',
};
chatPanel.querySelectorAll('[data-chat-topic]').forEach((button) => {
  button.addEventListener('click', () => {
    chatPanel.querySelector('[data-chat-answer]').textContent = chatAnswers[button.dataset.chatTopic];
  });
});

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    if (themeAnimating) return;

    const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      applyTheme(next);
      saveTheme(next);
      return;
    }

    themeAnimating = true;
    runBirdCurtain(next === 'dark', () => {
      applyTheme(next);
      saveTheme(next);
    });
  });
}
