// navigation.js - Универсальная система навигации и авторизации

// Получение данных пользователя
function getUserData() {
  return {
    token: localStorage.getItem("token"),
    nickname: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
    role: localStorage.getItem("userRole"),
  };
}

// Сохранение данных пользователя
function saveUserData(userData) {
  localStorage.setItem("token", userData.token || "");
  localStorage.setItem("userName", userData.nickname || "");
  localStorage.setItem("userEmail", userData.email || "");
  localStorage.setItem("userRole", userData.role || "");
}

// Проверка авторизации
function isLoggedIn() {
  const { token, nickname, role } = getUserData();
  return token && token !== "null" && nickname && role;
}

// Обновление навигации
function updateNavigationAuth() {
  const { token, nickname, role } = getUserData();

  // Элементы навигации (безопасно, если элементы не найдены)
  const authLink = document.getElementById("authLink");
  const userInfo = document.getElementById("userInfo");
  const userName_span = document.getElementById("userName");
  const adminLink = document.getElementById("adminLink");
  const ordersLink = document.getElementById("ordersLink");

  if (isLoggedIn()) {
    // Пользователь авторизован
    if (authLink) authLink.style.display = "none";
    if (userInfo) userInfo.style.display = "inline";
    if (userName_span) userName_span.textContent = nickname;

    // Показываем ссылки для авторизованных
    if (ordersLink) ordersLink.style.display = "inline";

    // Показываем админские ссылки только админам
    if (adminLink) {
      adminLink.style.display = role === "admin" ? "inline" : "none";
    }
  } else {
    // Пользователь не авторизован
    if (authLink) authLink.style.display = "inline";
    if (userInfo) userInfo.style.display = "none";
    if (ordersLink) ordersLink.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
  }

  // Обновляем счетчик корзины если модуль cart доступен
  if (typeof cart !== "undefined" && cart.updateCartDisplay) {
    cart.updateCartDisplay();
  }
}

// Проверка авторизации через API
async function verifyAuth() {
  const { token } = getUserData();

  if (!token || token === "null") {
    return false;
  }

  try {
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Не очищаем авторизацию сразу, возможно проблема с сетью
      console.warn(
        "Не удалось проверить авторизацию, используем данные из localStorage"
      );
      return true; // Доверяем localStorage при проблемах с сетью
    }

    const data = await response.json();
    if (data.valid && data.user) {
      // Обновляем данные пользователя
      saveUserData({
        token: token,
        nickname: data.user.nickname,
        email: data.user.email,
        role: data.user.role,
      });
      updateNavigationAuth();
      return true;
    } else {
      // Только если сервер явно говорит что токен невалиден
      logout();
      return false;
    }
  } catch (error) {
    console.error("Ошибка проверки авторизации:", error);
    // При ошибке сети не сбрасываем авторизацию
    return true;
  }
}

// Выход из системы
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("cart"); // Очищаем корзину
  updateNavigationAuth();
  window.location.href = "/";
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  // Обновляем навигацию сразу на основе localStorage
  updateNavigationAuth();

  // Затем проверяем авторизацию через API (асинхронно, но не критично)
  if (isLoggedIn()) {
    verifyAuth().catch((error) => {
      console.warn("Проблема с проверкой авторизации:", error);
      // Не делаем logout, просто работаем с локальными данными
    });
  }
});

// Глобальные функции для использования в HTML
window.logout = logout;
window.updateNavigationAuth = updateNavigationAuth;
window.isLoggedIn = isLoggedIn;
window.getUserData = getUserData;
window.saveUserData = saveUserData;
