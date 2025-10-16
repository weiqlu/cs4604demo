// import required packages
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

// create express app
const app = express();
// middleware to parse JSON request bodies
app.use(express.json());
// enable CORS so frontend can make requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// database connection configuration
const config = {
  host: "localhost", // database server location
  port: 3307, // database port
  user: "user", // database username
  password: "password", // database password
  database: "db", // database name
};

// endpoint to test if database connection works
app.get("/api/test-db", async (req, res) => {
  try {
    // try to connect to database
    const connection = await mysql.createConnection(config);
    // run a simple query to test connection
    await connection.execute("SELECT 1");
    // close the connection
    await connection.end();
    // send success response
    res.json({ message: "Database connected successfully!" });
  } catch (error) {
    // if connection fails, send error response
    res
      .status(500)
      .json({ error: "Database connection failed", details: error.message });
  }
});

// endpoint to create the users and tasks tables in database
app.post("/api/setup", async (req, res) => {
  try {
    // connect to database
    const connection = await mysql.createConnection(config);

    // create users table if it doesn't exist
    // IF NOT EXISTS prevents errors if table already exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // create tasks table with foreign key to users
    // demonstrates one-to-many relationship (one user has many tasks)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
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
      )
    `);

    // close connection
    await connection.end();
    // send success response
    res.json({ message: "Users and tasks tables created successfully!" });
  } catch (error) {
    // if table creation fails, send error
    res.status(500).json({ error: error.message });
  }
});

// endpoint to signup (register) a new user
app.post("/api/signup", async (req, res) => {
  try {
    // extract username, email and password from request body
    const { username, email, password } = req.body;

    // validate that all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // connect to database
    const connection = await mysql.createConnection(config);

    // insert new user into database with hashed password
    const [result] = await connection.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    // close connection
    await connection.end();

    // send success response with new user info
    res.json({
      message: "User created successfully!",
      userId: result.insertId,
      username: username,
    });
  } catch (error) {
    // if insertion fails, send error (could be duplicate username/email)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// endpoint to login an existing user
app.post("/api/login", async (req, res) => {
  try {
    // extract username and password from request body
    const { username, password } = req.body;

    // validate that both fields are provided
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // connect to database
    const connection = await mysql.createConnection(config);

    // get user by username (including hashed password for comparison)
    const [rows] = await connection.execute(
      "SELECT id, username, email, password FROM users WHERE username = ?",
      [username]
    );

    // close connection
    await connection.end();

    // check if user was found
    if (rows.length === 0) {
      // no user found with that username
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];

    // compare provided password with stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      // password doesn't match
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // password matches, login successful
    res.json({
      message: "Login successful!",
      userId: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    // if query fails, send error
    res.status(500).json({ error: error.message });
  }
});

// endpoint to get all users from database
app.get("/api/users", async (req, res) => {
  try {
    // connect to database
    const connection = await mysql.createConnection(config);
    // get all users from users table
    const [rows] = await connection.execute("SELECT * FROM users");
    // close connection
    await connection.end();
    // send all users as JSON array
    res.json(rows);
  } catch (error) {
    // if query fails, send error
    res.status(500).json({ error: error.message });
  }
});

// endpoint to delete a specific user by ID
app.delete("/api/users/:id", async (req, res) => {
  try {
    // get user ID from URL parameter (/api/users/123 -> id = 123)
    const { id } = req.params;
    // connect to database
    const connection = await mysql.createConnection(config);

    // delete user with matching ID
    const [result] = await connection.execute(
      "DELETE FROM users WHERE id = ?",
      [id] // user ID to delete
    );

    // close connection
    await connection.end();

    // check if any rows were actually deleted
    if (result.affectedRows === 0) {
      // no user found with that ID
      res.status(404).json({ error: "User not found" });
    } else {
      // user was successfully deleted
      res.json({ message: "User deleted!", deletedUserId: id });
    }
  } catch (error) {
    // if deletion fails, send error
    res.status(500).json({ error: error.message });
  }
});

// ==================== TASK MANAGEMENT ENDPOINTS ====================

// endpoint to create a new task for a user
app.post("/api/tasks", async (req, res) => {
  try {
    // extract task data from request body
    const { user_id, title, description } = req.body;

    // validate required fields
    if (!user_id || !title) {
      return res.status(400).json({ error: "user_id and title are required" });
    }

    // connect to database
    const connection = await mysql.createConnection(config);

    // insert new task into database
    const [result] = await connection.execute(
      "INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)",
      [user_id, title, description || null]
    );

    // get the newly created task to return it
    const [newTask] = await connection.execute(
      "SELECT * FROM tasks WHERE id = ?",
      [result.insertId]
    );

    // close connection
    await connection.end();

    // send success response with new task
    res.json({
      message: "Task created successfully!",
      task: newTask[0],
    });
  } catch (error) {
    // handle foreign key constraint errors (invalid user_id)
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// endpoint to get all tasks for a specific user
app.get("/api/tasks/user/:userId", async (req, res) => {
  try {
    // get user ID from URL parameter
    const { userId } = req.params;
    // optional query parameter to filter by completion status
    const { completed } = req.query;

    // connect to database
    const connection = await mysql.createConnection(config);

    let query = "SELECT * FROM tasks WHERE user_id = ?";
    const params = [userId];

    // add filter for completed status if provided
    if (completed !== undefined) {
      query += " AND completed = ?";
      params.push(completed === "true" ? 1 : 0);
    }

    // order by creation date, newest first
    query += " ORDER BY created_at DESC";

    // execute query
    const [tasks] = await connection.execute(query, params);

    // close connection
    await connection.end();

    // send tasks array
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint to get all tasks with user information (demonstrates JOIN)
app.get("/api/tasks", async (req, res) => {
  try {
    // connect to database
    const connection = await mysql.createConnection(config);

    // JOIN tasks with users to get username for each task
    // this demonstrates a SQL JOIN operation
    const [tasks] = await connection.execute(`
      SELECT 
        tasks.id,
        tasks.title,
        tasks.description,
        tasks.completed,
        tasks.created_at,
        tasks.updated_at,
        tasks.user_id,
        users.username
      FROM tasks
      INNER JOIN users ON tasks.user_id = users.id
      ORDER BY tasks.created_at DESC
    `);

    // close connection
    await connection.end();

    // send tasks with user info
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint to get task statistics for a user (demonstrates aggregate functions)
app.get("/api/tasks/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;

    // connect to database
    const connection = await mysql.createConnection(config);

    // use aggregate functions to calculate statistics
    const [stats] = await connection.execute(
      `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_tasks
      FROM tasks
      WHERE user_id = ?
    `,
      [userId]
    );

    // close connection
    await connection.end();

    // send statistics
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint to update a task (demonstrates UPDATE operation)
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // validate at least one field is provided for update
    if (
      title === undefined &&
      description === undefined &&
      completed === undefined
    ) {
      return res
        .status(400)
        .json({ error: "At least one field must be provided for update" });
    }

    // connect to database
    const connection = await mysql.createConnection(config);

    // build dynamic UPDATE query based on provided fields
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (completed !== undefined) {
      updates.push("completed = ?");
      values.push(completed ? 1 : 0);
    }

    // add task ID to end of values array
    values.push(id);

    // execute update query
    const [result] = await connection.execute(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // check if task was found and updated
    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ error: "Task not found" });
    }

    // get the updated task
    const [updatedTask] = await connection.execute(
      "SELECT * FROM tasks WHERE id = ?",
      [id]
    );

    // close connection
    await connection.end();

    // send updated task
    res.json({
      message: "Task updated successfully!",
      task: updatedTask[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint to delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // connect to database
    const connection = await mysql.createConnection(config);

    // delete task by ID
    const [result] = await connection.execute(
      "DELETE FROM tasks WHERE id = ?",
      [id]
    );

    // close connection
    await connection.end();

    // check if task was found and deleted
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Task not found" });
    } else {
      res.json({ message: "Task deleted successfully!", deletedTaskId: id });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
