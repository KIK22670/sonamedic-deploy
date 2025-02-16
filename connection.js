require('dotenv').config(); // Umgebungsvariablen aus der .env-Datei laden
const { Client } = require('pg');

const client = new Client({
  host: process.env.PG_HOST,         // Render-Host
  port: process.env.PG_PORT,         // Standard-Port 5432
  user: process.env.PG_USER,         // Render-Benutzername
  password: process.env.PG_PASSWORD, // Render-Passwort
  database: process.env.PG_DATABASE  // Render-Datenbankname
});

module.exports = client;

client.connect()
  .then(() => console.log('Connected to the database'))
  .catch(error => console.error('Error connecting to the database', error));
