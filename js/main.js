// ===== ГЛАВНЫЙ ФАЙЛ ИНТЕРНЕТ-МАГАЗИНА =====

document.addEventListener("DOMContentLoaded", () => {
  console.log("Online shop initialized");
  initializeUserInterface();
});

// Инициализация пользовательского интерфейса
function initializeUserInterface() {
  const currentUser = getCurrentUser();

  if (currentUser) {
    showUserInfo(currentUser);
  } else {
    showGuestInterface();
  }
}

// Показать информацию о пользователе
function showUserInfo(user) {
  const userInfo = document.getElementById("user-info");
  const userName = document.getElementById("user-name");
  const authLink = document.getElementById("auth-link");
  const logoutButton = document.getElementById("logout-button");
  const adminLink = document.getElementById("admin-link");

  if (userInfo && userName) {
    userName.textContent = user.firstName;
    userInfo.style.display = "block";
  }

  if (authLink) {
    authLink.style.display = "none";
  }

  if (logoutButton) {
    logoutButton.style.display = "inline-flex";
  }

  // Показываем ссылку на админку только администраторам
  if (adminLink && user.role === "admin") {
    adminLink.style.display = "inline-flex";
  }
}

// Показать интерфейс для гостя
function showGuestInterface() {
  const userInfo = document.getElementById("user-info");
  const authLink = document.getElementById("auth-link");
  const logoutButton = document.getElementById("logout-button");
  const adminLink = document.getElementById("admin-link");

  if (userInfo) {
    userInfo.style.display = "none";
  }

  if (authLink) {
    authLink.style.display = "inline-flex";
  }

  if (logoutButton) {
    logoutButton.style.display = "none";
  }

  if (adminLink) {
    adminLink.style.display = "none";
  }
}
