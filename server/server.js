const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// middleware 
app.use(cors());
app.use(express.json());

// routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", taskRoutes);

// start the server on port 3000
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("\n=== USER ENDPOINTS ===");
  console.log("  GET    /api/test-db              - test database connection");
  console.log(
    "  POST   /api/setup                - create users and tasks tables"
  );
  console.log("  POST   /api/signup               - register new user");
  console.log("  POST   /api/login                - login existing user");
  console.log("  GET    /api/users                - get all users");
  console.log("  DELETE /api/users/:id            - delete user by ID");
  console.log("\n=== TASK ENDPOINTS ===");
  console.log("  POST   /api/tasks                - create new task");
  console.log(
    "  GET    /api/tasks                - get all tasks with user info (JOIN)"
  );
  console.log(
    "  GET    /api/tasks/user/:userId   - get tasks for specific user"
  );
  console.log(
    "  GET    /api/tasks/user/:userId/stats - get task statistics (aggregates)"
  );
  console.log("  PUT    /api/tasks/:id            - update task");
  console.log("  DELETE /api/tasks/:id            - delete task");
});
