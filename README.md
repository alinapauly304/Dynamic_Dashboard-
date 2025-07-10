
# Dynamic_Dashboard

A FastAPI-based dynamic dashboard project with user authentication, role-based access control (RBAC), and organization-level restrictions. The backend is built using FastAPI and PostgreSQL, and the frontend is developed in React.

##  Features

- JWT-based authentication
- Role and organization-based access
- Modular FastAPI router structure
- Logging and exception handling
- Config-driven architecture

---

##  Authentication Endpoints

### POST `/login`

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "username": "testuser",
  "password": "password123"
}
