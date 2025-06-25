# 🛒 Интернет-магазин (Full-Stack)

Полноценный интернет-магазин с серверной авторизацией и API.

## 🚀 Быстрый старт

### Деплой на Render.com

1. **Форкните этот репозиторий** на GitHub
2. **Создайте Web Service** на [Render.com](https://render.com)
3. **Настройте деплой**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - **Root Directory**: `server`
4. **Добавьте переменные окружения**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-12345
   ```
5. **Нажмите Deploy**

### Локальный запуск

```bash
# Перейдите в папку сервера
cd server

# Установите зависимости
npm install

# Запустите сервер
npm start
```

Откройте http://localhost:3000

## 📱 Возможности

### 👤 Пользователи

- ✅ **Регистрация**: Никнейм, Email, Пароль
- ✅ **Авторизация**: JWT токены (7 дней)
- ✅ **Профили пользователей**

### 🛍️ Товары

- ✅ **Каталог товаров** с изображениями
- ✅ **Категории товаров**
- ✅ **Управление наличием**

### 🔧 Администрирование

- ✅ **Статистика** пользователей и товаров
- ✅ **CRUD товаров** (создание, редактирование, удаление)
- ✅ **Управление пользователями**

## 🎯 Демо аккаунт

**Администратор**:

- Никнейм: `Admin`
- Пароль: `admin123`

## 💻 Технологии

### Backend

- **Node.js** + **Express**
- **SQLite** база данных
- **JWT** авторизация
- **bcryptjs** для хеширования паролей

### Frontend

- **Vanilla JavaScript**
- **HTML5** + **CSS3**
- **Font Awesome** иконки
- **Fetch API** для работы с backend

## 📊 API

### Авторизация

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/verify` - Проверка токена

### Товары

- `GET /api/products` - Получить все товары
- `POST /api/products` - Создать товар (админ)
- `PUT /api/products/:id` - Обновить товар (админ)
- `DELETE /api/products/:id` - Удалить товар (админ)

### Пользователи

- `GET /api/users/stats` - Статистика (админ)
- `GET /api/users` - Список пользователей (админ)
- `GET /api/users/profile` - Профиль пользователя

## 📁 Структура проекта

```
online-shop/
├── server/              # 🚀 Backend (деплоить эту папку)
│   ├── models/
│   │   └── database.js  # SQLite модели
│   ├── routes/
│   │   ├── auth.js      # Авторизация
│   │   ├── products.js  # Товары
│   │   └── users.js     # Пользователи
│   ├── server.js        # Главный файл сервера
│   └── package.json     # Backend зависимости
├── admin/               # Админка
│   ├── index.html       # Панель администратора
│   └── add-product.html # Добавление товара
├── js/                  # Frontend JavaScript
│   ├── user-auth.js     # Авторизация
│   ├── admin.js         # Админка
│   ├── main.js          # Главная страница
│   └── products.js      # Товары
├── css/
│   └── styles.css       # Стили
├── index.html           # Главная страница
├── auth.html            # Авторизация
└── README.md
```

## 🔐 Безопасность

- ✅ Пароли хешируются с помощью **bcryptjs**
- ✅ JWT токены с истечением (7 дней)
- ✅ Валидация всех входящих данных
- ✅ CORS настроен правильно
- ✅ Проверка прав доступа для админских операций

## 🗄️ База данных

**SQLite** с автоматической инициализацией:

### Таблица `users`:

- `id` - Уникальный ID
- `nickname` - Никнейм пользователя
- `email` - Email (уникальный)
- `password` - Хешированный пароль
- `role` - Роль (`user` или `admin`)
- `created_at` - Дата регистрации

### Таблица `products`:

- `id` - Уникальный ID
- `name` - Название товара
- `description` - Описание
- `price` - Цена
- `image_url` - URL изображения
- `category` - Категория
- `in_stock` - Наличие (true/false)
- `created_at`, `updated_at` - Даты

## 📋 Требования

- **Node.js** 18+ (для локального запуска)
- **Современный браузер** с поддержкой ES6+

## 🚀 Деплой

Подробная инструкция в файле [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)

---

**Готово к продакшену! 🎉**
