require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT;
const HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// Add User
app.post('/addUser', async (req, res) => {
    const { name, balance } = req.body;

    const query = `
        mutation ($name: String!, $balance: Float!) {
            insert_users_one(object: {name: $name, balance: $balance}) {
                id
                name
                balance
            }
        }
    `;

    const variables = { name, balance };

    try {
        const response = await fetch(HASURA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// Deposit
app.post('/deposit', async (req, res) => {
    const { userId, amount } = req.body;

    const query = `
        mutation ($userId: Int!, $amount: Float!) {
            update_users_by_pk(pk_columns: {id: $userId}, _inc: {balance: $amount}) {
                id
                balance
            }
        }
    `;

    const variables = { userId, amount };

    try {
        const response = await fetch(HASURA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to deposit' });
    }
});

// Withdraw
app.post('/withdraw', async (req, res) => {
    const { userId, amount } = req.body;

    const query = `
        mutation ($userId: Int!, $amount: Float!) {
            update_users_by_pk(pk_columns: {id: $userId}, _inc: {balance: -$amount}) {
                id
                balance
            }
        }
    `;

    const variables = { userId, amount };

    try {
        const response = await fetch(HASURA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to withdraw' });
    }
});

// Get Balance
app.get('/getBalance/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    const query = `
        query ($userId: Int!) {
            users_by_pk(id: $userId) {
                id
                balance
            }
        }
    `;

    const variables = { userId };

    try {
        const response = await fetch(HASURA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get balance' });
    }
});

module.exports = app;
