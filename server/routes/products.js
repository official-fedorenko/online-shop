const express = require("express");
const { db } = require("../models/database");

const router = express.Router();

// Middleware для проверки токена (импортируем из auth.js)
const jwt = require("jsonwebtoken");
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-for-online-shop";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Токен доступа не предоставлен" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
};

// Middleware для проверки прав администратора
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Доступ запрещен. Требуются права администратора." });
  }
  next();
};

// Получить все товары
router.get("/", (req, res) => {
  const query = `
        SELECT id, name, description, price, image_url, category, in_stock, 
               created_at, updated_at 
        FROM products 
        ORDER BY created_at DESC
    `;

  db.all(query, (err, products) => {
    if (err) {
      console.error("Ошибка получения товаров:", err);
      return res.status(500).json({ error: "Ошибка получения товаров" });
    }

    res.json({
      products: products,
      total: products.length,
    });
  });
});

// Получить товар по ID
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
    if (err) {
      console.error("Ошибка получения товара:", err);
      return res.status(500).json({ error: "Ошибка получения товара" });
    }

    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    res.json(product);
  });
});

// Создать новый товар (только для админов)
router.post("/", authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, image_url, category } = req.body;

  // Валидация
  if (!name || !price) {
    return res.status(400).json({
      error: "Название и цена товара обязательны",
    });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({
      error: "Цена должна быть положительным числом",
    });
  }

  db.run(
    `INSERT INTO products (name, description, price, image_url, category) 
         VALUES (?, ?, ?, ?, ?)`,
    [name, description || "", price, image_url || "", category || ""],
    function (err) {
      if (err) {
        console.error("Ошибка создания товара:", err);
        return res.status(500).json({ error: "Ошибка создания товара" });
      }

      // Получаем созданный товар
      db.get(
        "SELECT * FROM products WHERE id = ?",
        [this.lastID],
        (err, product) => {
          if (err) {
            console.error("Ошибка получения созданного товара:", err);
            return res
              .status(500)
              .json({
                error: "Товар создан, но произошла ошибка получения данных",
              });
          }

          res.status(201).json({
            message: "Товар успешно создан",
            product: product,
          });
        }
      );
    }
  );
});

// Обновить товар (только для админов)
router.put("/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, category, in_stock } = req.body;

  // Проверяем, существует ли товар
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
    if (err) {
      console.error("Ошибка поиска товара:", err);
      return res.status(500).json({ error: "Ошибка поиска товара" });
    }

    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    // Валидация
    if (price && (isNaN(price) || price <= 0)) {
      return res.status(400).json({
        error: "Цена должна быть положительным числом",
      });
    }

    // Обновляем только переданные поля
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (price !== undefined) {
      updates.push("price = ?");
      values.push(price);
    }
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(image_url);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category);
    }
    if (in_stock !== undefined) {
      updates.push("in_stock = ?");
      values.push(in_stock ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Нет данных для обновления" });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const query = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) {
        console.error("Ошибка обновления товара:", err);
        return res.status(500).json({ error: "Ошибка обновления товара" });
      }

      // Получаем обновленный товар
      db.get(
        "SELECT * FROM products WHERE id = ?",
        [id],
        (err, updatedProduct) => {
          if (err) {
            console.error("Ошибка получения обновленного товара:", err);
            return res
              .status(500)
              .json({
                error: "Товар обновлен, но произошла ошибка получения данных",
              });
          }

          res.json({
            message: "Товар успешно обновлен",
            product: updatedProduct,
          });
        }
      );
    });
  });
});

// Удалить товар (только для админов)
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Проверяем, существует ли товар
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
    if (err) {
      console.error("Ошибка поиска товара:", err);
      return res.status(500).json({ error: "Ошибка поиска товара" });
    }

    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    // Удаляем товар
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("Ошибка удаления товара:", err);
        return res.status(500).json({ error: "Ошибка удаления товара" });
      }

      res.json({
        message: "Товар успешно удален",
        deletedProduct: product,
      });
    });
  });
});

// Поиск товаров
router.get("/search/:query", (req, res) => {
  const { query } = req.params;
  const searchTerm = `%${query}%`;

  db.all(
    `SELECT * FROM products 
         WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
         ORDER BY created_at DESC`,
    [searchTerm, searchTerm, searchTerm],
    (err, products) => {
      if (err) {
        console.error("Ошибка поиска товаров:", err);
        return res.status(500).json({ error: "Ошибка поиска товаров" });
      }

      res.json({
        products: products,
        total: products.length,
        query: query,
      });
    }
  );
});

module.exports = router;
