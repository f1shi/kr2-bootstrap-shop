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

// 2. Фильтр и сортировка питомцев в каталоге
const petList = document.getElementById('petList');

if (petList) {
  const filterButtons = document.querySelectorAll('input[name="petFilter"]');
  const sortSelect = document.getElementById('petSort');
  const countElement = document.getElementById('petCount');
  const emptyMessage = document.getElementById('petEmpty');
  const items = Array.from(petList.querySelectorAll('.pet-item'));

  function updateCatalog() {
    const type = document.querySelector('input[name="petFilter"]:checked').value;
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
      petList.appendChild(item);
      if (show) visible++;
    });

    countElement.textContent = visible;
    emptyMessage.classList.toggle('d-none', visible > 0);
  }

  filterButtons.forEach((button) => button.addEventListener('change', updateCatalog));
  sortSelect.addEventListener('change', updateCatalog);
}

// 3. Подстановка выбранного питомца в форму заявки (order.html?pet=barsik)
const petSelect = document.getElementById('order-pet');

if (petSelect) {
  const petId = new URLSearchParams(window.location.search).get('pet');
  const option = petId ? petSelect.querySelector(`option[value="${CSS.escape(petId)}"]`) : null;

  if (option) {
    petSelect.value = petId;
    const alertElement = document.getElementById('selectedPetAlert');
    alertElement.textContent = `Вы выбрали питомца: ${option.textContent}. Осталось заполнить анкету.`;
    alertElement.classList.remove('d-none');
  }
}

// 4. Переключение светлой и тёмной темы с анимацией:
//    в тёмную тему бигль бежит слева направо и закрывает занавес,
//    в светлую — корги бежит справа налево и открывает занавес.
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

function runDogCurtain(toDark, onCovered) {
  const curtain = document.createElement('div');
  curtain.className = 'theme-curtain';

  const dog = document.createElement('img');
  dog.className = 'theme-dog';
  dog.alt = '';
  dog.src = toDark ? 'images/dog-beagle.png' : 'images/dog-corgi.png';

  document.body.append(curtain, dog);

  const duration = 1200;
  const dogWidth = 168;
  const screenWidth = window.innerWidth;
  // Собака пробегает от -dogWidth до screenWidth (или обратно),
  // а край занавеса всегда «привязан» к её хвосту
  const path = screenWidth + dogWidth;
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

    if (toDark) {
      // Бигль смотрит вправо: хвост слева, занавес тянется за ним
      const dogLeft = -dogWidth + eased * path;
      dog.style.left = `${dogLeft}px`;
      curtain.style.width = `${Math.max(dogLeft, 0)}px`;
    } else {
      // Корги смотрит влево: хвост справа, занавес уезжает вслед за ним
      const dogLeft = screenWidth - eased * path;
      dog.style.left = `${dogLeft}px`;
      curtain.style.width = `${Math.max(dogLeft + dogWidth, 0)}px`;
    }

    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }

    dog.remove();
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
    runDogCurtain(next === 'dark', () => {
      applyTheme(next);
      saveTheme(next);
    });
  });
}
