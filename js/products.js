// ===== СИСТЕМА УПРАВЛЕНИЯ ТОВАРАМИ (API) =====

// Базовый URL API (автоматически определяется)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

const productListElement = document.getElementById("product-list");

// Загрузка товаров с сервера
async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayProducts(data.products);
  } catch (error) {
    console.error("Ошибка загрузки товаров:", error);
    showErrorMessage(
      "Не удалось загрузить товары. Проверьте подключение к интернету."
    );
  }
}

// Отображение товаров
function displayProducts(products) {
  if (!productListElement) {
    console.error("Элемент product-list не найден");
    return;
  }

  productListElement.innerHTML = "";

  if (!products || products.length === 0) {
    productListElement.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>Товары не найдены</h3>
                <p>В настоящее время товары отсутствуют</p>
            </div>
        `;
    return;
  }

  products.forEach((product) => {
    const productTile = document.createElement("div");
    productTile.className = "product-tile";
    productTile.setAttribute("data-product-id", product.id);
    productTile.innerHTML = `
            <div class="product-image">
                <img src="${
                  product.image_url ||
                  "https://via.placeholder.com/300x300?text=No+Image"
                }" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'" />
                ${
                  !product.in_stock
                    ? '<div class="out-of-stock-badge">Нет в наличии</div>'
                    : ""
                }
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="product-category">${
                      product.category || "Без категории"
                    }</span>
                    <span class="product-price">€${product.price.toFixed(
                      2
                    )}</span>
                </div>
                <div class="product-actions">
                    ${
                      product.in_stock
                        ? `<button class="btn btn-primary" onclick="addToCart(${product.id})">
                            <i class="fas fa-shopping-cart"></i> В корзину
                        </button>`
                        : `<button class="btn btn-secondary" disabled>
                            <i class="fas fa-times"></i> Нет в наличии
                        </button>`
                    }
                </div>
            </div>
        `;
    productListElement.appendChild(productTile);
  });
}

// Форматирование цены
function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU").format(price);
}

// Показать сообщение об ошибке
function showErrorMessage(message) {
  if (productListElement) {
    productListElement.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="fetchProducts()">
                    <i class="fas fa-sync-alt"></i> Попробовать снова
                </button>
            </div>
        `;
  }
}

// Добавление товара в корзину
function addToCart(productId) {
  // Эта функция определена в cart.js
  console.log("Добавление товара в корзину:", productId);
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", fetchProducts);
