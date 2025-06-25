// ===== АДМИНКА ИНТЕРНЕТ-МАГАЗИНА (API) =====

// Базовый URL API (автоматически определяется)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

// Получение токена авторизации
function getAuthToken() {
  return localStorage.getItem("authToken");
}

// Получение заголовков с авторизацией
function getAuthHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// Инициализация админки
function initializeAdminPanel(currentUser) {
  document.getElementById("admin-name").textContent =
    currentUser.nickname || currentUser.email;

  loadStatistics();
  loadProductList();

  // Обработчики для форм
  const addProductForm = document.getElementById("add-product-form");
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
  }
}

// Загрузка статистики
async function loadStatistics() {
  try {
    // Загружаем статистику пользователей
    const usersResponse = await fetch(`${API_BASE_URL}/users/stats`, {
      headers: getAuthHeaders(),
    });

    if (usersResponse.ok) {
      const usersStats = await usersResponse.json();
      document.getElementById("total-users").textContent =
        usersStats.totalUsers || 0;
      document.getElementById("total-admins").textContent =
        usersStats.totalAdmins || 0;
    }

    // Загружаем статистику товаров
    const productsResponse = await fetch(`${API_BASE_URL}/products`);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      document.getElementById("total-products").textContent =
        productsData.total || 0;
    }
  } catch (error) {
    console.error("Ошибка загрузки статистики:", error);
  }
}

// Загрузка списка товаров для админки
async function loadProductList() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayAdminProductList(data.products);
  } catch (error) {
    console.error("Ошибка загрузки товаров:", error);
    showProductError("Не удалось загрузить список товаров");
  }
}

// Отображение списка товаров в админке
function displayAdminProductList(products) {
  const productListElement = document.getElementById("admin-product-list");

  if (!productListElement) {
    console.error("Элемент admin-product-list не найден");
    return;
  }

  if (!products || products.length === 0) {
    productListElement.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>Товары отсутствуют</h3>
                <p>Добавьте первый товар в каталог</p>
            </div>
        `;
    return;
  }

  productListElement.innerHTML = products
    .map(
      (product) => `
        <div class="admin-product-item">
            <div class="product-image">
                <img src="${
                  product.image_url || "https://via.placeholder.com/100x100"
                }" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
                ${
                  !product.in_stock
                    ? '<span class="out-of-stock-badge">Нет в наличии</span>'
                    : ""
                }
            </div>
            <div class="product-details">
                <h4>${product.name}</h4>
                <p class="product-description">${
                  product.description || "Описание отсутствует"
                }</p>
                <div class="product-meta">
                    <span class="category">${
                      product.category || "Без категории"
                    }</span>
                    <span class="price">${formatPrice(product.price)} ₽</span>
                </div>
                <div class="product-dates">
                    <small>Создан: ${formatDate(product.created_at)}</small>
                    ${
                      product.updated_at !== product.created_at
                        ? `<small>Обновлен: ${formatDate(
                            product.updated_at
                          )}</small>`
                        : ""
                    }
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-sm btn-secondary" onclick="editProduct(${
                  product.id
                })">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-sm ${
                  product.in_stock ? "btn-warning" : "btn-success"
                }" 
                        onclick="toggleProductStock(${
                          product.id
                        }, ${!product.in_stock})">
                    <i class="fas fa-${
                      product.in_stock ? "eye-slash" : "eye"
                    }"></i> 
                    ${product.in_stock ? "Скрыть" : "Показать"}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
                  product.id
                })">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

// Обработка добавления товара
async function handleAddProduct(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const productData = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: parseFloat(formData.get("price")),
    image_url: formData.get("image"),
    category: formData.get("category"),
  };

  // Валидация
  if (!validateProduct(productData)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });

    const result = await response.json();

    if (response.ok) {
      showSuccessMessage("Товар успешно добавлен!");
      event.target.reset(); // Очищаем форму
      loadProductList(); // Обновляем список товаров
      loadStatistics(); // Обновляем статистику
    } else {
      throw new Error(result.error || "Ошибка добавления товара");
    }
  } catch (error) {
    console.error("Ошибка добавления товара:", error);
    showErrorMessage("Ошибка добавления товара: " + error.message);
  }
}

// Валидация товара
function validateProduct(product) {
  if (!product.name || product.name.trim().length < 2) {
    showErrorMessage("Название товара должно содержать минимум 2 символа");
    return false;
  }

  if (!product.price || product.price <= 0) {
    showErrorMessage("Цена должна быть положительным числом");
    return false;
  }

  return true;
}

// Редактирование товара
async function editProduct(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);

    if (!response.ok) {
      throw new Error("Товар не найден");
    }

    const product = await response.json();

    // Создаем модальное окно для редактирования
    const modal = createEditModal(product);
    document.body.appendChild(modal);
  } catch (error) {
    console.error("Ошибка загрузки товара:", error);
    showErrorMessage("Не удалось загрузить данные товара");
  }
}

// Создание модального окна для редактирования
function createEditModal(product) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Редактировать товар</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <form id="edit-product-form" class="modal-body">
                <div class="form-group">
                    <label for="edit-name">Название:</label>
                    <input type="text" id="edit-name" name="name" value="${
                      product.name
                    }" required>
                </div>
                <div class="form-group">
                    <label for="edit-description">Описание:</label>
                    <textarea id="edit-description" name="description">${
                      product.description || ""
                    }</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-price">Цена:</label>
                    <input type="number" id="edit-price" name="price" value="${
                      product.price
                    }" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="edit-image">URL изображения:</label>
                    <input type="url" id="edit-image" name="image_url" value="${
                      product.image_url || ""
                    }">
                </div>
                <div class="form-group">
                    <label for="edit-category">Категория:</label>
                    <input type="text" id="edit-category" name="category" value="${
                      product.category || ""
                    }">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal(this)">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        </div>
    `;

  // Обработчик отправки формы
  modal
    .querySelector("#edit-product-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateProduct(product.id, e.target);
      closeModal(modal.querySelector(".modal-close"));
    });

  return modal;
}

// Обновление товара
async function updateProduct(productId, form) {
  const formData = new FormData(form);
  const productData = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: parseFloat(formData.get("price")),
    image_url: formData.get("image_url"),
    category: formData.get("category"),
  };

  if (!validateProduct(productData)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });

    const result = await response.json();

    if (response.ok) {
      showSuccessMessage("Товар успешно обновлен!");
      loadProductList();
    } else {
      throw new Error(result.error || "Ошибка обновления товара");
    }
  } catch (error) {
    console.error("Ошибка обновления товара:", error);
    showErrorMessage("Ошибка обновления товара: " + error.message);
  }
}

// Переключение доступности товара
async function toggleProductStock(productId, inStock) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ in_stock: inStock }),
    });

    const result = await response.json();

    if (response.ok) {
      showSuccessMessage(`Товар ${inStock ? "показан" : "скрыт"} из каталога`);
      loadProductList();
    } else {
      throw new Error(result.error || "Ошибка изменения статуса товара");
    }
  } catch (error) {
    console.error("Ошибка изменения статуса товара:", error);
    showErrorMessage("Ошибка изменения статуса товара: " + error.message);
  }
}

// Удаление товара
async function deleteProduct(productId) {
  if (
    !confirm(
      "Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (response.ok) {
      showSuccessMessage("Товар успешно удален!");
      loadProductList();
      loadStatistics();
    } else {
      throw new Error(result.error || "Ошибка удаления товара");
    }
  } catch (error) {
    console.error("Ошибка удаления товара:", error);
    showErrorMessage("Ошибка удаления товара: " + error.message);
  }
}

// Обновление списка товаров
function refreshProductList() {
  showMessage("Обновление списка товаров...", "info");
  loadProductList();
  loadStatistics();
}

// Вспомогательные функции
function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU").format(price);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("ru-RU");
}

function closeModal(button) {
  const modal = button.closest(".modal-overlay");
  if (modal) {
    modal.remove();
  }
}

function showSuccessMessage(message) {
  showMessage(message, "success");
}

function showErrorMessage(message) {
  showMessage(message, "error");
}

function showMessage(message, type) {
  // Создаем уведомление
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

  document.body.appendChild(notification);

  // Автоматически удаляем через 5 секунд
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function showProductError(message) {
  const productListElement = document.getElementById("admin-product-list");
  if (productListElement) {
    productListElement.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="loadProductList()">
                    <i class="fas fa-sync-alt"></i> Попробовать снова
                </button>
            </div>
        `;
  }
}

// Выход из системы
function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "/auth";
}
