// ===== СИСТЕМА АВТОРИЗАЦИИ ПОЛЬЗОВАТЕЛЕЙ (API) =====

// Базовый URL API (автоматически определяется)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  initializeAuth();
});

// Инициализация системы авторизации
function initializeAuth() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  // Проверяем, авторизован ли пользователь
  checkAuthStatus();
}

// Обработка входа
async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    showMessage("Проверка данных...", "info");

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Сохраняем токен и данные пользователя
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      showMessage("Успешный вход! Перенаправление...", "success");

      // Перенаправляем в зависимости от роли
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "admin/index.html";
        } else {
          window.location.href = "index.html";
        }
      }, 1500);
    } else {
      showMessage(data.message, "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessage("Ошибка соединения с сервером", "error");
  }
}

// Обработка регистрации
async function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const userData = {
    nickname: formData.get("nickname"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  try {
    // Валидация на клиенте
    if (!validateRegistration(userData)) {
      return;
    }

    showMessage("Создание аккаунта...", "info");

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nickname: userData.nickname,
        email: userData.email,
        password: userData.password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("Аккаунт успешно создан! Перенаправление...", "success");

      // Сохраняем токен и данные пользователя
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // Перенаправляем на главную страницу
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } else {
      showMessage(data.message, "error");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showMessage("Ошибка соединения с сервером", "error");
  }
}

// Валидация данных регистрации
function validateRegistration(data) {
  if (!data.nickname || data.nickname.trim().length < 2) {
    showMessage("Никнейм должен содержать минимум 2 символа", "error");
    return false;
  }

  if (!data.email || !isValidEmail(data.email)) {
    showMessage("Введите корректный email адрес", "error");
    return false;
  }

  if (!data.password || data.password.length < 6) {
    showMessage("Пароль должен содержать минимум 6 символов", "error");
    return false;
  }

  if (data.password !== data.confirmPassword) {
    showMessage("Пароли не совпадают", "error");
    return false;
  }

  return true;
}

// Проверка корректности email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Получить текущего пользователя
function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

// Получить токен авторизации
function getAuthToken() {
  return localStorage.getItem("authToken");
}

// Проверить авторизацию на сервере
async function verifyAuth() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      return data.user;
    } else {
      // Токен недействителен, очищаем данные
      logout();
      return null;
    }
  } catch (error) {
    console.error("Auth verification error:", error);
    return getCurrentUser(); // Fallback к локальным данным
  }
}

// Выйти из системы
function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  window.location.href = "auth.html";
}

// Проверить статус авторизации
function checkAuthStatus() {
  const currentUser = getCurrentUser();
  if (currentUser && window.location.pathname.includes("auth.html")) {
    // Пользователь уже авторизован, перенаправляем
    if (currentUser.role === "admin") {
      window.location.href = "admin/index.html";
    } else {
      window.location.href = "index.html";
    }
  }
}

// Проверить, является ли пользователь администратором
function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

// Проверить, авторизован ли пользователь
function isAuthenticated() {
  return getCurrentUser() !== null && getAuthToken() !== null;
}

// Переключение между формами
function switchToRegister() {
  document.getElementById("login-form").classList.remove("active");
  document.getElementById("register-form").classList.add("active");
  hideMessage();
}

function switchToLogin() {
  document.getElementById("register-form").classList.remove("active");
  document.getElementById("login-form").classList.add("active");
  hideMessage();
}

// Показать/скрыть пароль
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector(".password-toggle i");

  if (input.type === "password") {
    input.type = "text";
    button.className = "fas fa-eye-slash";
  } else {
    input.type = "password";
    button.className = "fas fa-eye";
  }
}

// Заполнение демо аккаунта
function fillDemoAccount(type) {
  if (type === "admin") {
    document.getElementById("login-email").value = "admin@shop.com";
    document.getElementById("login-password").value = "admin123";
  } else {
    // Можно добавить демо пользователя, если нужно
    showMessage("Создайте новый аккаунт для обычного пользователя", "info");
    switchToRegister();
    return;
  }

  // Переключаемся на форму входа
  switchToLogin();
  showMessage('Демо данные заполнены. Нажмите "Войти"', "info");
}

// Показать сообщение
function showMessage(text, type = "info") {
  const messageDiv = document.getElementById("auth-message");
  const messageText = document.getElementById("auth-message-text");
  const icon = messageDiv.querySelector("i");

  if (!messageDiv || !messageText || !icon) return;

  messageText.textContent = text;
  messageDiv.className = `auth-message ${type}`;

  // Меняем иконку в зависимости от типа
  switch (type) {
    case "success":
      icon.className = "fas fa-check-circle";
      break;
    case "error":
      icon.className = "fas fa-exclamation-circle";
      break;
    case "info":
    default:
      icon.className = "fas fa-info-circle";
      break;
  }

  messageDiv.style.display = "flex";

  // Автоматически скрываем сообщение через 5 секунд
  setTimeout(hideMessage, 5000);
}

// Скрыть сообщение
function hideMessage() {
  const messageDiv = document.getElementById("auth-message");
  if (messageDiv) {
    messageDiv.style.display = "none";
  }
}
