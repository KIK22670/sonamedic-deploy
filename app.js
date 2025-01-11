// Required imports
const express = require('express');
const path = require('path');
const client = require('./connection.js');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use secure: true if using HTTPS
}));




// Set SendGrid API key
sgMail.setApiKey(process.env.MY_API_KEY);

// Static directory for serving CSS, images, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Template for email verification
const emailVerificationTemplate = (verificationToken) => `
<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Mail-Verifizierung</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .card {
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .card-header {
            background-color: #1b9aaa;
            color: #fff;
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        .card-body {
            padding: 20px;
            text-align: center;
        }
        h1 {
            margin-top: 0;
            font-size: 24px;
        }
        p {
            margin-bottom: 20px;
            color: #555;
            line-height: 1.6;
        }
        .verification-link a {
            display: inline-block;
            padding: 10px 20px;
            background-color: #1b9aaa;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s ease;
        }
        .verification-link a:hover {
            background-color: #0f7c8a;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="card">
            <div class="card-header">
                <h1>E-Mail-Verifizierung Erforderlich</h1>
            </div>
            <div class="card-body">
                <p>Bitte klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu verifizieren:</p>
                <div class="verification-link">
                    <a href="http://localhost:3000/verify-email/${verificationToken}">Verify Email</a>
                </div>
            </div>
        </div>
    </div>
</body>

</html>
`;


const resetPasswordTemplate = (token) => `
<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Passwort zurücksetzen!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }

        .card {
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .card-header {
            background-color: #1b9aaa;
            color: #fff;
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }

        .card-body {
            padding: 20px;
            text-align: center;
        }

        h1 {
            margin-top: 0;
            font-size: 24px;
        }

        p {
            margin-bottom: 20px;
            color: #555;
            line-height: 1.6;
        }

        .verification-link a {
            display: inline-block;
            padding: 10px 20px;
            background-color: #1b9aaa;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s ease;
        }

        .verification-link a:hover {
            background-color: #0f7c8a;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="card">
            <div class="card-header">
                <h1>Passwort zurücksetzen</h1>
            </div>
            <div class="card-body">
                <p>Bitte klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen</p>
                <div class="verification-link">
                <a href="http://localhost:3000/reset-password/${token}">Zurücksetzen</a>
                </div>
            </div>
        </div>
    </div>
</body>

</html>
`;

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Route for login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route for registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});

app.get('/email-verification', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'emailverification.html'));
});

app.get('/resetpasswordverification', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resetpasswordverification.html'));
});

// Registration route
app.post('/registration', async (req, res) => {
    const { emailregister, passwortregister } = req.body;

    try {
        // Check if email is already registered
        const checkEmailQuery = {
            text: 'SELECT * FROM u_userverwaltung WHERE u_email = $1',
            values: [emailregister],
        };

        const emailCheckResult = await client.query(checkEmailQuery);

        if (emailCheckResult.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if password meets requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(passwortregister)) {
            return res.status(400).json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long' });
        }

        const verificationToken = crypto.randomBytes(20).toString('hex');
        const hashedPassword = await bcrypt.hash(passwortregister, 10);

        // Insert user into the database
        const insertUserQuery = {
            text: 'INSERT INTO u_userverwaltung(u_email, u_passwort, u_verification_token) VALUES($1, $2, $3) RETURNING *',
            values: [emailregister, hashedPassword, verificationToken],
        };

        await client.query(insertUserQuery);

        // Send verification email
        const msg = {
            to: emailregister,
            from: 'kikicaleksandra@gmail.com',
            subject: 'Verify Your Email Address for SonaMedic',
            html: emailVerificationTemplate(verificationToken),
        };
        await sgMail.send(msg);

        res.redirect('/email-verification');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Email verification route
app.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Find user by verification token
        const findUserQuery = {
            text: 'SELECT * FROM u_userverwaltung WHERE u_verification_token = $1',
            values: [token],
        };

        const { rows } = await client.query(findUserQuery);

        if (rows.length === 0) {
            return res.status(404).send('Invalid verification token.');
        }

        const user = rows[0];

        // Update user as verified
        const updateUserQuery = {
            text: 'UPDATE u_userverwaltung SET u_verified = true WHERE u_id = $1',
            values: [user.u_id],
        };

        await client.query(updateUserQuery);

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, passwort } = req.body;
        console.log('Request Body:', req.body);

        if (!passwort) {
            return res.redirect(`/login?error=Passwort ist erforderlich.`);
        }

        const query = {
            text: 'SELECT * FROM u_userverwaltung WHERE LOWER(u_email) = LOWER($1)',
            values: [email.toLowerCase()],
        };

        const result = await client.query(query);
        console.log('Database Query Result:', result.rows);

        if (result.rows.length === 1) {
            const user = result.rows[0];

            if (!user.u_verified) {
                return res.redirect(`/login?error=Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden.`);
            }

            if (bcrypt.compareSync(passwort, user.u_passwort)) {
                req.session.user = { id: user.u_id, email: user.u_email };
                res.redirect('/stammdaten');
            } else {
                return res.redirect(`/login?error=Ungültige E-Mail oder Passwort.`);
            }
        } else {
            return res.redirect(`/login?error=Ungültige E-Mail oder Passwort.`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.redirect(`/login?error=Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.`);
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.redirect('/home.html');
        }
    });
});


app.get('/stammdaten', (req, res, next) => {
    console.log("=======================================");
    console.log(req.session.user);
    console.log(req.session.user);
    console.log("=======================================");
    if (req.session.user) {

        // User is logged in, proceed
        res.sendFile(path.join(__dirname, 'public', 'stammdaten.html'));
    } else {
        // User is not logged in, redirect to login page
        res.redirect('/login');
    }
});

// POST-Anfrage zum Speichern oder Aktualisieren der Patientendaten
app.post('/speichereStammdaten', async (req, res) => {
    try {
        const userID = req.session.user.id;
        const { vorname, nachname, email, telefonnummer, geburtsdatum, svnr, allergien, vorerkrankungen, medikamente } = req.body;

        // Überprüfen, ob bereits Patientendaten für diesen Benutzer vorhanden sind
        const checkExistingDataQuery = {
            text: 'SELECT * FROM p_patienten WHERE p_id = $1',
            values: [userID],
        };
        const existingDataResult = await client.query(checkExistingDataQuery);

        if (existingDataResult.rows.length > 0) {
            // Es gibt bereits Patientendaten für diesen Benutzer, daher aktualisieren Sie sie
            const updateDataQuery = {
                text: `UPDATE p_patienten 
               SET p_vorname = $1, p_nachname = $2, p_email = $3, p_telefonnummer = $4, p_geburtsdatum = $5,
                   p_svnr = $6, p_allergien = $7, p_vorerkrankungen = $8, p_medikamente = $9, p_stammdaten = $10
               WHERE p_id = $11`,
                values: [vorname, nachname, email, telefonnummer, geburtsdatum, svnr, allergien, vorerkrankungen, medikamente, JSON.stringify(req.body), userID],
            };
            await client.query(updateDataQuery);
        } else {
            // Es gibt keine vorhandenen Patientendaten für diesen Benutzer, daher fügen Sie neue Daten hinzu
            const insertDataQuery = {
                text: `INSERT INTO p_patienten
               (p_id, p_vorname, p_nachname, p_email, p_telefonnummer, p_geburtsdatum, p_svnr, p_allergien, p_vorerkrankungen, p_medikamente, p_stammdaten) 
               VALUES 
               ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                values: [userID, vorname, nachname, email, telefonnummer, geburtsdatum, svnr, allergien, vorerkrankungen, medikamente, JSON.stringify(req.body)],
            };
            await client.query(insertDataQuery);
        }

        res.status(201).json({ message: 'Patientendaten wurden gespeichert/aktualisiert' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/ladeStammdaten', async (req, res) => {
    try {
        const userID = req.session.user.id;
        const result = await client.query('SELECT p_stammdaten FROM p_patienten WHERE p_id = $1', [userID]);

        if (result.rows.length > 0 && result.rows[0].p_stammdaten) {
            // Server: Senden Sie die Stammdaten als JSON-Zeichenfolgen
            res.json({ success: true, stammdaten: JSON.stringify(result.rows[0].p_stammdaten) });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Route to get patient data
app.get('/api/patient/:id', async (req, res) => {
    const p_id = req.params.id;
    try {
        const query = {
            text: 'SELECT p_vorname, p_nachname, p_geburtsdatum, p_geschlecht FROM p_patienten WHERE p_id = $1',
            values: [p_id],
        };
        const { rows } = await client.query(query);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Patient nicht gefunden' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Route for speech in noise test questions
app.get('/api/speech_in_noise_test/questions', async (req, res) => {
    try {
        const query = {
            text: 'SELECT sinf_id, sinf_frage FROM sinf_frage',
        };
        const { rows } = await client.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Route for submitting answers to speech in noise test
app.post('/api/speech_in_noise_test/submit', async (req, res) => {
    const answers = req.body;
    try {
        for (const [questionId, answer] of Object.entries(answers)) {
            const query = {
                text: 'INSERT INTO sin_speech_in_noise_test (sin_id, sin_antwort) VALUES ($1, $2)',
                values: [questionId, answer],
            };
            await client.query(query);
        }
        res.status(200).send('Antworten gespeichert');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Route to retrieve audio files
app.get('/audios/:filename', (req, res) => {
    console.log(`Anfrage nach Audio-Datei: ${req.params.filename}`);
    res.sendFile(path.join(__dirname, 'public', 'audios', req.params.filename));
});


// Forgot Password validation
function validateResetInput(data) {
    let errors = {};

    data.email = data.email.trim();

    if (!data.email) {
        errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
        errors.email = 'Email is invalid';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0,
    };
}

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
    const { errors, isValid } = validateResetInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const token = crypto.randomBytes(48).toString('hex');
    const expirationTime = new Date(Date.now() + 3600000); // 1 hour expiration

    try {
        // Check if user with provided email exists
        const userResult = await client.query('SELECT * FROM u_userverwaltung WHERE u_email = $1', [req.body.email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ email: 'Invalid email address' });
        }

        // Save token and expiration date in database
        await client.query(
            'UPDATE u_userverwaltung SET u_resetpasswordtoken = $1, u_resetpasswordexpires = $2 WHERE u_email = $3',
            [token, expirationTime, req.body.email]
        );

        // Send email to user
        const mailOptions = {
            to: req.body.email,
            from: 'kikicaleksandra@gmail.com',
            subject: 'Password Reset',
            html: resetPasswordTemplate(token)
        };
        await sgMail.send(mailOptions);

        res.status(200).sendFile(path.join(__dirname, 'public', 'resetpasswordverification.html'));
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json("Internal Server Error");
    }
});

// Reset Password Route
app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ confirmPassword: 'Passwords do not match' });
    }

    try {
        // Check if the token is valid and not expired
        const userResult = await client.query(
            'SELECT * FROM u_userverwaltung WHERE u_resetpasswordtoken = $1 AND u_resetpasswordexpires > CURRENT_TIMESTAMP',
            [token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ token: 'Token is invalid or has expired' });
        }

        // Update user password
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query(
            'UPDATE u_userverwaltung SET u_passwort = $1, u_resetpasswordtoken = NULL, u_resetpasswordexpires = NULL WHERE u_resetpasswordtoken = $2',
            [hashedPassword, token]
        );

        res.status(200).sendFile(path.join(__dirname, 'public', 'resetsuccess.html'));
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json("Internal Server Error");
    }
});

// Reset Password Route
app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Check if the token is valid and not expired
        const userResult = await client.query(
            'SELECT * FROM u_userverwaltung WHERE u_resetpasswordtoken = $1 AND u_resetpasswordexpires > CURRENT_TIMESTAMP',
            [token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ token: 'Token is invalid or has expired' });
        }

        // If the token is valid, render the HTML page for resetting the password
        res.sendFile(path.join(__dirname, 'public', 'newpassword.html'));
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json("Internal Server Error");
    }
});

// Endpunkt zum Speichern von Reintonaudiometrie-Ergebnissen
app.post('/saveTestResult', async (req, res) => {
    const { p_id, testNumber, frequency, result, ear } = req.body; 
    console.log('Eingehende Daten:', req.body);

    try {
        const query = {
            text: `
                INSERT INTO reintonaudiometrie_ergebnisse (p_id, testnummer, frequenz, ergebnis, ohr)
                VALUES ($1, $2, $3, $4, $5)
            `,
            values: [p_id, testNumber, frequency, result, ear], 
        };

        console.log('Query:', query);
        await client.query(query);
        res.status(200).json({ message: 'Ergebnis erfolgreich gespeichert.' });
    } catch (error) {
        console.error('Fehler beim Speichern des Testergebnisses:', error);
        res.status(500).json({ error: 'Fehler beim Speichern des Ergebnisses.' });
    }
});

// Endpunkt zum Abrufen von Reintonaudiometrie-Ergebnissen
app.get('/getAudiometrieTests', async (req, res) => {
    const { p_id } = req.query; 

    try {
        const query = {
            text: `
                SELECT testnummer, frequenz, ergebnis, ohr, erstellt_am
                FROM reintonaudiometrie_ergebnisse
                WHERE p_id = $1
                ORDER BY testnummer, erstellt_am
            `,
            values: [p_id], 
        };

        const results = await client.query(query);
        res.json(results.rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Testergebnisse:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Ergebnisse.' });
    }
});

// Termine 

// Öffnungszeiten
const openingHours = {
    Dienstag: [
        { start: '09:00', end: '13:00' },
        { start: '13:30', end: '15:30' },
    ],
    Mittwoch: [
        { start: '09:00', end: '13:00' },
        { start: '13:30', end: '15:50' },
    ],
    Donnerstag: [
        { start: '09:00', end: '13:00' },
        { start: '13:30', end: '18:00' },
    ],
};

async function insertTimeSlotsIntoDatabase(openingHours) {
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Bis zu 3 Monate in die Zukunft

    const slots = [];
    while (today <= endDate) {
        const dayName = today.toLocaleDateString('de-DE', { weekday: 'long' });
        if (openingHours[dayName]) {
            openingHours[dayName].forEach(({ start, end }) => {
                let current = new Date(today);
                const [startHour, startMinute] = start.split(':').map(Number);
                current.setHours(startHour, startMinute, 0, 0);

                const endTime = new Date(today);
                const [endHour, endMinute] = end.split(':').map(Number);
                endTime.setHours(endHour, endMinute, 0, 0);

                while (current < endTime) {
                    const slotStart = current.toTimeString().split(' ')[0]; // HH:MM:SS
                    current.setMinutes(current.getMinutes() + 30);
                    const slotEnd = current.toTimeString().split(' ')[0];

                    slots.push({ start: slotStart, end: slotEnd });
                }
            });
        }
        today.setDate(today.getDate() + 1);
    }

    // Einfügen in die Datenbank
    try {
        for (const slot of slots) {
            await client.query(
                'INSERT INTO z_zeitslots (z_startzeit, z_endzeit) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [slot.start, slot.end]
            );
        }
        console.log('Zeitfenster erfolgreich in die Datenbank eingefügt.');
    } catch (error) {
        console.error('Fehler beim Einfügen der Zeitfenster:', error);
    }
}

// Funktion aufrufen
insertTimeSlotsIntoDatabase(openingHours);


// Funktion zur Generierung von Zeitfenstern
function generateTimeSlots(openingHours) {
    const slots = [];
    const today = new Date();
    today.setDate(today.getDate() + 3); // Starte 3 Tage in der Zukunft
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Bis zu 3 Monate in die Zukunft

    while (today <= endDate) {
        const dayName = today.toLocaleDateString('de-DE', { weekday: 'long' });
        if (openingHours[dayName]) {
            openingHours[dayName].forEach(({ start, end }) => {
                let current = new Date(today);
                const [startHour, startMinute] = start.split(':').map(Number);
                current.setHours(startHour, startMinute, 0, 0);

                const endTime = new Date(today);
                const [endHour, endMinute] = end.split(':').map(Number);
                endTime.setHours(endHour, endMinute, 0, 0);

                while (current < endTime) {
                    slots.push({
                        day: dayName,
                        t_datum: current.toISOString().split('T')[0],
                        t_uhrzeit: current.toTimeString().substring(0, 5),
                    });
                    current.setMinutes(current.getMinutes() + 30);
                }
            });
        }
        today.setDate(today.getDate() + 1); // Zum nächsten Tag wechseln
    }
    return slots;
}

let slots = generateTimeSlots(openingHours);

// Endpunkt: Verfügbare Slots abrufen
app.get('/slots', async (req, res) => {
    try {
        const gebuchteTermine = await client.query('SELECT t_datum, t_uhrzeit FROM t_termine');
        const gebuchteSlots = gebuchteTermine.rows.map(slot => `${slot.t_datum} ${slot.t_uhrzeit}`);
        const availableSlots = slots.filter(slot => !gebuchteSlots.includes(`${slot.t_datum} ${slot.t_uhrzeit}`));
        res.json(availableSlots);
    } catch (error) {
        console.error('Fehler beim Abrufen der verfügbaren Slots:', error);
        res.status(500).send('Interner Serverfehler');
    }
});




// Endpunkt: Termin buchen
app.post('/termine', async (req, res) => {
    const { t_datum, t_uhrzeit, t_termintyp } = req.body;
    const t_p_id = req.session.user?.id;

    console.log('Eingehende Buchungsdaten:', { t_datum, t_uhrzeit, t_termintyp, t_p_id });

    if (!t_p_id || !t_termintyp) {
        console.error('Fehlende erforderliche Felder:', { t_p_id, t_termintyp });
        return res.status(400).send('Patienten-ID und Termintyp sind erforderlich');
    }

    try {
        // Abrufen der Termintyp-ID
        const termintypResult = await client.query(
            'SELECT tt_id FROM tt_termintyp WHERE tt_bezeichnung = $1',
            [t_termintyp]
        );

        if (termintypResult.rows.length === 0) {
            console.error('Ungültiger Termintyp:', t_termintyp);
            return res.status(400).send('Ungültiger Termintyp');
        }

        const tt_termintyp_tt_id = termintypResult.rows[0].tt_id;

        // Abrufen der Zeitslot-ID
        const zeitslotResult = await client.query(
            'SELECT z_id FROM z_zeitslots WHERE z_startzeit = $1',
            [t_uhrzeit]
        );

        if (zeitslotResult.rows.length === 0) {
            console.error('Ungültiges Zeitfenster:', t_uhrzeit);
            return res.status(400).send('Ungültiges Zeitfenster');
        }

        const z_zeitslots_z_id = zeitslotResult.rows[0].z_id;

        // Termin einfügen
        const result = await client.query(
            'INSERT INTO t_termine (t_datum, t_uhrzeit, t_termintyp, t_p_id, tt_termintyp_tt_id, z_zeitslots_z_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [t_datum, t_uhrzeit, t_termintyp, t_p_id, tt_termintyp_tt_id, z_zeitslots_z_id]
        );

        console.log('Termin erfolgreich gebucht:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Fehler beim Hinzufügen eines Termins:', error.message, error.stack);
        res.status(500).send('Interner Serverfehler');
    }
});



// Endpunkt: Alle gebuchten Termine abrufen
app.get('/termine', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM t_termine');
        res.json(result.rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Termine:', error);
        res.status(500).send('Interner Serverfehler');
    }
});

// Endpunkt: Termin stornieren
app.delete('/termine/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('DELETE FROM t_termine WHERE t_id = $1 RETURNING *', [id]);
        if (result.rowCount > 0) {
            console.log(`Termin mit ID ${id} wurde gelöscht.`);
            res.status(200).send('Termin erfolgreich gelöscht');
        } else {
            res.status(404).send('Termin nicht gefunden');
        }
    } catch (error) {
        console.error('Fehler beim Löschen eines Termins:', error);
        res.status(500).send('Interner Serverfehler');
    }
});

// Diese Route muss im Server definiert sein
app.get('/termintypen', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM tt_termintyp');
        res.status(200).json(result.rows);  // Antwort als JSON senden
    } catch (error) {
        console.error('Fehler beim Abrufen der Termintypen:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });  // JSON zurückgeben bei Fehler
    }
});
// Endpunkt: Termin bearbeiten
app.put('/termine/:id', async (req, res) => {
    const { id } = req.params;
    const { t_termintyp } = req.body; // Nur den Termintyp verwenden (ID)
    try {
        const result = await client.query(
            'UPDATE t_termine SET t_termintyp = $1 WHERE t_id = $2 RETURNING *',
            [t_termintyp, id]
        );
        if (result.rowCount > 0) {
            console.log(`Termin mit ID ${id} wurde aktualisiert:`, result.rows[0]);
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).send('Termin nicht gefunden');
        }
    } catch (error) {
        console.error('Fehler beim Bearbeiten eines Termins:', error);
        res.status(500).send('Interner Serverfehler');
    }
});

// Speech-in-Noise Test
// Speech-in-Noise Test - Überprüfen, ob der Test heute bereits gemacht wurde
app.get('/speech-in-noise/check-today', async (req, res) => {
    const u_id = req.session.user?.id;

    if (!u_id) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    try {
        // Hole p_id des aktuellen Benutzers
        const userQuery = await client.query(
            'SELECT u_p_id FROM u_userverwaltung WHERE u_id = $1',
            [u_id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        const p_id = userQuery.rows[0].u_p_id;

        // Prüfen, ob der Benutzer heute bereits einen Test durchgeführt hat
        const today = new Date().toISOString().split('T')[0];
        const testTodayQuery = await client.query(
            `SELECT * FROM sin_speech_in_noise_test WHERE sin_p_id = $1 AND sin_datum = $2`,
            [p_id, today]
        );

        if (testTodayQuery.rows.length > 0) {
            res.json({ alreadyTaken: true });
        } else {
            res.json({ alreadyTaken: false });
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Tests:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

app.post('/speech-in-noise/save-result', async (req, res) => {
    const { richtigeAntworten, falscheAntworten } = req.body;
    const u_id = req.session.user?.id;

    if (!u_id) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    try {
        // Prüfe, ob der Benutzer bereits mit einer Patienten-ID verknüpft ist
        const userQuery = await client.query(
            'SELECT u_p_id FROM u_userverwaltung WHERE u_id = $1',
            [u_id]
        );

        let p_id = userQuery.rows[0]?.u_p_id;

        if (!p_id) {
            // Falls keine p_id vorhanden ist, prüfe, ob bereits ein Patient mit der gleichen ID existiert
            const existingPatient = await client.query(
                'SELECT p_id FROM p_patienten WHERE p_id = $1',
                [u_id]
            );

            if (existingPatient.rows.length > 0) {
                // Falls der Patient existiert, verknüpfe ihn mit dem Benutzer
                p_id = existingPatient.rows[0].p_id;

                await client.query(
                    'UPDATE u_userverwaltung SET u_p_id = $1 WHERE u_id = $2',
                    [p_id, u_id]
                );
            } else {
                // Falls kein Patient existiert, erstelle einen neuen Patienteneintrag
                const insertPatient = await client.query(
                    'INSERT INTO p_patienten (p_id) VALUES ($1) RETURNING p_id',
                    [u_id]
                );

                p_id = insertPatient.rows[0].p_id;

                // Verknüpfe den neuen Patienten-Eintrag mit dem Benutzer
                await client.query(
                    'UPDATE u_userverwaltung SET u_p_id = $1 WHERE u_id = $2',
                    [p_id, u_id]
                );
            }
        }

        // Ergebnis speichern
        const result = await client.query(
            `INSERT INTO sin_speech_in_noise_test (sin_datum, sin_startzeit, sin_endzeit, sin_ergebnis, sin_p_id)
             VALUES (CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $1, $2)
             RETURNING sin_id`,
            [richtigeAntworten / (richtigeAntworten + falscheAntworten), p_id]
        );

        // Details speichern
        const sin_id = result.rows[0].sin_id;
        await client.query(
            `INSERT INTO sine_ergebnisse (sine_richtigeAntworten, sine_falscheAntworten, sine_sin_id)
             VALUES ($1, $2, $3)`,
            [richtigeAntworten, falscheAntworten, sin_id]
        );

        res.status(201).json({ message: 'Testergebnisse erfolgreich gespeichert.' });
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

app.get('/speech-in-noise/results', async (req, res) => {
    const u_id = req.session.user?.id;

    if (!u_id) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    try {
        // Hole p_id des aktuellen Benutzers aus u_userverwaltung
        const userQuery = await client.query(
            'SELECT u_p_id FROM u_userverwaltung WHERE u_id = $1',
            [u_id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        const p_id = userQuery.rows[0].u_p_id;

        // Abrufen der Testergebnisse aus der Tabelle
        const results = await client.query(
            `SELECT sin_datum, sin_ergebnis
             FROM sin_speech_in_noise_test
             WHERE sin_p_id = $1
             ORDER BY sin_datum DESC`,
            [p_id]
        );

        res.json(results.rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Testergebnisse:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});