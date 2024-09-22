const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const { check, validationResult } = require('express-validator');

// Initialize the app
const app = express();

// Define middlewares for parsing data
app.use(express.static(__dirname));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
dotenv.config();

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));

// Create a connection to the MySQL database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Check if the connection is successful
connection.connect((err) => {
    if (err) return console.log(err);

    console.log('Database server connected successfully');

    // Create the database if it doesn't exist
    connection.query('CREATE DATABASE IF NOT EXISTS expense_database', (err, result) => {
        if (err) return console.log(err);
        console.log("Database: expense_database created successfully");
    });

    // Switch to the expense_database
    connection.query('USE expense_database', (err, result) => {
        if (err) return console.log(err);
        console.log('Database switched to expense_database');
    });

    // Create users table
    const usersTable = `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(50) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL 
    )`;

    connection.query(usersTable, (err, result) => {
        if (err) return console.log(err);
        console.log('Users table successfully created');
    });

    // create transactions table
    const transactionTable = `CREATE TABLE IF NOT EXISTS transactions(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2),
        date DATE,
        type ENUM('income', 'expense'),
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`;

    connection.query(transactionTable, (err,result) =>{
        if (err) return console.log(err);
        console.log("transactions table created successfully");
    });
});

// Route to serve the registration form
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Route to serve the login form
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// User registration route
app.post('/register', [
    check('email').isEmail().withMessage('Please enter a valid email'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if the user already exists
        const usersQuery = `SELECT * FROM users WHERE email = ?`;
        connection.query(usersQuery, [req.body.email], async (err, data) => {
            if (err) return res.status(500).json("Database query error");

            // If user already exists
            if (data.length > 0) return res.status(409).json("User already exists");

            // Hash the password asynchronously
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

            // Insert the new user into the database
            const newUserQuery = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
            const values = [req.body.email, req.body.username, hashedPassword];
            connection.query(newUserQuery, values, (err, result) => {
                if (err) return res.status(400).json("Something went wrong");

                // Fetch the newly created user
                connection.query('SELECT * FROM users WHERE email = ?', [req.body.email], (err, user) => {
                    if (err) return res.status(500).json("Error fetching user after registration");

                    // Store the user in the session to auto-login
                    req.session.user = user[0];

                    // Store the welcome message in the session
                    req.session.message = `Welcome ${req.body.username}! Your account has been created successfully.`;

                    // Send success response with 201 status
                    return res.status(201).json({ message: "User registered successfully" });
                });
            });
        });
    } catch (err) {
        res.status(500).json("Internal server error");
    }
});


// User login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Query to find the user by email
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result[0];

        // Compare the provided password with the hashed password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }

            if (isMatch) {
                // Store the user in the session
                req.session.user = user;
                return res.redirect('/index');
            } else {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        });
    });
});

// Serve the index.html file for logged-in users
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware to check if the user is authenticated
const userAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Fetch all transactions for the logged-in user
app.get('/transactions', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.session.user.id;
    connection.query('SELECT * FROM transactions WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Add a new transaction for the logged-in user
app.post('/transactions', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, amount, date, type } = req.body;
    const userId = req.session.user.id;

    connection.query(
        'INSERT INTO transactions (name, amount, date, type, user_id) VALUES (?, ?, ?, ?, ?)', 
        [name, amount, date, type, userId], 
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'Transaction added successfully' });
        }
    );
});

// Update a transaction
app.put('/transactions/:id', (req, res) => {
    const { name, amount, date, type } = req.body;
    const { id } = req.params;
    connection.query(
        'UPDATE transactions SET name = ?, amount = ?, date = ?, type = ? WHERE id = ?', 
        [name, amount, date, type, id], 
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Transaction updated successfully' });
        }
    );
});

// Delete a transaction
app.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM transactions WHERE id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    });
});

// Protected dashboard route
app.get('/dashboard', userAuthenticated, (req, res) => {
    res.status(200).json({ message: 'You are viewing a secured route.' });
});

// User logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000...');
});

