# Online Shop Backend API

Серверная часть интернет-магазина на Node.js + Express + SQLite с JWT авторизацией.

## 🚀 Быстрый старт

### Локальная разработка

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

3. Запустите сервер:

```bash
# Производственный режим
npm start

# Режим разработки (с автоперезагрузкой)
npm run dev
```

Сервер запустится на порту 3000 (или PORT из переменных окружения).

### Деплой на Render.com

1. Создайте веб-сервис на Render.com
2. Подключите ваш GitHub репозиторий
3. Настройте сервис:

   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server`

4. Добавьте переменные окружения:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-super-secret-jwt-key`
   - `PORT=3000` (автоматически от Render)

## 📁 Структура проекта

```
server/
├── models/
│   └── database.js     # База данных SQLite
├── routes/
│   ├── auth.js         # Авторизация и регистрация
│   ├── products.js     # Управление товарами
│   └── users.js        # Управление пользователями
├── db/
│   └── shop.db         # База данных (создается автоматически)
├── server.js           # Основной файл сервера
├── package.json        # Зависимости и скрипты
├── .env.example        # Пример переменных окружения
└── README.md           # Документация
```

## 🔗 API Endpoints

### Авторизация (`/api/auth`)

#### `POST /api/auth/register`

Регистрация нового пользователя.

**Body:**

```json
{
  "nickname": "JohnDoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Пользователь успешно зарегистрирован",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "nickname": "JohnDoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### `POST /api/auth/login`

Вход в систему.

**Body:**

```json
{
  "login": "john@example.com", // email или nickname
  "password": "password123"
}
```

#### `POST /api/auth/verify`

Проверка действительности токена.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

### Товары (`/api/products`)

#### `GET /api/products`

Получить все товары (доступно всем).

#### `GET /api/products/:id`

Получить товар по ID.

#### `POST /api/products` 🔒

Создать товар (только админ).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Body:**

```json
{
  "name": "iPhone 15",
  "description": "Новейший смартфон",
  "price": 89999,
  "image_url": "https://example.com/image.jpg",
  "category": "Смартфоны"
}
```

#### `PUT /api/products/:id` 🔒

Обновить товар (только админ).

#### `DELETE /api/products/:id` 🔒

Удалить товар (только админ).

### Пользователи (`/api/users`)

#### `GET /api/users/stats` 🔒

Статистика пользователей (только админ).

#### `GET /api/users` 🔒

Список всех пользователей (только админ).

#### `GET /api/users/profile` 🔒

Профиль текущего пользователя.

## 🔐 Авторизация

API использует JWT токены для авторизации. Токен должен передаваться в заголовке:

```
Authorization: Bearer <jwt_token>
```

### Роли пользователей:

- `user` - Обычный пользователь
- `admin` - Администратор (может управлять товарами и пользователями)

## 🗄️ База данных

Используется SQLite с автоматической инициализацией:

- **users** - Пользователи (id, nickname, email, password, role, created_at)
- **products** - Товары (id, name, description, price, image_url, category, in_stock, created_at, updated_at)

### Демо данные

При первом запуске автоматически создаются:

**Администратор:**

- Nickname: `Admin`
- Email: `admin@shop.com`
- Password: `admin123`

**Демо товары:**

- iPhone 15 Pro
- MacBook Air M2
- Samsung Galaxy S24
- iPad Pro 12.9"
- AirPods Pro 2

## 🔧 Переменные окружения

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=*
```

## 📝 Логирование

Сервер выводит подробные логи:

- ✅ Успешные операции
- ❌ Ошибки и предупреждения
- 🚀 Информация о запуске
- 📱 API endpoints

## 🛡️ Безопасность

- Пароли хешируются с помощью bcryptjs
- JWT токены с истечением через 7 дней
- Валидация всех входных данных
- CORS настроен для безопасного доступа
- Проверка прав доступа на уровне маршрутов

## 🚀 Производительность

- SQLite для быстрого доступа к данным
- Оптимизированные запросы к базе
- Статические файлы фронтенда
- Автоматическая обработка ошибок

---

**Готово к деплою на Render.com!** 🎉
