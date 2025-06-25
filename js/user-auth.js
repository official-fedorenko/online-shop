// ===== СИСТЕМА АВТОРИЗАЦИИ ПОЛЬЗОВАТЕЛЕЙ =====

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  initializeAuth();
  createDemoAccounts();
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

// Создание демо аккаунтов
function createDemoAccounts() {
  const users = getUsers();

  // Создаем админа, если его нет
  if (!users.find((user) => user.email === "admin@shop.com")) {
    const adminUser = {
      id: generateId(),
      firstName: "Админ",
      lastName: "Администратор",
      email: "admin@shop.com",
      password: hashPassword("admin123"),
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    users.push(adminUser);
  }

  // Создаем обычного пользователя, если его нет
  if (!users.find((user) => user.email === "user@shop.com")) {
    const regularUser = {
      id: generateId(),
      firstName: "Пользователь",
      lastName: "Обычный",
      email: "user@shop.com",
      password: hashPassword("user123"),
      role: "user",
      createdAt: new Date().toISOString(),
    };
    users.push(regularUser);
  }

  saveUsers(users);
}

// Обработка входа
async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    showMessage("Проверка данных...", "info");

    // Симуляция задержки сервера
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = authenticateUser(email, password);

    if (user) {
      // Сохраняем сессию
      setCurrentUser(user);
      showMessage("Успешный вход! Перенаправление...", "success");

      // Перенаправляем в зависимости от роли
      setTimeout(() => {
        if (user.role === "admin") {
          window.location.href = "admin/index.html";
        } else {
          window.location.href = "index.html";
        }
      }, 1500);
    } else {
      showMessage("Неверный email или пароль", "error");
    }
  } catch (error) {
    showMessage("Ошибка при входе: " + error.message, "error");
  }
}

// Обработка регистрации
async function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const userData = {
    firstName: formData.get("firstname"),
    lastName: formData.get("lastname"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    isAdmin: formData.get("isAdmin") === "on",
  };

  try {
    // Валидация
    if (!validateRegistration(userData)) {
      return;
    }

    showMessage("Создание аккаунта...", "info");

    // Симуляция задержки сервера
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Проверяем, не существует ли пользователь
    const users = getUsers();
    if (users.find((user) => user.email === userData.email)) {
      showMessage("Пользователь с таким email уже существует", "error");
      return;
    }

    // Создаем нового пользователя
    const newUser = {
      id: generateId(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashPassword(userData.password),
      role: userData.isAdmin ? "admin" : "user",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    showMessage("Аккаунт успешно создан! Можете войти в систему.", "success");

    // Переключаемся на форму входа
    setTimeout(() => {
      switchToLogin();
      // Заполняем email в форме входа
      document.getElementById("login-email").value = userData.email;
    }, 2000);
  } catch (error) {
    showMessage("Ошибка при регистрации: " + error.message, "error");
  }
}

// Валидация данных регистрации
function validateRegistration(data) {
  if (!data.firstName || data.firstName.trim().length < 2) {
    showMessage("Имя должно содержать минимум 2 символа", "error");
    return false;
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    showMessage("Фамилия должна содержать минимум 2 символа", "error");
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

// Аутентификация пользователя
function authenticateUser(email, password) {
  const users = getUsers();
  const hashedPassword = hashPassword(password);

  return users.find(
    (user) => user.email === email && user.password === hashedPassword
  );
}

// Простое хеширование пароля (в реальном проекте используйте bcrypt)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Конвертируем в 32-битное число
  }
  return hash.toString(36);
}

// Проверка корректности email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    document.getElementById("login-email").value = "user@shop.com";
    document.getElementById("login-password").value = "user123";
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
  messageDiv.style.display = "none";
}

// ===== РАБОТА С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ =====

// Получить пользователей
function getUsers() {
  const users = localStorage.getItem("shop-users");
  return users ? JSON.parse(users) : [];
}

// Сохранить пользователей
function saveUsers(users) {
  localStorage.setItem("shop-users", JSON.stringify(users));
}

// Установить текущего пользователя
function setCurrentUser(user) {
  const userSession = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem("current-user", JSON.stringify(userSession));
}

// Получить текущего пользователя
function getCurrentUser() {
  const user = localStorage.getItem("current-user");
  return user ? JSON.parse(user) : null;
}

// Выйти из системы
function logout() {
  localStorage.removeItem("current-user");
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
  return getCurrentUser() !== null;
}

// Генерация уникального ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
