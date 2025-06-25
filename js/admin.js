// ===== АДМИНКА ИНТЕРНЕТ-МАГАЗИНА =====

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

// Обработка добавления товара
async function handleAddProduct(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const productData = {
    id: Date.now(), // Простой способ генерации ID
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
    // Симуляция сохранения товара
    await saveProduct(productData);
    showSuccessMessage("Товар успешно добавлен!");
    resetForm();
  } catch (error) {
    showErrorMessage("Ошибка при добавлении товара: " + error.message);
  }
}

// Валидация данных товара
function validateProduct(product) {
  if (!product.name || product.name.trim().length < 3) {
    showErrorMessage("Название товара должно содержать минимум 3 символа");
    return false;
  }

  if (!product.price || product.price <= 0) {
    showErrorMessage("Цена должна быть больше 0");
    return false;
  }

  if (!product.description || product.description.trim().length < 10) {
    showErrorMessage("Описание должно содержать минимум 10 символов");
    return false;
  }

  if (!product.image || !isValidUrl(product.image)) {
    showErrorMessage("Необходимо указать корректный URL изображения");
    return false;
  }

  if (!product.category) {
    showErrorMessage("Необходимо выбрать категорию");
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

// Симуляция сохранения товара (в реальном проекте здесь был бы API вызов)
async function saveProduct(product) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Симуляция случайной ошибки для демонстрации
      if (Math.random() > 0.9) {
        reject(new Error("Сетевая ошибка"));
        return;
      }

      // Сохраняем в localStorage для демонстрации
      const products = getStoredProducts();
      products.push(product);
      localStorage.setItem("shop-products", JSON.stringify(products));

      resolve(product);
    }, 1000);
  });
}

// Получение товаров из localStorage
function getStoredProducts() {
  const stored = localStorage.getItem("shop-products");
  return stored ? JSON.parse(stored) : [];
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
  const successDiv = document.getElementById("success-message");
  const errorDiv = document.getElementById("error-message");

  if (errorDiv) errorDiv.style.display = "none";

  if (successDiv) {
    successDiv.style.display = "flex";
    setTimeout(() => {
      successDiv.style.display = "none";
    }, 5000);
  }
}

// Показать сообщение об ошибке
function showErrorMessage(message) {
  const errorDiv = document.getElementById("error-message");
  const successDiv = document.getElementById("success-message");
  const errorText = document.getElementById("error-text");

  if (successDiv) successDiv.style.display = "none";

  if (errorDiv && errorText) {
    errorText.textContent = message;
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

// ===== ИНИЦИАЛИЗАЦИЯ АДМИН ПАНЕЛИ =====
function initializeAdminPanel(user) {
  // Показываем имя администратора
  const adminName = document.getElementById("admin-name");
  if (adminName) {
    adminName.textContent = `${user.firstName} ${user.lastName}`;
  }

  // Загружаем статистику
  loadDashboardStats();

  // Загружаем список товаров для управления
  loadAdminProductList();
}

// Загрузка статистики для дашборда
function loadDashboardStats() {
  const products = getStoredProducts();
  const users = getUsers();

  // Подсчитываем статистику
  const totalProducts = products.length;
  const totalUsers = users.filter((user) => user.role === "user").length;
  const totalAdmins = users.filter((user) => user.role === "admin").length;

  // Обновляем элементы на странице
  updateStatElement("total-products", totalProducts);
  updateStatElement("total-users", totalUsers);
  updateStatElement("total-admins", totalAdmins);
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
function loadAdminProductList() {
  const productList = document.getElementById("admin-product-list");
  if (!productList) return;

  const products = getStoredProducts();

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
                <div class="admin-product-price">${product.price} ₽</div>
                ${
                  product.category
                    ? `<span class="admin-product-category">${getCategoryName(
                        product.category
                      )}</span>`
                    : ""
                }
                <p class="admin-product-description">${product.description}</p>
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
function editProduct(productId) {
  const products = getStoredProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    alert("Товар не найден!");
    return;
  }

  // Здесь можно открыть модальное окно редактирования
  // Для простоты демонстрации используем prompt
  const newName = prompt("Новое название товара:", product.name);
  if (newName === null) return;

  const newPrice = prompt("Новая цена товара:", product.price);
  if (newPrice === null) return;

  const newDescription = prompt("Новое описание товара:", product.description);
  if (newDescription === null) return;

  // Обновляем товар
  product.name = newName.trim();
  product.price = parseFloat(newPrice);
  product.description = newDescription.trim();

  // Сохраняем изменения
  const updatedProducts = products.map((p) =>
    p.id === productId ? product : p
  );
  localStorage.setItem("shop-products", JSON.stringify(updatedProducts));

  // Обновляем отображение
  loadAdminProductList();
  showMessage("Товар успешно обновлен!", "success");
}

// Удаление товара
function deleteProduct(productId) {
  const products = getStoredProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    alert("Товар не найден!");
    return;
  }

  if (confirm(`Вы уверены, что хотите удалить товар "${product.name}"?`)) {
    const updatedProducts = products.filter((p) => p.id !== productId);
    localStorage.setItem("shop-products", JSON.stringify(updatedProducts));

    // Обновляем отображение
    loadAdminProductList();
    loadDashboardStats();
    showMessage("Товар успешно удален!", "success");
  }
}
