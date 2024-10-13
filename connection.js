const { Client } = require('pg')

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "rootUser",
    database: "postgres"
})

module.exports = client
client.connect()
    .then(() => console.log('Connected to the database'))
    .catch(error => console.error('Error connecting to the database', error));

module.exports = client;