# 📖 ProManage REST API Documentation

- **Base Production URL**: `https://promange-back.onrender.com/api`
- **Local URL**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `https://promange-back.onrender.com/docs`
- **Authentication Header**: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints (`/api/auth`)

### Register New User
* **Method**: `POST`
* **Path**: `/api/auth/register`
* **Request Body**:
  ```json
  {
    "fullName": "Alex Developer",
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
* **Response Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7b8e2-9d3a-4e5f-b6a7-8c9d0e1f2a3b",
        "fullName": "Alex Developer",
        "email": "alex@example.com",
        "createdAt": "2026-10-08T20:00:00Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

### User Login
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7b8e2-9d3a-4e5f-b6a7-8c9d0e1f2a3b",
        "fullName": "Alex Developer",
        "email": "alex@example.com",
        "createdAt": "2026-10-08T20:00:00Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

### Get Current User Profile
* **Method**: `GET`
* **Path**: `/api/auth/me`
* **Headers**: `Authorization: Bearer <token>`
* **Response Status**: `200 OK`

---

## 2. Projects Endpoints (`/api/projects`)

### List Projects
* **Method**: `GET`
* **Path**: `/api/projects`
* **Query Parameters**:
  * `search`: Filter by project name (case-insensitive substring match)
  * `status`: Filter by `NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`
  * `sortBy`: Sort by column (`createdAt`, `name`, `status`)
  * `order`: `asc` | `desc`
* **Response Status**: `200 OK`

### Create Project
* **Method**: `POST`
* **Path**: `/api/projects`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "name": "Mobile App Development",
    "description": "Cross-platform React Native app",
    "status": "NOT_STARTED"
  }
  ```
* **Response Status**: `201 Created`

### Update Project
* **Method**: `PUT`
* **Path**: `/api/projects/{id}`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```
* **Response Status**: `200 OK`

### Delete Project
* **Method**: `DELETE`
* **Path**: `/api/projects/{id}`
* **Headers**: `Authorization: Bearer <token>`
* **Response Status**: `200 OK`

---

## 3. Tasks Endpoints (`/api/tasks`)

### List Tasks
* **Method**: `GET`
* **Path**: `/api/tasks`
* **Query Parameters**:
  * `projectId`: Filter tasks belonging to a specific project
  * `priority`: Filter by `LOW` | `MEDIUM` | `HIGH`
  * `status`: Filter by `PENDING` | `IN_PROGRESS` | `COMPLETED`
* **Response Status**: `200 OK`

### Create Task
* **Method**: `POST`
* **Path**: `/api/tasks`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "projectId": "c1f7b8e2-9d3a-4e5f-b6a7-8c9d0e1f2a3b",
    "name": "Setup Secure Token Storage",
    "description": "Hardware backed storage on Android/iOS",
    "priority": "HIGH",
    "status": "PENDING"
  }
  ```
* **Response Status**: `201 Created`

### Update Task
* **Method**: `PUT`
* **Path**: `/api/tasks/{id}`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "status": "COMPLETED"
  }
  ```
* **Response Status**: `200 OK`

### Delete Task
* **Method**: `DELETE`
* **Path**: `/api/tasks/{id}`
* **Headers**: `Authorization: Bearer <token>`
* **Response Status**: `200 OK`

---

## 4. Dashboard Metrics Endpoint (`/api/dashboard`)

### Get Dashboard Statistics
* **Method**: `GET`
* **Path**: `/api/dashboard`
* **Headers**: `Authorization: Bearer <token>`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "totalProjects": 3,
      "totalTasks": 12,
      "completedTasks": 5,
      "pendingTasks": 7,
      "projectsInProgress": 2
    }
  }
  ```
