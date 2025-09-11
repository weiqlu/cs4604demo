# CS4604 Demo: Node.js + Express + MySQL

A simple demonstration of building a REST API with Node.js, Express, and MySQL using Docker for database management.

## 📋 What You'll Learn

- Setting up a Node.js web server with Express
- Creating REST API endpoints (GET, POST, DELETE)
- Connecting to a MySQL database
- Using Docker for database management
- Testing APIs with command-line tools

## 🛠️ Prerequisites

Before starting, you need to install:

1. **Node.js** (v18 or later)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Verify installation: `docker --version`

## 🚀 Getting Started

### Step 1: Clone or Download the Project

```bash
# Option A: Clone with git
git clone <your-repo-url>
cd cs4604demo

# Option B: Download ZIP and extract
```

### Step 2: Start the Database

```bash
# Start MySQL and phpMyAdmin containers
docker-compose up -d

# Verify containers are running
docker ps
```

You should see two containers running:
- `mysql-db` (port 3307)
- `phpmyadmin` (port 8080)

### Step 3: Install Server Dependencies

```bash
# Navigate to server directory
cd server

# Install required packages
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

| Method | Endpoint | Description | Example |
|--------|----------|-------------|---------|
| GET | `/api/test-db` | Test database connection | Test if MySQL is working |
| POST | `/api/setup` | Create users table | Set up database schema |
| GET | `/api/users` | Get all users | Retrieve user list |
| POST | `/api/users` | Add new user | Create a new user |
| DELETE | `/api/users/:id` | Delete user by ID | Remove specific user |

## 🧪 Testing the API

### 1. Test Database Connection

```bash
curl http://localhost:3000/api/test-db
```

**Expected Response:**
```json
{"message":"Database connected successfully!"}
```

### 2. Create the Users Table

```bash
curl -X POST http://localhost:3000/api/setup
```

**Expected Response:**
```json
{"message":"Users table created!"}
```

### 3. Add a New User

```bash
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d "{\"email\":\"student@vt.edu\",\"password\":\"hokies123\"}"
```

**Expected Response:**
```json
{"message":"User added!","userId":1}
```

### 4. Get All Users

```bash
curl http://localhost:3000/api/users
```

**Expected Response:**
```json
[{"id":1,"email":"student@vt.edu","password":"hokies123"}]
```

### 5. Delete a User

```bash
curl -X DELETE http://localhost:3000/api/users/1
```

**Expected Response:**
```json
{"message":"User deleted!","deletedUserId":"1"}
```

## 🖥️ Using phpMyAdmin (Optional)

Access the database GUI at: `http://localhost:8080`

**Login credentials:**
- **Server:** `db`
- **Username:** `user`
- **Password:** `password`

Use this to:
- View tables and data
- Run SQL queries directly
- Verify API operations worked correctly

## 🔧 Development Commands

```bash
# Start server with auto-restart on changes
npm run dev

# Start server normally
npm start

# Stop Docker containers
docker-compose down

# View Docker container logs
docker-compose logs db
```

## 📁 Project Structure

```
cs4604demo/
├── server/
│   ├── server.js         # Main server file
│   ├── package.json      # Node.js dependencies
│   └── node_modules/     # Installed packages (auto-generated)
├── docker-compose.yml    # Database setup
├── .gitignore            # Git ignore rules
└── README.md             # This file
```