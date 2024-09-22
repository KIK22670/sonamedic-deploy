const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Statisches Verzeichnis für CSS, Bilder usw.
app.use(express.static(path.join(__dirname, 'public')));

// Route für die Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
