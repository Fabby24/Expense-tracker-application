// Select status element for displaying messages
const statusElement = document.querySelector('#statusElement');
const transactionForm = document.querySelector('#transactionForm'); // Corrected ID

let transactions = []; // Initialize transactions

// Fetch transactions from the server when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetch('/transactions')
        .then(response => response.json())
        .then(data => {
            transactions = data; // Load transactions from server
            updateTransactionsUI(); // Update UI with fetched transactions
            updateBalance(); // Recalculate and update balance
        })
        .catch(error => console.error('Error fetching transactions:', error));
});

// Add Transaction Event Listener
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = e.target.name.value.trim();
    const amount = parseFloat(e.target.amount.value);
    const date = e.target.date.value;
    const isIncome = e.target['transaction-type'].value === 'income'; // True for Income, False for Expense

    // Validation to check if fields are not empty
    if (!name || !amount || !date) {
        statusElement.innerText = "All fields are required!";
        return;
    }

    statusElement.innerText = ""; // Clear the status if valid.

    // Create transaction object to send to the server
    const transaction = {
        name,
        amount: isIncome ? amount : -amount, // Negative for expense
        date,
        type: isIncome ? 'income' : 'expense'
    };

    // Send transaction to the server
    fetch('/transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add transaction');
        }
        return response.json();
    })
    .then(data => {
        // After successfully adding, fetch and update the transactions list again
        return fetch('/transactions');
    })
    .then(response => response.json())
    .then(data => {
        transactions = data; // Reload the updated transactions
        updateTransactionsUI(); // Update UI with new transactions
        updateBalance(); // Update the balance after the new transaction
        statusElement.innerText = ""; // Clear status after successful addition
    })
    .catch(error => {
        statusElement.innerText = "Error adding transaction: " + error.message; // Display error
        console.error('Error:', error);
    });

    // Clear form inputs
    transactionForm.reset(); // Resets the entire form
});

// Function to update the UI with transactions
function updateTransactionsUI() {
    const transactionTableBody = document.querySelector('#transaction-table-body');
    transactionTableBody.innerHTML = ''; // Clear existing rows

    transactions.forEach(transaction => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${transaction.name}</td>
            <td>${transaction.amount}</td>
            <td>${transaction.date}</td>
            <td>${transaction.type}</td>
            <td>
                <button class="delete-btn" data-id="${transaction.id}">Delete</button>
            </td>
        `;

        transactionTableBody.appendChild(tr);
    });
}

// Function to update the balance
function updateBalance() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += parseFloat(transaction.amount);
        } else {
            totalExpense += parseFloat(transaction.amount);
        }
    });

    const balanceElement = document.querySelector('#balance');
    const incomeElement = document.querySelector('#income');
    const expenseElement = document.querySelector('#expense');

    balanceElement.innerText = `$${(totalIncome + totalExpense).toFixed(2)}`;
    incomeElement.innerText = `$${totalIncome.toFixed(2)}`;
    expenseElement.innerText = `$${Math.abs(totalExpense).toFixed(2)}`;
}