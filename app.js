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
            text: 'UPDATE u_userverwaltung SET verified = true WHERE u_id = $1',
            values: [user.u_id],
        };

        await client.query(updateUserQuery);

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, passwort } = req.body;
        console.log('Request Body:', req.body);

        if (!passwort) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const query = {
            text: 'SELECT * FROM u_userverwaltung WHERE LOWER(u_email) = LOWER($1)',
            values: [email.toLowerCase()],
        };

        const result = await client.query(query);
        console.log('Database Query Result:', result.rows);

        if (result.rows.length === 1) {
            const user = result.rows[0];

            if (!user.verified) {
                return res.status(401).json({ error: 'Please verify your email address before logging in' });
            }

            if (bcrypt.compareSync(passwort, user.u_passwort)) {
                req.session.user = { id: user.u_id, email: user.u_email };
                res.redirect('/doctorsearch');
            } else {
                res.status(401).json({ error: 'Invalid email or password' });
            }
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: error.message });
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

// Route to get patient data
app.get('/api/patient/:id', async (req, res) => {
    const patientId = req.params.id;
    try {
        const query = {
            text: 'SELECT p_vorname, p_nachname, p_geburtsdatum, p_geschlecht FROM p_patient WHERE p_id = $1',
            values: [patientId],
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

// Start server
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
