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
