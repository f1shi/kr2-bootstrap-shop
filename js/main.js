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
