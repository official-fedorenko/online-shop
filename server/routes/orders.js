const express = require("express");
const router = express.Router();
const { db } = require("../models/database");
const jwt = require("jsonwebtoken");

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Токен не предоставлен" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Требуются права администратора" });
  }
  next();
};

// Создание нового заказа
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      items,
      customer_name,
      customer_email,
      customer_phone,
      delivery_type,
      delivery_address,
      payment_method,
      notes,
    } = req.body;

    // Валидация данных
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Корзина не может быть пустой" });
    }

    if (!customer_name || !customer_email || !customer_phone) {
      return res.status(400).json({
        message: "Заполните обязательные поля: имя, email, телефон",
      });
    }

    if (
      !delivery_type ||
      !["pickup", "courier", "delivery"].includes(delivery_type)
    ) {
      return res.status(400).json({ message: "Выберите способ доставки" });
    }

    if (
      (delivery_type === "courier" || delivery_type === "delivery") &&
      !delivery_address
    ) {
      return res.status(400).json({ message: "Укажите адрес доставки" });
    }

    if (!payment_method || !["cash", "iban"].includes(payment_method)) {
      return res.status(400).json({ message: "Выберите способ оплаты" });
    }

    // Проверяем товары и вычисляем общую стоимость
    let total_amount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Неверные данные товара" });
      }

      // Получаем актуальную информацию о товаре из базы
      const product = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM products WHERE id = ? AND in_stock = 1",
          [item.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!product) {
        return res.status(400).json({
          message: `Товар с ID ${item.id} не найден или недоступен`,
        });
      }

      const itemTotal = product.price * item.quantity;
      total_amount += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity,
        total_price: itemTotal,
      });
    }

    // Проверяем минимальную сумму заказа (€10)
    if (total_amount < 10) {
      return res.status(400).json({
        message: "Минимальная сумма заказа составляет €10",
      });
    }

    // Создаем заказ
    const orderResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO orders (
          user_id, total_amount, customer_name, customer_email, customer_phone,
          delivery_type, delivery_address, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          total_amount,
          customer_name,
          customer_email,
          customer_phone,
          delivery_type,
          delivery_address,
          payment_method,
          notes || null,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Добавляем товары в заказ
    for (const item of validatedItems) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_price, quantity, total_price
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderResult.id,
            item.product_id,
            item.product_name,
            item.product_price,
            item.quantity,
            item.total_price,
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    res.status(201).json({
      message: "Заказ успешно создан",
      orderId: orderResult.id,
      totalAmount: total_amount,
    });
  } catch (error) {
    console.error("Ошибка создания заказа:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// Получение заказов пользователя
router.get("/my", authenticateToken, (req, res) => {
  db.all(
    `SELECT o.*, 
            GROUP_CONCAT(
              oi.product_name || ' (x' || oi.quantity || ')'
            ) as items_summary
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("Ошибка получения заказов:", err);
        return res.status(500).json({ message: "Ошибка получения заказов" });
      }

      res.json(rows);
    }
  );
});

// Получение детальной информации о заказе
router.get("/:id", authenticateToken, (req, res) => {
  const orderId = req.params.id;

  // Получаем основную информацию о заказе
  db.get(
    "SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ? = 'admin')",
    [orderId, req.user.id, req.user.role],
    (err, order) => {
      if (err) {
        console.error("Ошибка получения заказа:", err);
        return res.status(500).json({ message: "Ошибка получения заказа" });
      }

      if (!order) {
        return res.status(404).json({ message: "Заказ не найден" });
      }

      // Получаем товары в заказе
      db.all(
        "SELECT * FROM order_items WHERE order_id = ?",
        [orderId],
        (err, items) => {
          if (err) {
            console.error("Ошибка получения товаров заказа:", err);
            return res
              .status(500)
              .json({ message: "Ошибка получения товаров заказа" });
          }

          res.json({
            ...order,
            items: items,
          });
        }
      );
    }
  );
});

// Получение всех заказов (только для админа)
router.get("/", authenticateToken, requireAdmin, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status;

  let whereClause = "";
  let params = [];

  if (
    status &&
    ["processing", "confirmed", "completed", "cancelled"].includes(status)
  ) {
    whereClause = "WHERE o.status = ?";
    params.push(status);
  }

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM orders o 
    ${whereClause}
  `;

  const dataQuery = `
    SELECT o.*, u.nickname as user_nickname,
           GROUP_CONCAT(
             oi.product_name || ' (x' || oi.quantity || ')'
           ) as items_summary
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;

  // Получаем общее количество заказов
  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      console.error("Ошибка подсчета заказов:", err);
      return res.status(500).json({ message: "Ошибка получения заказов" });
    }

    // Получаем данные заказов
    db.all(dataQuery, [...params, limit, offset], (err, rows) => {
      if (err) {
        console.error("Ошибка получения заказов:", err);
        return res.status(500).json({ message: "Ошибка получения заказов" });
      }

      res.json({
        orders: rows,
        pagination: {
          page: page,
          limit: limit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit),
        },
      });
    });
  });
});

// Обновление статуса заказа (только для админа)
router.patch("/:id/status", authenticateToken, requireAdmin, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (
    !status ||
    !["processing", "confirmed", "completed", "cancelled"].includes(status)
  ) {
    return res.status(400).json({
      message:
        "Недопустимый статус. Доступны: processing, confirmed, completed, cancelled",
    });
  }

  db.run(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, orderId],
    function (err) {
      if (err) {
        console.error("Ошибка обновления статуса заказа:", err);
        return res
          .status(500)
          .json({ message: "Ошибка обновления статуса заказа" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Заказ не найден" });
      }

      res.json({ message: "Статус заказа обновлен", status: status });
    }
  );
});

module.exports = router;
