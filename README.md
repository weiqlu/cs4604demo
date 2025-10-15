# CS4604 Demo

This is a small REST API built with Express and MySQL. Docker is used to run MySQL locally so you don't have to install it.

## Prereqs

- Node.js 18+
- Docker Desktop

## Quick start

1. Start MySQL and phpMyAdmin

```bash
docker-compose up -d
```

MySQL: localhost:3307 (container name: mysql-db)

phpMyAdmin: http://localhost:8080

Login: server=db, user=user, password=password

2. Install and run the server

```bash
cd server
npm install
npm start
```

The API runs at http://localhost:3000

## API

- GET /api/test-db — test DB connection
- POST /api/setup — create the users table
- GET /api/users — list users
- POST /api/users — add a user
- DELETE /api/users/:id — delete a user

## Dev

```bash
npm run dev    # restart on file changes
docker-compose down
docker-compose logs db
```

## Project layout

```
cs4604demo/
   server/
      server.js
      package.json
   docker-compose.yml
   README.md
```
