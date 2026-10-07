# 🚀 Project Management System (ProManage)

A production-grade monorepo featuring a **FastAPI REST Backend**, **PostgreSQL Database**, **React + Vite Web App**, and **React Native Mobile App (Expo)**. Designed for simple, one-command execution by any developer.

---

## 📋 Table of Contents
1. [Architecture & ER Schema](#-architecture--er-schema)
2. [Environment Variables Reference](#-environment-variables-reference)
3. [Database Setup Instructions](#-database-setup-instructions)
4. [Backend Setup Instructions](#-backend-setup-instructions)
5. [Web App Setup Instructions](#-web-app-setup-instructions)
6. [Mobile App Setup Instructions](#-mobile-app-setup-instructions)
7. [Running Mobile App against Deployed Backend](#-running-mobile-app-against-deployed-backend)
8. [Complete API Documentation](#-complete-api-documentation)
9. [Automated Testing](#-automated-testing)
10. [Docker Support](#-docker-support)

---

## 📐 Architecture & ER Schema

```
+-----------------------------------+     +------------------------------------+
|          React Web App            |     |      React Native Mobile App       |
|    (Vite, TS, Axios, Context)     |     |     (Expo, TS, SecureStore)       |
+-----------------------------------+     +------------------------------------+
                  |                                         |
                  +--------------------+--------------------+
                                       | HTTP / REST (JWT Auth)
                                       v
                        +------------------------------+
                        |      FastAPI Backend         |
                        | (Pydantic v2, Rate Limit)    |
                        +------------------------------+
                                       |
                                       | Async ORM (SQLAlchemy 2.0)
                                       v
                        +------------------------------+
                        |     PostgreSQL Database      |
                        |   (Users, Projects, Tasks)   |
                        +------------------------------+
```

### Relational Database Schema
- **`users`**: `id` (UUID PK), `full_name`, `email` (UNIQUE), `password_hash` (Bcrypt), `created_at`
- **`projects`**: `id` (UUID PK), `owner_id` (FK → `users.id` CASCADE), `name`, `description`, `status` (`NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED`), `start_date`, `end_date`, `created_at`
- **`tasks`**: `id` (UUID PK), `project_id` (FK → `projects.id` CASCADE), `name`, `description`, `priority` (`LOW` \| `MEDIUM` \| `HIGH`), `status` (`PENDING` \| `IN_PROGRESS` \| `COMPLETED`), `due_date`, `created_at`

---

## ⚙️ Environment Variables Reference

### 1. Backend (`backend/.env`)
| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `PORT` | Listening port for FastAPI server | `8000` | Yes |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` | Yes |
| `DATABASE_URL` | PostgreSQL or SQLite connection URI | `sqlite+aiosqlite:///./project_mgmt.db` | Yes |
| `JWT_SECRET` | Secret key used to sign JWT tokens | `super-secret-key-32-chars-min` | Yes |
| `JWT_EXPIRES_IN` | Token expiration time in seconds | `86400` (24h) | Yes |
| `CORS_ORIGIN` | Allowed Web CORS origins (comma-separated) | `http://localhost:5173,http://localhost:3000` | Yes |
| `RATE_LIMIT_MAX` | Max auth requests per 15-min window | `100` | Yes |

### 2. Web App (`web/.env`)
| Variable | Description | Example | Required |
|---|---|---|---|
| `VITE_API_URL` | Base API URL for backend calls | `http://localhost:8000/api` | Yes |

### 3. Mobile App (`mobile/.env`)
| Variable | Description | Example | Required |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base API URL for mobile calls | `http://10.0.2.2:8000/api` (Emulator) or live backend URL | Yes |

---

## 🗄️ Database Setup Instructions

### Local SQLite Mode (Instant - Zero Config)
By default, the backend will automatically create and initialize a local SQLite database (`project_mgmt.db`) on startup if PostgreSQL is not running. No manual DB commands required!

### PostgreSQL Setup
1. Create a PostgreSQL database named `project_mgmt_db`.
2. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/project_mgmt_db
   ```
3. Run tables creation & database seeding:
   ```bash
   cd backend
   .\venv\Scripts\activate
   python -m app.seed
   ```

---

## 💻 Backend Setup Instructions

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Seed database with initial test data (alex@example.com / Password123!)
python -m app.seed

# 5. Run the FastAPI development server
python -m app.main
```
> Server starts at **`http://localhost:8000`**. Interactive Swagger docs available at **`http://localhost:8000/docs`**.

---

## 🌐 Web App Setup Instructions

```bash
# 1. Navigate to web directory
cd web

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. (Optional) Build production bundle
npm run build
```
> Web application opens at **`http://localhost:5173`**.

---

## 📱 Mobile App Setup Instructions

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Start Expo development server
npm run start
```
- Press **`a`** to open in Android Emulator.
- Press **`w`** to open in Web Browser.
- Scan QR code using **Expo Go** app on your phone.

---

## 🌐 Running Mobile App Against a Deployed Backend

When deploying your backend to production (e.g. Render, Railway, Supabase, AWS):

1. **Get your deployed backend URL**: e.g., `https://promanage-api.onrender.com/api`
2. **Update `mobile/.env`**:
   ```env
   EXPO_PUBLIC_API_URL=https://promanage-api.onrender.com/api
   ```
3. **Rebuild / Launch Expo**:
   ```bash
   cd mobile
   npx expo start -c
   ```
4. **HTTPS Requirement**: Native Android & iOS require `https://` URLs for release builds. Ensure your deployed backend uses an SSL/TLS HTTPS certificate.

---

## 📖 Complete API Documentation

Base URL: `/api` · Auth Header: `Authorization: Bearer <jwt_token>`

### 1. Authentication
* **`POST /api/auth/register`**: `{ fullName, email, password }` → Returns `201` `{ user, token }`.
* **`POST /api/auth/login`**: `{ email, password }` → Returns `200` `{ user, token }`.
* **`POST /api/auth/logout`**: Clears user session → Returns `200`.
* **`GET /api/auth/me`**: Fetches current user profile → Returns `200` `{ user }`.

### 2. Projects (Scoped to Authenticated User)
* **`GET /api/projects`**: List projects. Parameters: `search`, `status`, `page`, `limit`, `sortBy`, `order`.
* **`GET /api/projects/:id`**: Fetch single project by ID (Returns `404` if not owned).
* **`POST /api/projects`**: `{ name, description, status, startDate, endDate }` → Returns `201`.
* **`PUT /api/projects/:id`**: Update project details → Returns `200`.
* **`DELETE /api/projects/:id`**: Delete project and cascade tasks → Returns `200`.

### 3. Tasks (Ownership verified via Project)
* **`GET /api/tasks`**: List tasks. Parameters: `projectId`, `search`, `status`, `priority`, `page`, `limit`.
* **`GET /api/tasks/:id`**: Fetch task by ID.
* **`POST /api/tasks`**: `{ projectId, name, description, priority, status, dueDate }` → Returns `201`.
* **`PUT /api/tasks/:id`**: Update task status/details → Returns `200`.
* **`DELETE /api/tasks/:id`**: Delete task → Returns `200`.

### 4. Dashboard
* **`GET /api/dashboard`**: Returns user metrics:
  ```json
  {
    "totalProjects": 2,
    "totalTasks": 4,
    "completedTasks": 1,
    "pendingTasks": 3,
    "projectsInProgress": 1
  }
  ```

---

## 🧪 Automated Testing

```bash
cd backend
.\venv\Scripts\pytest -v
```

---

## 🐳 Docker Support

To run both PostgreSQL and the FastAPI Backend in Docker:

```bash
docker compose up -d
```
