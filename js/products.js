// ===== СИСТЕМА УПРАВЛЕНИЯ ТОВАРАМИ (API) =====

// Базовый URL API (автоматически определяется)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

const productListElement = document.getElementById("product-list");

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  if (productListElement) {
    fetchProducts();
  }
});

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
        <img src="${
          product.image_url ||
          "https://via.placeholder.com/300x300?text=No+Image"
        }" 
             alt="${product.name}" 
             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'" />
        
        <div class="category">${product.category || "Без категории"}</div>
        
        <h3>${product.name}</h3>
        
        <div class="description">${product.description || ""}</div>
        
        <div class="price">€${product.price.toFixed(2)}</div>
        
        <button class="add-to-cart-btn" 
                onclick="addToCart(${product.id})" 
                ${!product.in_stock ? "disabled" : ""}>
            <i class="fas fa-shopping-cart"></i> 
            ${product.in_stock ? "В корзину" : "Нет в наличии"}
        </button>
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
