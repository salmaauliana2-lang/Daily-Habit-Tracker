document.addEventListener('DOMContentLoaded', () => {
  // Jika sudah memiliki token aktif, arahkan langsung ke halaman tracker
  if (API.getToken()) {
    window.location.href = '/tracker';
    return;
  }

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const alertBox = document.getElementById('alert-box');

  function showAlert(message, type = 'danger') {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
  }

  function clearAlert() {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  // Ganti Tab
  tabLogin.addEventListener('click', () => {
    tabLogin.style.color = 'var(--primary)';
    tabLogin.style.borderBottomColor = 'var(--primary)';
    tabRegister.style.color = 'var(--gray-600)';
    tabRegister.style.borderBottomColor = 'transparent';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    clearAlert();
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.style.color = 'var(--primary)';
    tabRegister.style.borderBottomColor = 'var(--primary)';
    tabLogin.style.color = 'var(--gray-600)';
    tabLogin.style.borderBottomColor = 'transparent';
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    clearAlert();
  });

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const data = await API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data && data.token) {
        API.setToken(data.token);
        API.setUser(data.user);
        window.location.href = '/tracker';
      }
    } catch (err) {
      showAlert(err.message || 'Login gagal. Periksa kembali email dan kata sandi.');
    }
  });

  // Handle Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
      const data = await API.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      showAlert(data.message || 'Pendaftaran berhasil! Silakan login.', 'success');
      // Otomatis pindah ke tab login
      setTimeout(() => {
        tabLogin.click();
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').focus();
      }, 1000);
    } catch (err) {
      showAlert(err.message || 'Pendaftaran gagal.');
    }
  });
});

