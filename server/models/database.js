const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");

// Определяем путь к базе данных в зависимости от среды
let dbPath;
if (process.env.NODE_ENV === "production") {
  // В продакшене пробуем разные варианты
  const possiblePaths = ["/tmp", process.cwd(), __dirname];
  let tmpDir = null;

  for (const testPath of possiblePaths) {
    try {
      if (fs.existsSync(testPath)) {
        // Проверяем права на запись
        const testFile = path.join(testPath, "test-write.tmp");
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        tmpDir = testPath;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!tmpDir) {
    console.error("❌ Не удалось найти папку для базы данных");
    process.exit(1);
  }

  dbPath = path.join(tmpDir, "shop.db");
  console.log("🚀 Продакшен режим: используем", tmpDir, "для базы данных");
} else {
  // В разработке используем локальную папку db
  const dbDir = path.join(__dirname, "../db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, "shop.db");
  console.log("🔧 Режим разработки: используем локальную папку db");
}

// Создаём соединение с базой данных
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Ошибка подключения к базе данных:", err.message);
    console.error("📂 Путь к базе:", dbPath);
    process.exit(1);
  } else {
    console.log("✅ Подключение к SQLite базе данных установлено");
    console.log("📂 Файл базы данных:", dbPath);
    console.log("🔧 Среда:", process.env.NODE_ENV || "development");
  }
});

// Проверяем, что база данных работает
db.get("SELECT 1", (err) => {
  if (err) {
    console.error("❌ База данных не отвечает:", err.message);
    process.exit(1);
  } else {
    console.log("✅ База данных готова к работе");
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

      // Создание таблицы заказов
      db.run(
        `
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    total_amount REAL NOT NULL,
                    status TEXT DEFAULT 'processing',
                    customer_name TEXT NOT NULL,
                    customer_email TEXT NOT NULL,
                    customer_phone TEXT NOT NULL,
                    delivery_type TEXT NOT NULL,
                    delivery_address TEXT,
                    payment_method TEXT NOT NULL,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `,
        (err) => {
          if (err) {
            console.error("Ошибка создания таблицы orders:", err);
            reject(err);
            return;
          }
          console.log("✅ Таблица orders создана или уже существует");
        }
      );

      // Создание таблицы товаров в заказе
      db.run(
        `
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    product_price REAL NOT NULL,
                    quantity INTEGER NOT NULL,
                    total_price REAL NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders (id),
                    FOREIGN KEY (product_id) REFERENCES products (id)
                )
            `,
        (err) => {
          if (err) {
            console.error("Ошибка создания таблицы order_items:", err);
            reject(err);
            return;
          }
          console.log("✅ Таблица order_items создана или уже существует");
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
    const adminEmail = "official.fedorenko@gmail.com";
    const adminNickname = "Meliowar";
    const adminPassword = "1234qwer";

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
                console.log("   Email: official.fedorenko@gmail.com");
                console.log("   Nickname: Meliowar");
                console.log("   Password: 1234qwer");
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
            price: 899.99,
            image_url: "https://via.placeholder.com/300x300?text=iPhone+15+Pro",
            category: "Смартфоны",
          },
          {
            name: "MacBook Air M2",
            description: "Ультрабук Apple на чипе M2",
            price: 1299.99,
            image_url: "https://via.placeholder.com/300x300?text=MacBook+Air",
            category: "Ноутбуки",
          },
          {
            name: "Samsung Galaxy S24",
            description: "Флагманский Android смартфон",
            price: 799.99,
            image_url: "https://via.placeholder.com/300x300?text=Galaxy+S24",
            category: "Смартфоны",
          },
          {
            name: 'iPad Pro 12.9"',
            description: "Профессиональный планшет Apple",
            price: 999.99,
            image_url: "https://via.placeholder.com/300x300?text=iPad+Pro",
            category: "Планшеты",
          },
          {
            name: "AirPods Pro 2",
            description: "Беспроводные наушники с шумоподавлением",
            price: 249.99,
            image_url: "https://via.placeholder.com/300x300?text=AirPods+Pro",
            category: "Аудио",
          },
          {
            name: "Xiaomi Redmi Note 13",
            description: "Доступный смартфон с хорошими характеристиками",
            price: 189.99,
            image_url: "https://via.placeholder.com/300x300?text=Redmi+Note+13",
            category: "Смартфоны",
          },
          {
            name: "Беспроводная мышь Logitech",
            description: "Эргономичная беспроводная мышь для работы",
            price: 29.99,
            image_url:
              "https://via.placeholder.com/300x300?text=Logitech+Mouse",
            category: "Аксессуары",
          },
          {
            name: "USB-C кабель",
            description: "Качественный кабель для быстрой зарядки",
            price: 12.99,
            image_url: "https://via.placeholder.com/300x300?text=USB-C+Cable",
            category: "Аксессуары",
          },
          {
            name: "Защитное стекло iPhone",
            description: "Прочное защитное стекло для экрана",
            price: 9.99,
            image_url: "https://via.placeholder.com/300x300?text=Screen+Glass",
            category: "Аксессуары",
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
