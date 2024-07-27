require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('docs')); 

const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

// Middleware to set headers for Hasura
const setHeaders = (req, res, next) => {
    req.headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
    next();
};

// Root endpoint for basic testing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

app.post('/addUser', setHeaders, async (req, res) => {
    const { name, balance } = req.body;

    try {
        // Insert new user
        const addUserMutation = `
            mutation ($name: String!, $balance: numeric!) {
                insert_users_one(object: {name: $name, balance: $balance}) {
                    id
                    name
                    balance
                }
            }
        `;
        const addUserResponse = await axios.post(
            HASURA_ENDPOINT,
            {
                query: addUserMutation,
                variables: { name, balance }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
                }
            }
        );

        const newUser = addUserResponse.data.data.insert_users_one;
        res.status(200).json({ message: 'User added successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});





app.post('/deposit', setHeaders, async (req, res) => {
    const { userId, amount } = req.body;

    try {
        // Fetch current balance
        const userQuery = `
            query ($id: Int!) {
                users_by_pk(id: $id) {
                    balance
                }
            }
        `;
        const userResponse = await axios.post(
            HASURA_ENDPOINT,
            {
                query: userQuery,
                variables: { id: userId }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
                }
            }
        );

        const currentBalance = userResponse.data.data.users_by_pk.balance;
        const newBalance = currentBalance + amount;

        // Update balance
        const updateBalanceMutation = `
            mutation ($id: Int!, $balance: numeric!) {
                update_users_by_pk(pk_columns: {id: $id}, _set: {balance: $balance}) {
                    id
                    balance
                }
            }
        `;
        await axios.post(
            HASURA_ENDPOINT,
            {
                query: updateBalanceMutation,
                variables: { id: userId, balance: newBalance }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
                }
            }
        );

        // Log transaction
        const logTransactionMutation = `
            mutation ($userId: Int!, $type: String!, $amount: numeric!) {
                insert_transactions_one(object: {user_id: $userId, type: $type, amount: $amount}) {
                    id
                }
            }
        `;
        await axios.post(
            HASURA_ENDPOINT,
            {
                query: logTransactionMutation,
                variables: { userId, type: 'deposit', amount }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
                }
            }
        );

        res.status(200).json({ message: 'Deposit successful', newBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.post('/withdraw', setHeaders, async (req, res) => {
    const { userId, amount } = req.body;

    try {
        // Fetch current balance
        const userQuery = `
            query ($id: Int!) {
                users_by_pk(id: $id) {
                    balance
                }
            }
        `;
        const userResponse = await axios.post(
            HASURA_ENDPOINT,
            {
                query: userQuery,
                variables: { id: userId }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
                }
            }
        );

        const currentBalance = userResponse.data.data.users_by_pk.balance;

        if (currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        const newBalance = currentBalance - amount;

        // Update balance
        const updateBalanceMutation = `
            mutation ($id: Int!, $balance: numeric!) {
                update_users_by_pk(pk_columns: {id: $id}, _set: {balance: $balance}) {
                    id
                    balance
                }
            }
        `;
        await axios.post(
            HASURA_ENDPOINT,
            {
                query: updateBalanceMutation,
                variables: { id: userId, balance: newBalance }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
                }
            }
        );

        // Log transaction
        const logTransactionMutation = `
            mutation ($userId: Int!, $type: String!, $amount: numeric!) {
                insert_transactions_one(object: {user_id: $userId, type: $type, amount: $amount}) {
                    id
                }
            }
        `;
        await axios.post(
            HASURA_ENDPOINT,
            {
                query: logTransactionMutation,
                variables: { userId, type: 'withdrawal', amount }
            },
            {
                headers: {
                    'x-hasura-admin-secret': HASURA_ADMIN_SECRET
                }
            }
        );

        res.status(200).json({ message: 'Withdrawal successful', newBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
