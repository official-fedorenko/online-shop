const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

console.log("🚀 Запуск сервера интернет-магазина...");
console.log("🔧 NODE_ENV:", process.env.NODE_ENV || "development");
console.log("🌐 PORT:", process.env.PORT || 3000);

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const { initDatabase } = require("./models/database");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы - frontend в корне проекта
app.use(express.static(path.join(__dirname, "../")));

// API маршруты
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);

// Маршруты для фронтенда
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "../auth.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin/index.html"));
});

app.get("/admin/add-product", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin/add-product.html"));
});

// Главная страница API
app.get("/api", (req, res) => {
  res.json({
    message: "Online Shop API работает!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth (POST /register, POST /login, POST /verify)",
      products: "/api/products (GET, POST, PUT, DELETE)",
      users: "/api/users (GET, PUT, DELETE)",
    },
  });
});

// Обработка SPA маршрутов
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  // Для всех остальных маршрутов отправляем главную страницу
  res.sendFile(path.join(__dirname, "../index.html"));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Что-то пошло не так!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;

// Инициализация базы данных и запуск сервера
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 API доступно по адресу: http://localhost:${PORT}/api`);
      console.log(`🌐 Фронтенд доступен по адресу: http://localhost:${PORT}`);
      console.log(`📂 Среда: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("❌ Ошибка инициализации базы данных:", err);
    process.exit(1);
  });

module.exports = app;
