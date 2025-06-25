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

// Получить статистику пользователей (только для админов)
router.get("/stats", authenticateToken, requireAdmin, (req, res) => {
  const queries = [
    // Общее количество пользователей
    "SELECT COUNT(*) as totalUsers FROM users",
    // Количество администраторов
    'SELECT COUNT(*) as totalAdmins FROM users WHERE role = "admin"',
    // Количество обычных пользователей
    'SELECT COUNT(*) as totalRegularUsers FROM users WHERE role = "user"',
  ];

  Promise.all(
    queries.map((query) => {
      return new Promise((resolve, reject) => {
        db.get(query, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    })
  )
    .then((results) => {
      res.json({
        totalUsers: results[0].totalUsers,
        totalAdmins: results[1].totalAdmins,
        totalRegularUsers: results[2].totalRegularUsers,
      });
    })
    .catch((err) => {
      console.error("Ошибка получения статистики пользователей:", err);
      res.status(500).json({ error: "Ошибка получения статистики" });
    });
});

// Получить список всех пользователей (только для админов)
router.get("/", authenticateToken, requireAdmin, (req, res) => {
  const query = `
        SELECT id, nickname, email, role, created_at 
        FROM users 
        ORDER BY created_at DESC
    `;

  db.all(query, (err, users) => {
    if (err) {
      console.error("Ошибка получения пользователей:", err);
      return res.status(500).json({ error: "Ошибка получения пользователей" });
    }

    res.json({
      users: users,
      total: users.length,
    });
  });
});

// Получить профиль текущего пользователя
router.get("/profile", authenticateToken, (req, res) => {
  db.get(
    "SELECT id, nickname, email, role, created_at FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error("Ошибка получения профиля:", err);
        return res.status(500).json({ error: "Ошибка получения профиля" });
      }

      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      res.json(user);
    }
  );
});

// Получить пользователя по ID (только для админов)
router.get("/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.get(
    "SELECT id, nickname, email, role, created_at FROM users WHERE id = ?",
    [id],
    (err, user) => {
      if (err) {
        console.error("Ошибка получения пользователя:", err);
        return res.status(500).json({ error: "Ошибка получения пользователя" });
      }

      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      res.json(user);
    }
  );
});

// Обновить роль пользователя (только для админов)
router.put("/:id/role", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["user", "admin"].includes(role)) {
    return res.status(400).json({
      error: 'Роль должна быть "user" или "admin"',
    });
  }

  // Проверяем, что пользователь не пытается изменить свою собственную роль
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      error: "Нельзя изменить свою собственную роль",
    });
  }

  // Проверяем, существует ли пользователь
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) {
      console.error("Ошибка поиска пользователя:", err);
      return res.status(500).json({ error: "Ошибка поиска пользователя" });
    }

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Обновляем роль
    db.run(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, id],
      function (err) {
        if (err) {
          console.error("Ошибка обновления роли:", err);
          return res.status(500).json({ error: "Ошибка обновления роли" });
        }

        res.json({
          message: `Роль пользователя ${user.nickname} изменена на ${role}`,
          user: {
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            role: role,
          },
        });
      }
    );
  });
});

// Удалить пользователя (только для админов)
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Проверяем, что пользователь не пытается удалить самого себя
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      error: "Нельзя удалить самого себя",
    });
  }

  // Проверяем, существует ли пользователь
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) {
      console.error("Ошибка поиска пользователя:", err);
      return res.status(500).json({ error: "Ошибка поиска пользователя" });
    }

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Удаляем пользователя
    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("Ошибка удаления пользователя:", err);
        return res.status(500).json({ error: "Ошибка удаления пользователя" });
      }

      res.json({
        message: `Пользователь ${user.nickname} успешно удален`,
        deletedUser: {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
        },
      });
    });
  });
});

module.exports = router;
