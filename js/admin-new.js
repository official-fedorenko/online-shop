// ===== АДМИНКА ИНТЕРНЕТ-МАГАЗИНА (API) =====

// Базовый URL API
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

document.addEventListener("DOMContentLoaded", function () {
  initializeAdmin();
});

function initializeAdmin() {
  const addProductForm = document.getElementById("add-product-form");
  const imageInput = document.getElementById("product-image");

  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
  }

  if (imageInput) {
    imageInput.addEventListener("input", handleImagePreview);
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ АДМИН ПАНЕЛИ =====
function initializeAdminPanel(user) {
  // Показываем имя администратора
  const adminName = document.getElementById("admin-name");
  if (adminName) {
    adminName.textContent = user.nickname;
  }

  // Загружаем статистику
  loadDashboardStats();

  // Загружаем список товаров для управления
  loadAdminProductList();
}

// Загрузка статистики для дашборда
async function loadDashboardStats() {
  try {
    const token = getAuthToken();

    // Получаем статистику пользователей
    const usersResponse = await fetch(`${API_BASE_URL}/users/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Получаем товары
    const productsResponse = await fetch(`${API_BASE_URL}/products`);

    if (usersResponse.ok && productsResponse.ok) {
      const usersData = await usersResponse.json();
      const productsData = await productsResponse.json();

      // Обновляем элементы на странице
      updateStatElement("total-products", productsData.products.length);
      updateStatElement("total-users", usersData.totalUsers);
      updateStatElement("total-admins", usersData.totalAdmins);
    }
  } catch (error) {
    console.error("Error loading stats:", error);
    // Показываем базовые значения
    updateStatElement("total-products", 0);
    updateStatElement("total-users", 0);
    updateStatElement("total-admins", 1);
  }
}

// Обновление элемента статистики
function updateStatElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    // Анимация счетчика
    animateCounter(element, 0, value, 1000);
  }
}

// Анимация счетчика
function animateCounter(element, start, end, duration) {
  const startTime = performance.now();

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const current = Math.floor(start + (end - start) * progress);
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    }
  }

  requestAnimationFrame(updateCounter);
}

// Загрузка списка товаров для админки
async function loadAdminProductList() {
  const productList = document.getElementById("admin-product-list");
  if (!productList) return;

  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    const data = await response.json();

    if (response.ok && data.products) {
      const products = data.products;

      if (products.length === 0) {
        productList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                        <h3>Товары не найдены</h3>
                        <p>Добавьте первый товар, чтобы начать работу</p>
                        <button class="btn btn-primary" onclick="window.location.href='add-product.html'">
                            <i class="fas fa-plus"></i> Добавить товар
                        </button>
                    </div>
                `;
        return;
      }

      productList.innerHTML = products
        .map(
          (product) => `
                <div class="admin-product-item" data-product-id="${product.id}">
                    <img src="${product.image}" alt="${
            product.name
          }" class="admin-product-image" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPtCY0LfQvtCx0YDQsNC20LXQvdC40LU8L3RleHQ+PC9zdmc+'">
                    <div class="admin-product-info">
                        <h3 class="admin-product-title">${product.name}</h3>
                        <div class="admin-product-price">${
                          product.price
                        } ₽</div>
                        ${
                          product.category
                            ? `<span class="admin-product-category">${getCategoryName(
                                product.category
                              )}</span>`
                            : ""
                        }
                        <p class="admin-product-description">${
                          product.description
                        }</p>
                        <div class="admin-product-actions">
                            <button class="btn btn-edit" onclick="editProduct(${
                              product.id
                            })">
                                <i class="fas fa-edit"></i> Изменить
                            </button>
                            <button class="btn btn-delete" onclick="deleteProduct(${
                              product.id
                            })">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    }
  } catch (error) {
    console.error("Error loading products:", error);
    productList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                <h3>Ошибка загрузки товаров</h3>
                <p>Проверьте соединение с сервером</p>
                <button class="btn btn-secondary" onclick="loadAdminProductList()">
                    <i class="fas fa-sync-alt"></i> Повторить
                </button>
            </div>
        `;
  }
}

// Получение названия категории
function getCategoryName(category) {
  const categories = {
    electronics: "Электроника",
    clothing: "Одежда",
    books: "Книги",
    home: "Дом и сад",
    sports: "Спорт",
    other: "Другое",
  };
  return categories[category] || category;
}

// Обновление списка товаров
function refreshProductList() {
  showMessage("Обновление списка товаров...", "info");
  setTimeout(() => {
    loadAdminProductList();
    loadDashboardStats();
    showMessage("Список товаров обновлен", "success");
  }, 500);
}

// Редактирование товара
async function editProduct(productId) {
  try {
    // Получаем данные товара
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    const data = await response.json();

    if (!response.ok || !data.product) {
      alert("Товар не найден!");
      return;
    }

    const product = data.product;

    // Простой способ редактирования через prompt (можно заменить на модальное окно)
    const newName = prompt("Новое название товара:", product.name);
    if (newName === null) return;

    const newPrice = prompt("Новая цена товара:", product.price);
    if (newPrice === null) return;

    const newDescription = prompt(
      "Новое описание товара:",
      product.description
    );
    if (newDescription === null) return;

    // Отправляем обновленные данные
    const token = getAuthToken();
    const updateResponse = await fetch(
      `${API_BASE_URL}/products/${productId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          price: parseFloat(newPrice),
          description: newDescription.trim(),
          image: product.image,
          category: product.category,
        }),
      }
    );

    const updateData = await updateResponse.json();

    if (updateResponse.ok) {
      showMessage("Товар успешно обновлен!", "success");
      loadAdminProductList();
    } else {
      showMessage(
        updateData.message || "Ошибка при обновлении товара",
        "error"
      );
    }
  } catch (error) {
    console.error("Error editing product:", error);
    showMessage("Ошибка соединения с сервером", "error");
  }
}

// Удаление товара
async function deleteProduct(productId) {
  try {
    // Получаем данные товара для подтверждения
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    const data = await response.json();

    if (!response.ok || !data.product) {
      alert("Товар не найден!");
      return;
    }

    const product = data.product;

    if (confirm(`Вы уверены, что хотите удалить товар "${product.name}"?`)) {
      const token = getAuthToken();
      const deleteResponse = await fetch(
        `${API_BASE_URL}/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const deleteData = await deleteResponse.json();

      if (deleteResponse.ok) {
        showMessage("Товар успешно удален!", "success");
        loadAdminProductList();
        loadDashboardStats();
      } else {
        showMessage(
          deleteData.message || "Ошибка при удалении товара",
          "error"
        );
      }
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    showMessage("Ошибка соединения с сервером", "error");
  }
}

// Обработка добавления товара
async function handleAddProduct(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const productData = {
    name: formData.get("name"),
    price: parseFloat(formData.get("price")),
    description: formData.get("description"),
    image: formData.get("image"),
    category: formData.get("category"),
  };

  // Валидация
  if (!validateProduct(productData)) {
    return;
  }

  try {
    showMessage("Добавление товара...", "info");

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("Товар успешно добавлен!", "success");
      resetForm();
    } else {
      showMessage(data.message || "Ошибка при добавлении товара", "error");
    }
  } catch (error) {
    console.error("Error adding product:", error);
    showMessage("Ошибка соединения с сервером", "error");
  }
}

// Валидация данных товара
function validateProduct(product) {
  if (!product.name || product.name.trim().length < 3) {
    showMessage("Название товара должно содержать минимум 3 символа", "error");
    return false;
  }

  if (!product.price || product.price <= 0) {
    showMessage("Цена должна быть больше 0", "error");
    return false;
  }

  if (!product.description || product.description.trim().length < 10) {
    showMessage("Описание должно содержать минимум 10 символов", "error");
    return false;
  }

  if (!product.image || !isValidUrl(product.image)) {
    showMessage("Необходимо указать корректный URL изображения", "error");
    return false;
  }

  if (!product.category) {
    showMessage("Необходимо выбрать категорию", "error");
    return false;
  }

  return true;
}

// Проверка корректности URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Предварительный просмотр изображения
function handleImagePreview(event) {
  const url = event.target.value;
  const preview = document.getElementById("image-preview");

  if (url && isValidUrl(url)) {
    const img = document.createElement("img");
    img.src = url;
    img.onload = function () {
      preview.innerHTML = "";
      preview.appendChild(img);
      preview.classList.add("has-image");
    };
    img.onerror = function () {
      preview.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Не удалось загрузить изображение</span>
            `;
      preview.classList.remove("has-image");
    };
  } else {
    preview.innerHTML = `
            <i class="fas fa-image"></i>
            <span>Предварительный просмотр изображения</span>
        `;
    preview.classList.remove("has-image");
  }
}

// Показать сообщение об успехе
function showSuccessMessage(message) {
  showMessage(message, "success");
}

// Показать сообщение об ошибке
function showErrorMessage(message) {
  showMessage(message, "error");
}

// Универсальная функция показа сообщений
function showMessage(text, type = "info") {
  const successDiv = document.getElementById("success-message");
  const errorDiv = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");

  // Скрываем все сообщения
  if (successDiv) successDiv.style.display = "none";
  if (errorDiv) errorDiv.style.display = "none";

  if (type === "success" && successDiv) {
    successDiv.style.display = "flex";
    setTimeout(() => {
      successDiv.style.display = "none";
    }, 5000);
  } else if (type === "error" && errorDiv && errorText) {
    errorText.textContent = text;
    errorDiv.style.display = "flex";
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }
}

// Очистка формы
function resetForm() {
  const form = document.getElementById("add-product-form");
  const preview = document.getElementById("image-preview");

  if (form) {
    form.reset();
  }

  if (preview) {
    preview.innerHTML = `
            <i class="fas fa-image"></i>
            <span>Предварительный просмотр изображения</span>
        `;
    preview.classList.remove("has-image");
  }
}

// Функция для кнопки "Очистить"
window.resetForm = resetForm;
