# Expense Tracker Application

This is a simple Expense Tracker built with **Node.js**, **Express**, and **MySQL**.

## Features

- **User Authentication**: Register and login.
- **Session Management**: Secure user sessions.
- **Expense Tracking**: Add, view, edit, and delete transactions.
- **Database**: MySQL for data storage.

## Setup Instructions

### Step 1: Clone the repository
```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
Step 2: Install dependencies
npm install
Step 3: Set up environment variables
Create a .env file with the following:

env

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
SESSION_SECRET=yourSecret
NODE_ENV=development
Step 4: Run the application

npm start
Open http://localhost:3000 to access the app.

API Endpoints
POST /register: Register a new user.
POST /login: Login with email and password.
GET /transactions: Get all user transactions.
POST /transactions: Add a new transaction.
PUT /transactions/:id: Update a transaction.
DELETE /transactions/:id: Delete a transaction.
