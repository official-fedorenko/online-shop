// cart.js - Управление корзиной покупок

class Cart {
  constructor() {
    this.items = this.loadFromStorage();
    this.updateCartDisplay();
  }

  // Загрузка корзины из localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Ошибка загрузки корзины:", error);
      return [];
    }
  }

  // Сохранение корзины в localStorage
  saveToStorage() {
    try {
      localStorage.setItem("cart", JSON.stringify(this.items));
    } catch (error) {
      console.error("Ошибка сохранения корзины:", error);
    }
  }

  // Добавление товара в корзину
  addItem(product, quantity = 1) {
    // Проверяем авторизацию
    if (!this.isUserLoggedIn()) {
      alert("Для добавления товаров в корзину необходимо войти в систему");
      window.location.href = "/auth";
      return false;
    }

    const existingItem = this.items.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: quantity,
      });
    }

    this.saveToStorage();
    this.updateCartDisplay();
    this.showNotification(`${product.name} добавлен в корзину`);
    return true;
  }

  // Удаление товара из корзины
  removeItem(productId) {
    this.items = this.items.filter((item) => item.id !== productId);
    this.saveToStorage();
    this.updateCartDisplay();
  }

  // Обновление количества товара
  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const item = this.items.find((item) => item.id === productId);
    if (item) {
      item.quantity = quantity;
      this.saveToStorage();
      this.updateCartDisplay();
    }
  }

  // Очистка корзины
  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateCartDisplay();
  }

  // Получение общего количества товаров
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Получение общей стоимости
  getTotalPrice() {
    return this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  // Проверка авторизации пользователя
  isUserLoggedIn() {
    const token = localStorage.getItem("token");
    return token && token !== "null" && token !== "undefined";
  }

  // Обновление отображения корзины
  updateCartDisplay() {
    const cartCount = document.querySelector(".cart-count");
    const cartTotal = document.querySelector(".cart-total");

    if (cartCount) {
      const totalItems = this.getTotalItems();
      cartCount.textContent = totalItems;
      cartCount.style.display = totalItems > 0 ? "inline" : "none";
    }

    if (cartTotal) {
      cartTotal.textContent = `€${this.getTotalPrice().toFixed(2)}`;
    }

    // Обновляем отображение корзины на странице корзины
    if (document.querySelector(".cart-page")) {
      this.renderCartPage();
    }
  }

  // Отображение корзины на странице корзины
  renderCartPage() {
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartSummary = document.querySelector(".cart-summary");

    if (!cartItemsContainer) return;

    if (this.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <h3>Ваша корзина пуста</h3>
          <p>Добавьте товары из каталога</p>
          <a href="/" class="btn btn-primary">Перейти к покупкам</a>
        </div>
      `;
      if (cartSummary) cartSummary.style.display = "none";
      return;
    }

    cartItemsContainer.innerHTML = this.items
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p class="cart-item-price">€${item.price.toFixed(2)}</p>
        </div>
        <div class="cart-item-controls">
          <button class="quantity-btn minus" onclick="cart.updateQuantity(${
            item.id
          }, ${item.quantity - 1})">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn plus" onclick="cart.updateQuantity(${
            item.id
          }, ${item.quantity + 1})">+</button>
        </div>
        <div class="cart-item-total">
          €${(item.price * item.quantity).toFixed(2)}
        </div>
        <button class="remove-btn" onclick="cart.removeItem(${
          item.id
        })">×</button>
      </div>
    `
      )
      .join("");

    if (cartSummary) {
      cartSummary.style.display = "block";
      const totalPrice = this.getTotalPrice();
      const isMinimumMet = totalPrice >= 10;

      cartSummary.innerHTML = `
        <div class="summary-row">
          <span>Товары (${this.getTotalItems()} шт.):</span>
          <span>€${totalPrice.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Итого:</span>
          <span>€${totalPrice.toFixed(2)}</span>
        </div>
        ${
          !isMinimumMet
            ? `
          <div class="minimum-order-warning">
            Минимальная сумма заказа: €10.00<br>
            Добавьте товаров на €${(10 - totalPrice).toFixed(2)}
          </div>
        `
            : ""
        }
        <button class="btn btn-primary checkout-btn" 
                ${!isMinimumMet ? "disabled" : ""}
                onclick="window.location.href='/checkout'">
          Оформить заказ
        </button>
      `;
    }
  }

  // Показ уведомления
  showNotification(message) {
    // Создаем уведомление
    const notification = document.createElement("div");
    notification.className = "cart-notification";
    notification.textContent = message;

    // Добавляем стили
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "#4CAF50",
      color: "white",
      padding: "15px 20px",
      borderRadius: "5px",
      zIndex: "1000",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
    });

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 10);

    // Удаление через 3 секунды
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Создаем глобальный экземпляр корзины
const cart = new Cart();

// Функции для использования в HTML
function addToCart(productId) {
  // Получаем данные товара из DOM или API
  const productElement = document.querySelector(
    `[data-product-id="${productId}"]`
  );
  if (!productElement) {
    console.error("Товар не найден");
    return;
  }

  const product = {
    id: parseInt(productId),
    name: productElement.querySelector(".product-name").textContent,
    price: parseFloat(
      productElement
        .querySelector(".product-price")
        .textContent.replace("€", "")
    ),
    image_url: productElement.querySelector(".product-image").src,
  };

  cart.addItem(product);
}

// Экспорт для использования в других модулях
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Cart };
}
