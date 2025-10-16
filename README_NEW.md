# CS4604 Database Course Demo

A full-stack task management application demonstrating fundamental database concepts and modern web development practices. This project showcases real-world database operations, REST API design, and frontend-backend integration.

## Overview

This educational tool provides hands-on examples of:

- **Complete CRUD Operations**: CREATE, READ, UPDATE, and DELETE with real SQL queries
- **Database Relationships**: Foreign keys, cascading deletes, and one-to-many relationships
- **SQL Best Practices**: Parameterized queries, indexes, aggregate functions, and JOIN operations
- **Modern Web Stack**: Express.js backend with React + TypeScript frontend
- **Docker Integration**: Containerized MySQL setup for consistent development environments

The application implements a practical task manager where users can create accounts, manage tasks, and see how database concepts translate into real applications.

## Tech Stack

**Backend:**

- Node.js with Express.js
- MySQL 8.0 (Docker)
- bcrypt for password hashing
- Parameterized queries for SQL injection prevention

**Frontend:**

- React 18 with TypeScript
- Vite for fast development
- CSS3 with modern responsive design

**Infrastructure:**

- Docker Compose (MySQL + phpMyAdmin)
- RESTful API architecture

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Modern web browser

### Step 1: Start the Database

```bash
docker-compose up -d
```

This launches:

- MySQL database on `localhost:3307`
- phpMyAdmin on `http://localhost:8080` (credentials: user/password)

### Step 2: Start the Backend Server

```bash
cd server
npm install
npm start
```

The API server will run at `http://localhost:3000`

### Step 3: Start the Frontend Client

```bash
cd client
npm install
npm run dev
```

The React app will run at `http://localhost:5173`

### Step 4: Initialize the Database

Open `http://localhost:5173` in your browser and either:

1. Use the web interface to create an account (this will auto-create tables)
2. Or manually hit the setup endpoint: `POST http://localhost:3000/api/setup`

## API Documentation

### User Management Endpoints

| Method | Endpoint         | Description                    | Key Concepts                |
| ------ | ---------------- | ------------------------------ | --------------------------- |
| GET    | `/api/test-db`   | Test database connectivity     | Connection handling         |
| POST   | `/api/setup`     | Create tables with constraints | Schema design, foreign keys |
| POST   | `/api/signup`    | Register new user              | INSERT, password hashing    |
| POST   | `/api/login`     | Authenticate user              | SELECT, authentication      |
| GET    | `/api/users`     | List all users                 | Basic SELECT queries        |
| DELETE | `/api/users/:id` | Delete user by ID              | DELETE with CASCADE         |

### Task Management Endpoints

| Method | Endpoint                        | Description                    | Key Concepts                |
| ------ | ------------------------------- | ------------------------------ | --------------------------- |
| POST   | `/api/tasks`                    | Create new task                | INSERT with foreign keys    |
| GET    | `/api/tasks`                    | Get all tasks with user info   | INNER JOIN operations       |
| GET    | `/api/tasks/user/:userId`       | Get tasks for specific user    | WHERE clauses, filtering    |
| GET    | `/api/tasks/user/:userId/stats` | Get aggregated task statistics | COUNT, SUM, CASE statements |
| PUT    | `/api/tasks/:id`                | Update task                    | UPDATE operations           |
| DELETE | `/api/tasks/:id`                | Delete task                    | DELETE operations           |

**Query Parameters:**

- `GET /api/tasks/user/:userId?completed=true` - Filter by completion status

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table

```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_completed (completed)
);
```

**Key Features:**

- One-to-many relationship (one user has many tasks)
- Foreign key constraint ensures referential integrity
- Cascading delete removes orphaned tasks when user is deleted
- Indexes on user_id and completed for query optimization
- Timestamps track creation and modification times

## What This Demonstrates

This application showcases:

1. **Complete CRUD Operations**: All four database operations with practical examples
2. **Relationship Modeling**: Real foreign key implementation with cascade behavior
3. **Query Complexity**: From simple SELECTs to JOINs and aggregates
4. **Security Best Practices**: bcrypt hashing, parameterized queries
5. **Modern Architecture**: Separation of concerns, REST principles
6. **Production Patterns**: Error handling, input validation, connection pooling

## Development Commands

```bash
# Start server with auto-reload
cd server
npm run dev

# Stop all Docker containers
docker-compose down

# View database logs
docker-compose logs db

# Reset database (clear all data)
docker-compose down -v
docker-compose up -d
```

## Project Structure

```
cs4604demo/
├── client/                      # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.tsx        # Login/signup interface
│   │   │   ├── Auth.css
│   │   │   ├── Dashboard.tsx   # Task management UI
│   │   │   └── Dashboard.css
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── server.js               # Express API with all endpoints
│   └── package.json
├── docker-compose.yml          # MySQL + phpMyAdmin setup
└── README.md
```

## Key Learning Points

This application demonstrates several important database and software engineering concepts:

1. **Database Setup**: Table creation with constraints and data types
2. **Basic Operations**: User registration (INSERT) and authentication (SELECT)
3. **Relationships**: How tasks link to users via foreign keys
4. **Complex Queries**: JOIN operations in `/api/tasks` and aggregates in `/api/tasks/user/:id/stats`
5. **Data Integrity**: Cascading deletes maintain referential integrity
6. **Frontend Integration**: How HTTP requests translate to SQL queries

Important considerations:

- Parameterized queries prevent SQL injection attacks
- Indexes improve query performance for frequently searched columns
- Tradeoffs exist between normalization and query complexity
- Transactions can ensure atomic operations for multi-step processes

## Example cURL Commands

```bash
# Create a new task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "title": "Learn SQL JOINs", "description": "Practice INNER and LEFT joins"}'

# Get task statistics
curl http://localhost:3000/api/tasks/user/1/stats

# Update a task
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

## Potential Extensions

This project can be extended with additional features:

- JWT authentication with refresh tokens
- Pagination and sorting for large task lists
- Task categories with many-to-many relationships
- Full-text search using MySQL FULLTEXT indexes
- Task sharing and collaboration features
- Soft deletes with archived tasks
- Transaction examples for atomic operations

## About

Created as an educational demonstration for CS4604 (Introduction to Database Management Systems). This project illustrates fundamental database concepts through a practical, full-stack application.
