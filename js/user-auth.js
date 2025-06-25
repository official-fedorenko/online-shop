// ===== СИСТЕМА АВТОРИЗАЦИИ ПОЛЬЗОВАТЕЛЕЙ (API) =====

// Базовый URL API (автоматически определяется)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

// Функция сохранения данных пользователя (совместимость с navigation.js)
function saveUserData(userData) {
  if (typeof window.saveUserData === "function") {
    // Используем глобальную функцию из navigation.js если доступна
    window.saveUserData(userData);
  } else {
    // Fallback для случаев когда navigation.js не загружен
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("userName", userData.nickname || "");
    localStorage.setItem("userEmail", userData.email || "");
    localStorage.setItem("userRole", userData.role || "");
  }
}

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
  const login = formData.get("login");
  const password = formData.get("password");

  try {
    showMessage("Проверка данных...", "info");

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Сохраняем токен и данные пользователя в едином формате
      saveUserData({
        token: data.token,
        nickname: data.user.nickname,
        email: data.user.email,
        role: data.user.role,
      });

      showMessage("Успешный вход! Перенаправление...", "success");

      // Обновляем навигацию если функция доступна
      if (typeof updateNavigationAuth !== "undefined") {
        updateNavigationAuth();
      }

      // Перенаправляем в зависимости от роли
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      }, 1000);
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

      // Сохраняем токен и данные пользователя в едином формате
      saveUserData({
        token: data.token,
        nickname: data.user.nickname,
        email: data.user.email,
        role: data.user.role,
      });

      // Обновляем навигацию если функция доступна
      if (typeof updateNavigationAuth !== "undefined") {
        updateNavigationAuth();
      }

      // Перенаправляем на главную страницу
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
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
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  if (userName && userEmail && userRole) {
    return {
      nickname: userName,
      email: userEmail,
      role: userRole,
    };
  }
  return null;
}

// Получить токен авторизации
function getAuthToken() {
  return localStorage.getItem("token");
}

// Проверить авторизацию на сервере
async function verifyAuthLocal() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid && data.user) {
        // Обновляем данные пользователя в едином формате
        saveUserData({
          token: token,
          nickname: data.user.nickname,
          email: data.user.email,
          role: data.user.role,
        });
        return data.user;
      } else {
        // Только при явном отказе сервера сбрасываем авторизацию
        logoutLocal();
        return null;
      }
    } else {
      // При ошибке сети не сбрасываем, используем локальные данные
      console.warn(
        "Проблема с проверкой авторизации, используем локальные данные"
      );
      return getCurrentUser();
    }
  } catch (error) {
    console.error("Auth verification error:", error);
    return getCurrentUser(); // Fallback к локальным данным
  }
}

// Выйти из системы (используем глобальную функцию из navigation.js если доступна)
function logoutLocal() {
  if (typeof logout === "function") {
    // Используем глобальную функцию из navigation.js
    logout();
  } else {
    // Fallback если navigation.js не загружен
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("cart");
    window.location.href = "/auth";
  }
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
    document.getElementById("login-email").value = "Admin";
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
