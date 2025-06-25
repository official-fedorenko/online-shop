const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../models/database");

const router = express.Router();

// Секретный ключ для JWT
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-for-online-shop";

// Middleware для проверки токена
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

// Валидация данных регистрации
const validateRegistration = (nickname, email, password) => {
  const errors = [];

  if (!nickname || nickname.trim().length < 2) {
    errors.push("Никнейм должен содержать минимум 2 символа");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Введите корректный email");
  }

  if (!password || password.length < 6) {
    errors.push("Пароль должен содержать минимум 6 символов");
  }

  return errors;
};

// Регистрация
router.post("/register", async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

    // Валидация
    const validationErrors = validateRegistration(nickname, email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: validationErrors,
      });
    }

    // Проверяем, существует ли пользователь
    db.get(
      "SELECT * FROM users WHERE email = ? OR nickname = ?",
      [email, nickname],
      async (err, existingUser) => {
        if (err) {
          console.error("Ошибка проверки пользователя:", err);
          return res.status(500).json({ error: "Ошибка сервера" });
        }

        if (existingUser) {
          const field = existingUser.email === email ? "email" : "никнейм";
          return res.status(400).json({
            error: `Пользователь с таким ${field} уже существует`,
          });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 12);

        // Создаём пользователя
        db.run(
          "INSERT INTO users (nickname, email, password) VALUES (?, ?, ?)",
          [nickname, email, hashedPassword],
          function (err) {
            if (err) {
              console.error("Ошибка создания пользователя:", err);
              return res
                .status(500)
                .json({ error: "Ошибка создания пользователя" });
            }

            // Создаём JWT токен
            const token = jwt.sign(
              {
                id: this.lastID,
                email: email,
                nickname: nickname,
                role: "user",
              },
              JWT_SECRET,
              { expiresIn: "7d" }
            );

            res.status(201).json({
              message: "Пользователь успешно зарегистрирован",
              token: token,
              user: {
                id: this.lastID,
                nickname: nickname,
                email: email,
                role: "user",
              },
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Вход
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res
        .status(400)
        .json({ error: "Email/никнейм и пароль обязательны" });
    }

    // Ищем пользователя по email или nickname
    db.get(
      "SELECT * FROM users WHERE email = ? OR nickname = ?",
      [login, login],
      async (err, user) => {
        if (err) {
          console.error("Ошибка поиска пользователя:", err);
          return res.status(500).json({ error: "Ошибка сервера" });
        }

        if (!user) {
          return res
            .status(401)
            .json({ error: "Неверный email/никнейм или пароль" });
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ error: "Неверный email/никнейм или пароль" });
        }

        // Создаём JWT токен
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.json({
          message: "Успешный вход",
          token: token,
          user: {
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (error) {
    console.error("Ошибка входа:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Проверка токена
router.post("/verify", authenticateToken, (req, res) => {
  // Получаем актуальные данные пользователя из базы
  db.get(
    "SELECT id, nickname, email, role, created_at FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error("Ошибка получения пользователя:", err);
        return res.status(500).json({ error: "Ошибка сервера" });
      }

      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      });
    }
  );
});

module.exports = router;
