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
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
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

// endpoint to create the users table in database
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
        password VARCHAR(100) NOT NULL
      )
    `);
    // close connection
    await connection.end();
    // send success response
    res.json({ message: "Users table created!" });
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

// start the server on port 3000
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Available endpoints:");
  console.log("  GET    /api/test-db     - test database connection");
  console.log("  POST   /api/setup       - create users table");
  console.log("  POST   /api/signup      - register new user");
  console.log("  POST   /api/login       - login existing user");
  console.log("  GET    /api/users       - get all users");
  console.log("  POST   /api/users       - add new user (old endpoint)");
  console.log("  DELETE /api/users/:id   - delete user by ID");
});
