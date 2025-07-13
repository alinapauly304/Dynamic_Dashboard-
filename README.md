# Dynamic_Dashboard with RBAC
Dynamic_Dashboard is a full-stack web application developed using FastAPI for the backend and React for the frontend. The main objective of this project is to build a secure, scalable dashboard system that supports user authentication, role-based access control (RBAC), and organization-level data restrictions. Users are required to log in to access the application, and their permissions are dynamically managed based on their assigned role (such as admin or standard user) and the organization they belong to.

The backend is responsible for handling the core logic, including user registration and login, JWT-based authentication, authorization checks, and communication with a PostgreSQL database. It is structured in a modular way, separating concerns into distinct directories such as models, routers, schemas, and utility functions, which improves readability and maintainability of the codebase.

On the frontend, React is used to create an interactive and user-friendly interface. It communicates with the backend through HTTP requests, manages authentication tokens, and renders components conditionally based on the user's role and organization. This ensures that each user has access only to the features and data they are permitted to use.
##  Features

- JWT-based authentication
- Role and organization-based access
- Modular FastAPI router structure
- Logging and exception handling
- Config-driven architecture

## Installation

### Prerequisites

- **Python 3.9+**
- **Node.js 18+** and **npm** or **yarn**
- **PostgreSQL** installed and running
- **Virtual Environment** for Python

### Backend Setup (FastAPI)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate      # On Windows
   source venv/bin/activate   # On macOS/Linux
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```


4. **Start the FastAPI backend:**
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   cd dashboard_frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install         
   ```

3. **Start the React development server:**
   ```bash
   npm run dev          
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Project Structure

```
Dynamic_Dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/             # Models (User, Role, Org, etc.)
│   │   ├── routers/            # API route definitions (auth, admin, user)
│   │   ├── schemas/            # Pydantic schemas
│   │   └── utils/              # Helper functions (JWT, hashing, etc.)
│   ├── requirements.txt
│   └── logs/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page-level views (Login, Dashboard, Admin)
│   │   ├── services/           # API calls, token storage, etc.
│   │   └── App.tsx
│   └── package.json
└── README.md
```
---
## Authentication Flow

1. **Register** a new user account using `/register`
2. **Login** with credentials to receive a JWT token via `/login`
3. Include the JWT token in subsequent API requests using the `Authorization` header:
   ```
   Authorization: Bearer your.jwt.token.here
   ```
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
```

**Response:**
```json
{
  "access_token": "your.jwt.token.here",
  "token_type": "bearer",
  "role_id": 2
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Database error or internal server error

---

### POST `/register`

Registers a new user account.

**Request Body:**

```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "Password@123"//strong password
}
```

**Response:**
```json
{
  "message": "User registered",
  "username": "newuser",
  "role": "user"
}
```

**Error Responses:**
- `400 Bad Request`: Username already taken
- `500 Internal Server Error`: Database error or internal server error

**Notes:**
- New users are automatically assigned `role_id: 1` (user role)
- New users are assigned to `organization_id: 1` by default
- User accounts are active by default (`is_active: true`)



---

## User Profile Endpoints

### GET `/user/me`

Retrieves the current authenticated user's profile information.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "user@example.com",
  "role_id": 2,
  "organization_id": 1,
  "role_name": "admin",
  "organization_name": "Default Organization"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### PUT `/user/me`

Updates the current authenticated user's profile information.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "newusername",
  "email": "newemail@example.com",
  "role_id": 2,
  "organization_id": 1,
  "role_name": "admin",
  "organization_name": "Default Organization"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Notes:**
- Only provided fields will be updated (partial updates supported)
- Role and organization information is returned for reference
- All profile updates are logged for security auditing

---

## Admin Endpoints

**Note:** All admin endpoints require `role_id: 2` (admin role) for access.

### GET `/admin/users`

Retrieves all users in the system (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "user1",
    "email": "user1@example.com",
    "role_id": 1,
    "organization_id": 1
  },
  {
    "id": 2,
    "username": "admin",
    "email": "admin@example.com",
    "role_id": 2,
    "organization_id": 1
  }
]
```

---

### POST `/admin/users`

Creates a new user (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "Password@123",
  "role_id": 1,
  "organization_id": 1
}
```

**Response:**
```json
{
  "id": 3,
  "username": "newuser",
  "email": "newuser@example.com",
  "role_id": 1,
  "organization_id": 1
}
```

---

### PUT `/admin/users/{user_id}`

Updates an existing user (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "username": "updatedusername",
  "email": "updated@example.com",
  "role_id": 2
}
```

**Response:**
```json
{
  "id": 1,
  "username": "updatedusername",
  "email": "updated@example.com",
  "role_id": 2,
  "organization_id": 1
}
```

---

### DELETE `/admin/users/{user_id}`

Deletes a user (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses for Admin Endpoints:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required (role_id != 2)
- `404 Not Found`: User not found (for update/delete operations)
- `500 Internal Server Error`: Server error

---
## Role Management Endpoints

**Note:** All role management endpoints require admin privileges (`role_id: 2`, admin role name, or `system.admin` permission).

### GET `/admin/roles/permissions`

Retrieves all available permissions in the system (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "user.read",
    "description": "Read user information"
  },
  {
    "id": 2,
    "name": "user.write",
    "description": "Create and update users"
  },
  {
    "id": 3,
    "name": "system.admin",
    "description": "Full system administration access"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required
- `500 Internal Server Error`: Failed to retrieve permissions

---

### GET `/admin/roles`

Retrieves all roles with their assigned permissions (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "user",
    "is_system": false,
    "permissions": [
      {
        "id": 1,
        "name": "user.read",
        "description": "Read user information"
      }
    ]
  },
  {
    "id": 2,
    "name": "admin",
    "is_system": true,
    "permissions": [
      {
        "id": 1,
        "name": "user.read",
        "description": "Read user information"
      },
      {
        "id": 2,
        "name": "user.write",
        "description": "Create and update users"
      },
      {
        "id": 3,
        "name": "system.admin",
        "description": "Full system administration access"
      }
    ]
  }
]
```

**Notes:**
- System roles (`is_system: true`) automatically have all permissions
- Regular roles only have explicitly assigned permissions
- System roles are determined by the `is_system` field in the database

---

### POST `/admin/roles`

Creates a new role with specified permissions (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "name": "manager",
  "permission_ids": [1, 2]
}
```

**Response:**
```json
{
  "id": 3,
  "name": "manager",
  "is_system": false,
  "permissions": [
    {
      "id": 1,
      "name": "user.read",
      "description": "Read user information"
    },
    {
      "id": 2,
      "name": "user.write",
      "description": "Create and update users"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Role name already exists
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required
- `500 Internal Server Error`: Failed to create role

---

### PUT `/admin/roles/{role_id}`

Updates an existing role's name and/or permissions (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "name": "updated_manager",
  "permission_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "id": 3,
  "name": "updated_manager",
  "is_system": false,
  "permissions": [
    {
      "id": 1,
      "name": "user.read",
      "description": "Read user information"
    },
    {
      "id": 2,
      "name": "user.write",
      "description": "Create and update users"
    },
    {
      "id": 3,
      "name": "system.admin",
      "description": "Full system administration access"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Role name already exists or attempting to modify system role
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required
- `404 Not Found`: Role not found
- `500 Internal Server Error`: Failed to update role

**Notes:**
- System roles cannot be modified
- Both name and permission_ids are optional in the request body
- If permission_ids is provided, it completely replaces the existing permissions

---

### DELETE `/admin/roles/{role_id}`

Deletes a role and all its associated permissions (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "message": "Role 'manager' deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot delete system role or role is assigned to users
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required
- `404 Not Found`: Role not found
- `500 Internal Server Error`: Failed to delete role

**Notes:**
- System roles cannot be deleted
- Roles assigned to active users cannot be deleted
- All role permissions are automatically removed when a role is deleted

---

### GET `/admin/roles/test`

Test endpoint for verifying authentication and admin access.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "message": "Authentication successful",
  "user": {
    "username": "admin",
    "role_id": 2,
    "id": 1
  },
  "timestamp": "2024-01-15T10:30:00.000000"
}
```
---

### Admin Privilege Verification

Admin access is granted if the user meets any of these criteria:
1. **Role ID 2**: Direct admin role assignment
2. **Role Name**: Role name contains "admin"
3. **System Permission**: `is_system: true`

### System vs Regular Roles

- **System Roles** (`is_system: true`): Automatically granted all permissions in the system
- **Regular Roles** (`is_system: false`): Only have explicitly assigned permissions

## Organization Management Endpoints

**Note:** Organization management endpoints have different permission requirements:
- **Admin Only**: Create, update, delete organizations and view all organizations
- **Admin or Organization Member**: View specific organization details, projects, and users

### GET `/organizations`

Retrieves all organizations in the system (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Default Organization",
    "description": "",
    "website": "",
    "industry": "",
    "size": "",
    "members": 5,
    "projects": 3,
    "status": "active",
    "created_at": "2024-01-15T10:00:00.000000"
  },
  {
    "id": 2,
    "name": "Tech Startup Inc",
    "description": "",
    "website": "https://techstartup.com",
    "industry": "Technology",
    "size": "Small",
    "members": 12,
    "projects": 8,
    "status": "active",
    "created_at": "2024-01-20T14:30:00.000000"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required (role_id != 2)
- `500 Internal Server Error`: Database error

---

### GET `/organizations/{org_id}`

Retrieves a specific organization with its users (Admin or organization member only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "id": 1,
  "name": "Default Organization",
  "description": "",
  "status": "active",
  "created_at": "2024-01-15T10:00:00.000000",
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role_id": 2,
      "is_active": true,
      "created_at": "2024-01-15T10:00:00.000000"
    },
    {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com",
      "role_id": 1,
      "is_active": true,
      "created_at": "2024-01-16T09:00:00.000000"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Not admin and not a member of the organization
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Database error

---

### GET `/organizations/{org_id}/projects`

Retrieves all projects for a specific organization (Admin or organization member only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Project Alpha",
    "description": "Main project for the organization",
    "owner_id": 1,
    "organization_id": 1,
    "created_at": "2024-01-15T10:00:00.000000",
    "owner": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  },
  {
    "id": 2,
    "name": "Project Beta",
    "description": "Secondary project",
    "owner_id": 2,
    "organization_id": 1,
    "created_at": "2024-01-16T11:00:00.000000",
    "owner": {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com"
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Not admin and not a member of the organization
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Database error

---

### GET `/organizations/{org_id}/users`

Retrieves all users in a specific organization (Admin or organization member only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role_id": 2,
    "is_active": true,
    "created_at": "2024-01-15T10:00:00.000000"
  },
  {
    "id": 2,
    "username": "user1",
    "email": "user1@example.com",
    "role_id": 1,
    "is_active": true,
    "created_at": "2024-01-16T09:00:00.000000"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Not admin and not a member of the organization
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Database error

---

### POST `/organizations`

Creates a new organization (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "name": "New Organization"
}
```

**Response:**
```json
{
  "id": 3,
  "name": "New Organization",
  "description": "",
  "members": 0,
  "projects": 0,
  "status": "active",
  "created_at": "2024-01-25T15:30:00.000000"
}
```

**Error Responses:**
- `400 Bad Request`: Organization name already exists
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required
- `500 Internal Server Error`: Database error

---

### PUT `/organizations/{org_id}`

Updates an existing organization (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "name": "Updated Organization Name"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Organization Name",
  "description": "",
  "members": 5,
  "projects": 3,
  "status": "active",
  "created_at": "2024-01-15T10:00:00.000000"
}
```

**Error Responses:**
- `400 Bad Request`: Organization name already exists
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Database error

---

### DELETE `/organizations/{org_id}`

Deletes an organization (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "message": "Organization deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Organization has users that must be reassigned first
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Database error

---

## Organization Access Control

### Permission Levels

1. **Admin Access (`role_id: 2`)**:
   - View all organizations
   - Create, update, and delete organizations
   - View all organization details, projects, and users

2. **Organization Member Access**:
   - View only their own organization details
   - View projects and users within their organization
   - Cannot modify organization settings

### Organization-Level Restrictions

- Users can only access data within their assigned organization (unless admin)
- Organization membership is determined by the `organization_id` field in the user record
- Cross-organization data access is restricted to prevent data leakage
- All organization operations are logged for audit purposes


1. **Organization Creation**: Only admins can create new organizations
2. **Organization Deletion**: Cannot delete organizations with active users
3. **User Assignment**: Users are assigned to organizations via the `organization_id` field
4. **Project Association**: Projects belong to organizations and inherit access controls
5. **Default Organization**: New users are typically assigned to organization_id: 1


---
## Project Management Endpoints

### GET `/projects`

Retrieves all projects in the system with filtering and sorting options (Admin only).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Query Parameters:**
- `status` (optional): Filter by project status
- `search` (optional): Search in project name, description, or owner username
- `sort_by` (optional): Sort by "name", "date", "status", or "priority" (default: "name")

**Response:**
```json
[
  {
    "id": 1,
    "name": "Project Alpha",
    "description": "Main project for the organization",
    "status": "active",
    "createdDate": "2024-01-15",
    "lastModified": "2024-01-15",
    "owner": "admin",
    "owner_id": 1,
    "organization": "Default Organization",
    "team": [
      {
        "id": 2,
        "username": "user1",
        "email": "user1@example.com"
      }
    ],
    "priority": "medium",
    "budget": 0,
    "progress": 0
  },
  {
    "id": 2,
    "name": "Project Beta",
    "description": "Secondary project",
    "status": "active",
    "createdDate": "2024-01-16",
    "lastModified": "2024-01-16",
    "owner": "user1",
    "owner_id": 2,
    "organization": "Default Organization",
    "team": [],
    "priority": "medium",
    "budget": 0,
    "progress": 0
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Admin access required (role_id != 2)
- `500 Internal Server Error`: Database error

---

### GET `/projects/{project_id}`

Retrieves a specific project by ID with complete details.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "id": 1,
  "name": "Project Alpha",
  "description": "Main project for the organization",
  "owner": "admin",
  "organization": "Default Organization",
  "owner_id": 1,
  "status": "active",
  "createdDate": "2024-01-15",
  "lastModified": "2024-01-15",
  "team": [
    {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found
- `500 Internal Server Error`: Database error

---

### POST `/projects`

Creates a new project.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "owner_id": 1
}
```

**Response:**
```json
{
  "id": 3,
  "name": "New Project",
  "description": "Project description",
  "owner": "admin",
  "owner_id": 1,
  "organization": "Default Organization",
  "status": "active",
  "priority": "medium",
  "budget": 0,
  "progress": 0,
  "createdDate": "2024-01-25",
  "lastModified": "2024-01-25",
  "team": []
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project owner not found (if owner_id is specified)
- `500 Internal Server Error`: Database error

---

### PUT `/projects/{project_id}`

Updates an existing project.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated project description"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Project Name",
  "description": "Updated project description",
  "owner": "admin",
  "owner_id": 1,
  "organization": "Default Organization",
  "status": "active",
  "priority": "medium",
  "budget": 0,
  "progress": 0,
  "createdDate": "2024-01-15",
  "lastModified": "2024-01-15",
  "team": [
    {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found
- `500 Internal Server Error`: Database error

---

### DELETE `/projects/{project_id}`

Deletes a project and all associated team members.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found
- `500 Internal Server Error`: Database error

---

## Project Team Management Endpoints

### POST `/projects/{project_id}/team`

Adds a team member to a project.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Request Body:**
```json
{
  "user_id": 2
}
```

**Response:**
```json
{
  "message": "Team member added successfully",
  "user": {
    "id": 2,
    "username": "user1",
    "email": "user1@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: User is already a team member
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found or user not found in project's organization
- `500 Internal Server Error`: Database error

---

### DELETE `/projects/{project_id}/team/{user_id}`

Removes a team member from a project.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "message": "Team member removed successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found or team member not found
- `500 Internal Server Error`: Database error

---

### GET `/projects/{project_id}/team`

Retrieves all team members for a project.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 2,
    "username": "user1",
    "email": "user1@example.com",
    "role": "user"
  },
  {
    "id": 3,
    "username": "user2",
    "email": "user2@example.com",
    "role": "admin"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found
- `500 Internal Server Error`: Database error

---

### GET `/projects/{project_id}/available-users`

Retrieves all users from the project's organization that can be added to the project.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": 2,
    "username": "user1",
    "email": "user1@example.com",
    "role": "user"
  },
  {
    "id": 4,
    "username": "user3",
    "email": "user3@example.com",
    "role": "user"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found
- `500 Internal Server Error`: Database error

---

### GET `/projects/available-users`

Retrieves all active users that can be added to projects (general endpoint).

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": 2,
    "username": "user1",
    "email": "user1@example.com",
    "role": "user"
  },
  {
    "id": 3,
    "username": "user2",
    "email": "user2@example.com",
    "role": "user"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error

---

### GET `/projects/stats/summary`

Retrieves project statistics summary.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "total_projects": 15,
  "active_projects": 15,
  "completed_projects": 0,
  "in_progress_projects": 0
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error


---

## User Project Endpoints

**Note:** All user project endpoints require valid JWT authentication and organization membership. Users can only access projects within their own organization.

### GET `/user/projects`

Retrieves all projects belonging to the current user's organization.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Project Alpha",
      "description": "Main project for the organization",
      "status": "Active",
      "created": "2024-01-15",
      "owner": "admin",
      "organization_id": 1
    },
    {
      "id": 2,
      "name": "Project Beta",
      "description": "Secondary project",
      "status": "In Progress",
      "created": "2024-01-16",
      "owner": "user1",
      "organization_id": 1
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: User is not associated with any organization
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error

---

### GET `/user/projects/{project_id}`

Retrieves detailed information about a specific project within the user's organization.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "id": 1,
  "name": "Project Alpha",
  "description": "Main project for the organization",
  "status": "Active",
  "created": "2024-01-15",
  "owner": "admin",
  "organization": "Default Organization",
  "organization_id": 1
}
```

**Error Responses:**
- `400 Bad Request`: User is not associated with any organization
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Project not found or not accessible
- `500 Internal Server Error`: Database error

---

### GET `/user/projects/stats/summary`

Retrieves project statistics summary for the user's organization.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "total_projects": 15,
  "active_projects": 5,
  "in_progress_projects": 7,
  "completed_projects": 3,
  "organization_id": 1
}
```

**Error Responses:**
- `400 Bad Request`: User is not associated with any organization
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error


---

### GET `/user/assigned-projects`

Retrieves all projects where the current user is a team member.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Project Alpha",
      "description": "Main project for the organization",
      "status": "Active",
      "created": "2024-01-15",
      "owner": "admin",
      "organization_id": 1
    },
    {
      "id": 3,
      "name": "Project Gamma",
      "description": "Team collaboration project",
      "status": "In Progress",
      "created": "2024-01-10",
      "owner": "manager",
      "organization_id": 1
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: User is not associated with any organization
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error

---

### GET `/user/assigned-projects/{project_id}`

Retrieves detailed information about a specific project where the user is a team member.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "id": 1,
  "name": "Project Alpha",
  "description": "Main project for the organization",
  "status": "Active",
  "created": "2024-01-15",
  "owner": "admin",
  "organization": "Default Organization",
  "organization_id": 1,
  "team": [
    {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com",
      "is_current_user": true
    },
    {
      "id": 3,
      "username": "user2",
      "email": "user2@example.com",
      "is_current_user": false
    }
  ],
  "user_role": "team_member"
}
```

**Error Responses:**
- `400 Bad Request`: User is not associated with any organization
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: User is not a team member of this project
- `404 Not Found`: Project not found
- `500 Internal Server Error`: Database error

---

### GET `/user/team-projects/stats`

Retrieves statistics for projects where the user is a team member.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "total_assigned_projects": 8,
  "active_assigned_projects": 3,
  "in_progress_assigned_projects": 4,
  "completed_assigned_projects": 1,
  "organization_id": 1
}
```

**Error Responses:**
- `400 Bad Request`: User is not associated with any organization
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error

---

## User Permission Endpoints

### GET `/user/permissions`

Retrieves all permissions for the current user including role information.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "permissions": [
    "user.read",
    "user.write",
    "system.admin"
  ],
  "role": {
    "id": 2,
    "name": "admin",
    "is_system": true
  },
  "user_id": 1,
  "organization_id": 1
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error

---

### GET `/user/permissions/check/{permission_name}`

Checks if the current user has a specific permission.

**Headers:**
```
Authorization: Bearer your.jwt.token.here
```

**Response:**
```json
{
  "permission": "user.write",
  "has_permission": true,
  "user_id": 1
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: Database error


---
# Dynamic Database API Endpoints

This API provides comprehensive database management capabilities with PostgreSQL integration. All endpoints return standardized JSON responses with success/error status.

## Base URL
```
/Dynamic_db
```

## Response Format
All endpoints return responses in the following format:
```json
{
    "success": true/false,
    "message": "Description of operation",
    "data": {}, // Optional data payload
    "error": "Error details" // Only present on failure
}
```

## Authentication
Database credentials are required for each operation and should be included in the request body.

---

## Database Operations

### 1. Create Database
**POST** `/Dynamic_db/dbcreate`

Creates a new PostgreSQL database.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "dbname": "new_database_name"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Database 'new_database_name' created successfully",
    "data": {
        "dbname": "new_database_name"
    }
}
```

### 2. List Databases
**POST** `/Dynamic_db/dblist`

Lists all databases on the PostgreSQL server.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Databases listed successfully",
    "data": {
        "databases": ["db1", "db2", "db3"]
    }
}
```

### 3. Test Database Connection
**POST** `/Dynamic_db/dbtest`

Tests connection to a database.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "target_database"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Database connection successful",
    "data": {
        "host": "localhost",
        "port": 5432,
        "user": "postgres",
        "database": "target_database"
    }
}
```

---

## Table Operations

### 4. Create Table
**POST** `/Dynamic_db/tablecreate`

Creates a new table with custom columns and constraints.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users",
    "columns": [
        {
            "name": "id",
            "type": "INT",
            "primary": true,
            "auto_increment": true,
            "nullable": false
        },
        {
            "name": "name",
            "type": "VARCHAR(100)",
            "primary": false,
            "auto_increment": false,
            "nullable": false
        },
        {
            "name": "email",
            "type": "VARCHAR(255)",
            "primary": false,
            "auto_increment": false,
            "nullable": true
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Table 'users' created successfully",
    "data": {
        "tablename": "users",
        "columns": [
            {
                "name": "id",
                "type": "INT",
                "primary": true,
                "auto_increment": true,
                "nullable": false
            }
        ]
    }
}
```

### 5. List Tables
**POST** `/Dynamic_db/tablelist`

Lists all tables in a database.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Tables listed successfully",
    "data": {
        "tables": ["users", "products", "orders"]
    }
}
```

### 6. Get Table Schema
**POST** `/Dynamic_db/tableschema`

Retrieves the schema/structure of a table.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Table schema retrieved successfully",
    "data": {
        "schema": [
            {
                "column_name": "id",
                "data_type": "integer",
                "is_nullable": "NO",
                "column_default": "nextval('users_id_seq'::regclass)"
            },
            {
                "column_name": "name",
                "data_type": "character varying",
                "is_nullable": "NO",
                "column_default": null
            }
        ]
    }
}
```

### 7. Drop Table
**POST** `/Dynamic_db/tabledrop`

Drops/deletes a table from the database.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Table 'users' dropped successfully",
    "data": {
        "tablename": "users"
    }
}
```

---

## Data Operations

### 8. Insert Data
**POST** `/Dynamic_db/dbinsert`

Inserts one or more records into a table.

**Request Body (Single Record):**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users",
    "data": {
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

**Request Body (Multiple Records):**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users",
    "data": [
        {
            "name": "John Doe",
            "email": "john@example.com"
        },
        {
            "name": "Jane Smith",
            "email": "jane@example.com"
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "message": "2 record(s) inserted successfully",
    "data": {
        "inserted_count": 2
    }
}
```

### 9. Fetch Data
**POST** `/Dynamic_db/dbfetch`

Retrieves data from a table with filtering, sorting, and pagination options.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users",
    "where": {
        "name": "Anna"
    },
    "order_by": {
        "column": "id",
        "direction": "ASC"
    },
    "limit": 10,
    "offset": 0
}
```


**Response:**
```json
{
    "success": true,
    "message": "Data fetched successfully",
    "data": {
        "records": [
            {
                "id": 1,
                "name": "Anna",
                "email": "nna@example.com"
            }
        ],
        "count": 1
    }
}
```

### 10. Update Data
**POST** `/Dynamic_db/dbupdate`

Updates existing records in a table.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users",
    "data": {
        "email": "newemail@example.com"
    },
    "where": {
        "id": 1
    }
}
```

**Response:**
```json
{
    "success": true,
    "message": "1 record(s) updated successfully",
    "data": {
        "affected_rows": 1
    }
}
```

### 11. Delete Data
**POST** `/Dynamic_db/dbdelete`

Deletes records from a table.

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "database": "your_database",
    "tablename": "users",
    "where": {
        "id": 1
    }
}
```

**Response:**
```json
{
    "success": true,
    "message": "1 record(s) deleted successfully",
    "data": {
        "affected_rows": 1
    }
}
```

---

## Project Database Management

### 12. Add Project Database
**POST** `/Dynamic_db/projects/{project_id}/databases`

Associates database credentials with a project.

**URL Parameters:**
- `project_id`: Integer ID of the project

**Request Body:**
```json
{
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "your_password",
    "dbname": "project_database"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Database credentials added successfully",
    "data": {
        "id": 1,
        "project_id": 123,
        "user": "postgres",
        "dbname": "project_database",
        "host": "localhost",
        "port": 5432
    }
}
```

### 13. Get Project Databases
**GET** `/Dynamic_db/projects/{project_id}/databases`

Retrieves all databases associated with a project.

**URL Parameters:**
- `project_id`: Integer ID of the project

**Response:**
```json
{
    "success": true,
    "message": "Project databases retrieved successfully",
    "data": {
        "project_id": 123,
        "databases": [
            {
                "id": 1,
                "project_id": 123,
                "user": "postgres",
                "password": "your_password",
                "dbname": "project_database",
                "host": "localhost",
                "port": 5432
            }
        ],
        "count": 1
    }
}
```

### 14. Get Database Credentials
**POST** `/Dynamic_db/projects/databases/credentials`

Retrieves database credentials by database ID (for internal use).

**Request Body:**
```json
{
    "database_id": 1
}
```

**Response:**
```json
{
    "success": true,
    "message": "Database credentials retrieved successfully",
    "data": {
        "id": 1,
        "project_id": 123,
        "user": "postgres",
        "password": "your_password",
        "dbname": "project_database",
        "host": "localhost",
        "port": 5432
    }
}
```




