# 🚀 Project Management System (TaskPulse)

A production-ready, full-stack Project and Task Management System featuring a **FastAPI REST backend**, **PostgreSQL database**, **React + Vite web app**, and **React Native Mobile App**.

---

## 📐 Architecture Diagram

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

---

## 🛠️ Tech Stack & Key Choices

| Layer | Technology | Key Highlights |
|---|---|---|
| **Backend** | **FastAPI** (Python 3.13) | Asynchronous REST API, auto OpenAPI/Swagger docs at `/docs`, strict typing. |
| **Database** | **PostgreSQL 16** | Relational schema with Foreign Keys (`ON DELETE CASCADE`), indexes, and SQLite dev fallback. |
| **ORM & Driver** | **SQLAlchemy 2.0 + `asyncpg`** | Fully parameterized queries (100% SQL injection safe). |
| **Auth & Security** | **JWT (`pyjwt`) + bcrypt (`pwdlib`)** | Secure salted password hashing (cost ≥ 10), stateless bearer token auth. |
| **Rate Limiting** | **`slowapi`** | Protects login and register endpoints against brute-force attacks. |
| **Web Frontend** | **React 18 + Vite + TypeScript** | Dark Glassmorphic Design System, custom CSS tokens, micro-animations, Axios interceptors. |
| **Mobile App** | **React Native (Expo)** | Hardware-backed **Android Keystore** via `expo-secure-store` for token security. |
| **Testing** | **`pytest` + `pytest-asyncio` + `httpx`** | Integration test suite verifying Auth, CRUD operations, and cross-user access isolation. |

---

## 🗄️ Database Schema & ER Model

### 1. `users` Table
* `id`: VARCHAR(36) [PK, UUID]
* `full_name`: VARCHAR(100) [NOT NULL]
* `email`: VARCHAR(255) [NOT NULL, UNIQUE, Indexed]
* `password_hash`: VARCHAR(255) [NOT NULL]
* `created_at`: DATETIME [NOT NULL]

### 2. `projects` Table
* `id`: VARCHAR(36) [PK, UUID]
* `owner_id`: VARCHAR(36) [FK → `users.id` ON DELETE CASCADE, NOT NULL, Indexed]
* `name`: VARCHAR(150) [NOT NULL]
* `description`: TEXT [Nullable]
* `status`: VARCHAR(11) [ENUM: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`]
* `start_date`: DATE [Nullable]
* `end_date`: DATE [Nullable, CHECK `end_date >= start_date`]
* `created_at`: DATETIME [NOT NULL]

### 3. `tasks` Table
* `id`: VARCHAR(36) [PK, UUID]
* `project_id`: VARCHAR(36) [FK → `projects.id` ON DELETE CASCADE, NOT NULL, Indexed]
* `name`: VARCHAR(150) [NOT NULL]
* `description`: TEXT [Nullable]
* `priority`: VARCHAR(6) [ENUM: `LOW`, `MEDIUM`, `HIGH`]
* `status`: VARCHAR(11) [ENUM: `PENDING`, `IN_PROGRESS`, `COMPLETED`]
* `due_date`: DATE [Nullable]
* `created_at`: DATETIME [NOT NULL]

> **Ownership Rule**: Tasks do not store an `owner_id` directly. Ownership is dynamically enforced by joining `tasks.project_id → projects.owner_id == authenticated_user.id`.

---

## ⚙️ Environment Variables Reference

| App | Variable Name | Purpose | Example Value | Required |
|---|---|---|---|---|
| **Backend** | `PORT` | Server listening port | `8000` | Yes |
| **Backend** | `NODE_ENV` | Environment mode | `development` / `production` | Yes |
| **Backend** | `DATABASE_URL` | PostgreSQL or SQLite connection URI | `sqlite+aiosqlite:///./project_mgmt.db` | Yes |
| **Backend** | `JWT_SECRET` | JWT signing secret key | `super-secret-key-32-chars-min` | Yes |
| **Backend** | `JWT_EXPIRES_IN` | Token TTL in seconds | `86400` (24 hours) | Yes |
| **Backend** | `CORS_ORIGIN` | Web app domain allowlist | `http://localhost:5173` | Yes |
| **Web** | `VITE_API_URL` | FastAPI base endpoint URL | `http://localhost:8000/api` | Yes |
| **Mobile** | `EXPO_PUBLIC_API_URL` | Backend endpoint for Mobile | `http://10.0.2.2:8000/api` | Yes |

---

## 🚀 Setup & Running Guide

### 1. Backend Setup & Test Runner

```bash
cd backend

# Create virtual environment & install requirements
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Run database seed script (Test accounts: alex@example.com / Password123!)
python -m app.seed

# Run FastAPI dev server
python -m app.main
```
> Interactive Swagger API docs are available at **`http://localhost:8000/docs`**.

#### Running Integration Tests:
```bash
cd backend
.\venv\Scripts\pytest -v
```

---

### 2. Web Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
> Web application opens at **`http://localhost:5173`**.

---

### 3. Mobile App Setup (Expo)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npm run start
```

---

## 🔒 Security & Data Isolation Audit Checklist

- [x] **Password Protection**: Salted Bcrypt hashing (`cost >= 10`), zero plaintext passwords stored or logged.
- [x] **Cross-User Data Isolation**: Every project query strictly filters by `owner_id == current_user.id`. Task operations inspect parent project ownership.
- [x] **Strict Input Validation**: Whitespace trimming, email RFC validation, enum validation, date range enforcement (`endDate >= startDate`).
- [x] **Native Security Storage**: Mobile application uses hardware-backed Android Keystore (`expo-secure-store`) for JWT token persistence.
- [x] **Rate Limiting & Headers**: IP-based rate limiting on auth routes via `slowapi` to mitigate brute-force attempts.
