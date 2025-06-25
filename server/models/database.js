const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "../db/shop.db");

// Создаём соединение с базой данных
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.message);
  } else {
    console.log("✅ Подключение к SQLite базе данных установлено");
  }
});

// Инициализация базы данных
const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Создание таблицы пользователей
      db.run(
        `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nickname TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
        (err) => {
          if (err) {
            console.error("Ошибка создания таблицы users:", err);
            reject(err);
            return;
          }
          console.log("✅ Таблица users создана или уже существует");
        }
      );

      // Создание таблицы товаров
      db.run(
        `
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    price REAL NOT NULL,
                    image_url TEXT,
                    category TEXT,
                    in_stock BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
        (err) => {
          if (err) {
            console.error("Ошибка создания таблицы products:", err);
            reject(err);
            return;
          }
          console.log("✅ Таблица products создана или уже существует");
        }
      );

      // Создание администратора по умолчанию
      createDefaultAdmin()
        .then(() => {
          // Создание демо товаров
          createDemoProducts()
            .then(() => {
              console.log("✅ База данных инициализирована");
              resolve();
            })
            .catch(reject);
        })
        .catch(reject);
    });
  });
};

// Создание администратора по умолчанию
const createDefaultAdmin = async () => {
  return new Promise((resolve, reject) => {
    const adminEmail = "admin@shop.com";
    const adminNickname = "Admin";
    const adminPassword = "admin123";

    // Проверяем, существует ли уже администратор
    db.get(
      "SELECT id FROM users WHERE email = ? OR nickname = ?",
      [adminEmail, adminNickname],
      async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          // Создаём администратора
          const hashedPassword = await bcrypt.hash(adminPassword, 12);
          db.run(
            "INSERT INTO users (nickname, email, password, role) VALUES (?, ?, ?, ?)",
            [adminNickname, adminEmail, hashedPassword, "admin"],
            (err) => {
              if (err) {
                reject(err);
              } else {
                console.log("✅ Администратор по умолчанию создан");
                console.log("   Email: admin@shop.com");
                console.log("   Nickname: Admin");
                console.log("   Password: admin123");
                resolve();
              }
            }
          );
        } else {
          console.log("✅ Администратор уже существует");
          resolve();
        }
      }
    );
  });
};

// Создание демо товаров
const createDemoProducts = async () => {
  return new Promise((resolve, reject) => {
    // Проверяем, есть ли уже товары
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count === 0) {
        const demoProducts = [
          {
            name: "iPhone 15 Pro",
            description: "Новейший смартфон Apple с титановым корпусом",
            price: 89999,
            image_url: "https://via.placeholder.com/300x300?text=iPhone+15+Pro",
            category: "Смартфоны",
          },
          {
            name: "MacBook Air M2",
            description: "Ультрабук Apple на чипе M2",
            price: 129999,
            image_url: "https://via.placeholder.com/300x300?text=MacBook+Air",
            category: "Ноутбуки",
          },
          {
            name: "Samsung Galaxy S24",
            description: "Флагманский Android смартфон",
            price: 79999,
            image_url: "https://via.placeholder.com/300x300?text=Galaxy+S24",
            category: "Смартфоны",
          },
          {
            name: 'iPad Pro 12.9"',
            description: "Профессиональный планшет Apple",
            price: 99999,
            image_url: "https://via.placeholder.com/300x300?text=iPad+Pro",
            category: "Планшеты",
          },
          {
            name: "AirPods Pro 2",
            description: "Беспроводные наушники с шумоподавлением",
            price: 24999,
            image_url: "https://via.placeholder.com/300x300?text=AirPods+Pro",
            category: "Аудио",
          },
        ];

        let completed = 0;
        demoProducts.forEach((product) => {
          db.run(
            "INSERT INTO products (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)",
            [
              product.name,
              product.description,
              product.price,
              product.image_url,
              product.category,
            ],
            (err) => {
              if (err) {
                console.error("Ошибка создания демо товара:", err);
              }
              completed++;
              if (completed === demoProducts.length) {
                console.log("✅ Демо товары созданы");
                resolve();
              }
            }
          );
        });
      } else {
        console.log("✅ Товары уже существуют");
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
};
