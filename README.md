# FitCenter — веб-приложение для фитнес-центра

> Курсовая работа по дисциплине «Разработка веб-приложений»  
> Минеева Анастасия Игоревна, группа 241-3211  
> Московский политехнический университет, 2026

---

## О проекте

FitCenter — веб-приложение для автоматизации работы фитнес-центра. Позволяет клиентам записываться на тренировки онлайн, тренерам управлять расписанием, а администраторам — контролировать всю платформу.

**Ключевые возможности:**
- Онлайн-запись на тренировки с проверкой вместимости и запретом двойной записи
- Ролевая модель доступа: клиент, тренер, администратор
- Личный кабинет с историей записей и загрузкой аватара
- Панель администратора со статистикой посещаемости и загруженности тренеров
- Полностью контейнеризованное развёртывание через Docker Compose

---

## Стек технологий

| Слой | Технология |
|---|---|
| Frontend | React 18, React Router, Axios |
| Backend | Go 1.22, Gin |
| База данных | PostgreSQL 15 |
| ORM | GORM |
| Аутентификация | JWT (golang-jwt) |
| Контейнеризация | Docker, Docker Compose |
| Веб-сервер | Nginx |

---

## Быстрый старт

### Требования

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/) 2.20+

### Запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/<ваш-username>/fitness-app.git
cd fitness-app

# 2. Запустить все сервисы
docker compose up --build
```

После успешного запуска:

| Сервис | Адрес |
|---|---|
| Приложение (frontend) | http://localhost:3000 |
| API (backend) | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### Остановка

```bash
docker compose down          # остановить контейнеры
docker compose down -v       # остановить и удалить данные БД
```

---

## Тестовые аккаунты

База данных автоматически заполняется тестовыми данными при первом запуске (`init.sql`).

| Роль | Email | Пароль |
|---|---|---|
| Администратор | admin@fitcenter.ru | admin123 |
| Тренер | a.petrova@fitcenter.ru | trainer123 |
| Клиент | a.mineeva@mail.ru | client123 |

---

## Структура проекта

```
Fitness_App/
├── backend/                        # Go-сервер
│   ├── cmd/main.go                 # точка входа
│   ├── internal/
│   │   ├── app/app.go              # инициализация сервера
│   │   ├── config/config.go        # конфигурация и подключение к БД
│   │   ├── transport/
│   │   │   ├── routes.go           # маршруты API (публичные / protected / admin)
│   │   │   └── middleware.go       # JWT-аутентификация и проверка ролей
│   │   ├── handlers/               # HTTP-обработчики
│   │   │   ├── handler.go          # аутентификация и профиль
│   │   │   ├── workout.go          # тренировки и бронирования
│   │   │   ├── admin.go            # управление пользователями и статистика
│   │   │   ├── upload.go           # загрузка файлов
│   │   │   └── errors.go           # маппинг ошибок в HTTP-статусы
│   │   ├── service/                # бизнес-логика
│   │   │   ├── authService.go      # регистрация, вход, bcrypt, JWT
│   │   │   ├── workoutService.go   # тренировки, 4 проверки при записи
│   │   │   ├── profileService.go   # обновление профиля и аватара
│   │   │   ├── adminService.go     # CRUD пользователей, агрегация статистики
│   │   │   └── errors.go           # именованные ошибки сервисного слоя
│   │   └── models/models.go        # GORM-модели: User, Workout, Booking
│   ├── pkg/
│   │   ├── jwtutil/jwtutil.go      # генерация и парсинг JWT-токенов
│   │   └── util/util.go            # WorkoutsOverlap, WorkoutStarted и др.
│   └── uploads/                    # загруженные файлы (Docker volume)
│       ├── avatars/
│       └── workouts/
├── frontend/                       # React-приложение
│   ├── src/
│   │   ├── App.js                  # маршруты, PrivateRoute
│   │   ├── AuthContext.js          # глобальный контекст авторизации
│   │   ├── api.js                  # axios с автоподстановкой токена
│   │   ├── components/             # Navbar, PasswordInput
│   │   └── pages/                  # Schedule, Profile, TrainerDashboard, AdminDashboard...
│   └── nginx.conf                  # раздача SPA + проксирование /api на backend
├── init.sql                        # схема БД и тестовые данные
└── docker-compose.yml              # оркестрация трёх сервисов
```

---

## API

Все защищённые маршруты требуют заголовок:
```
Authorization: Bearer <token>
```

### Аутентификация

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | публичный | регистрация клиента |
| POST | `/api/auth/login` | публичный | вход, возвращает JWT |
| GET | `/api/auth/me` | любой | данные текущего пользователя |

### Тренировки

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| GET | `/api/workouts` | публичный | расписание (фильтры: `date`, `trainer_id`) |
| GET | `/api/workouts/:id` | публичный | детали тренировки |
| POST | `/api/workouts` | тренер/admin | создать тренировку |
| PUT | `/api/workouts/:id` | тренер/admin | редактировать тренировку |
| DELETE | `/api/workouts/:id` | тренер/admin | удалить тренировку |
| POST | `/api/workouts/:id/photo` | тренер/admin | загрузить фото |

### Записи

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| POST | `/api/workouts/:id/book` | любой | записаться на тренировку |
| GET | `/api/bookings/my` | любой | история записей |
| PUT | `/api/bookings/:id/cancel` | любой | отменить запись |
| PUT | `/api/bookings/:id/attend` | тренер/admin | отметить посещение |

### Профиль

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| PUT | `/api/profile` | любой | обновить имя / bio / опыт |
| POST | `/api/profile/avatar` | любой | загрузить аватар |

### Администратор

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| GET | `/api/admin/users` | admin | список пользователей |
| POST | `/api/admin/users` | admin | создать пользователя |
| PUT | `/api/admin/users/:id` | admin | изменить пользователя |
| DELETE | `/api/admin/users/:id` | admin | удалить пользователя |
| GET | `/api/admin/stats` | admin | статистика платформы |

---

## Архитектура

```
Браузер
  │
  ▼
Nginx (frontend :3000)
  │  /api/* и /uploads/* → проксирует на backend
  ▼
Go/Gin (backend :8080)
  │
  ├── transport/   — маршруты и JWT middleware
  ├── handlers/    — разбор запросов, формирование ответов
  ├── service/     — бизнес-логика (проверки, правила)
  └── models/      — структуры данных
           │
           ▼
      PostgreSQL (:5432)
```

Логика записи на тренировку (`service/workoutService.go`) выполняет 4 последовательные проверки:
1. Клиент не записан на эту тренировку (ErrAlreadyBooked)
2. Тренировка ещё не началась (ErrWorkoutPast)
3. Есть свободные места (ErrNoAvailableSpots)
4. Нет пересечения по времени с другими записями (ErrTimeConflict)

---

## Лицензия

Проект разработан в учебных целях. Свободное использование и распространение.