const express = require('express');
const path = require('path');
const client = require('./connection.js');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const { sequelize, DataTypes } = require('sequelize');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt'); // Add this line
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

sgMail.setApiKey(process.env.MY_API_KEY);

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Statisches Verzeichnis für CSS, Bilder usw.
app.use(express.static(path.join(__dirname, 'public')));


// Template für die Verifizierungs-E-Mail
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
                    <a href="https://localhost/${verificationToken}">Verify Email</a>
                </div>
            </div>
        </div>
    </div>
</body>

</html>


`;

// Route für die Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Route für die Login-Seite
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route für die Registrierungs-Seite
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});

app.get('/email-verification', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'emailverification.html'));
});

app.get('/resetpasswordverification', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resetpasswordverification.html'));
});

// Registrierung
app.post('/registration', async (req, res) => {
    const { emailregister, passwortregister } = req.body;

    try {
        // Check if the email is already registered
        const checkEmailQuery = {
            text: 'SELECT * FROM u_userverwaltung WHERE u_email = $1',
            values: [emailregister],
        };

        const emailCheckResult = await client.query(checkEmailQuery);

        if (emailCheckResult.rows.length > 0) {
            // Email is already registered
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if the password meets requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(passwortregister)) {
            // Password does not meet requirements
            return res.status(400).json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long' });
        }

        const verificationToken = crypto.randomBytes(20).toString('hex');

        // If email is not registered and password meets requirements, proceed with registration
        const hashedPassword = await bcrypt.hash(passwortregister, 10);

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
            html: emailVerificationTemplate(verificationToken)
        };
        await sgMail.send(msg);

        res.redirect('/email-verification');

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});



app.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Find user by verification token
        const findUserQuery = {
            text: 'SELECT * FROM u_userverwaltung WHERE verification_token = $1',
            values: [token],
        };

        const { rows } = await client.query(findUserQuery);

        if (rows.length === 0) {
            // No user found with the provided token
            return res.status(404).send('Invalid verification token.');
        }

        const user = rows[0];

        // Update user as verified
        const updateUserQuery = {
            text: 'UPDATE u_userverwaltung SET verified = true WHERE u_id = $1',
            values: [user.u_id], // Achten Sie darauf, das entsprechende Feld für den Primärschlüssel zu verwenden
        };


        await client.query(updateUserQuery);

        res.redirect('/login'); // Redirect user to login page after successful verification
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


app.post('/login', async (req, res) => {
    try {
        const { email, passwort } = req.body;

        // Log Request Body
        console.log('Request Body:', req.body);

        // Check if password is provided
        if (!passwort) {
            console.log('Password is required');
            return res.status(400).json({ error: 'Password is required' });
        }

        // Database Query
        const query = {
            text: 'SELECT * FROM u_userverwaltung WHERE LOWER(u_email) = LOWER($1)',
            values: [email.toLowerCase()],
        };

        const result = await client.query(query);

        // Log Database Query Result
        console.log('Database Query Result:', result.rows);

        if (result.rows.length === 1) {
            console.log('User found in the database');
            const user = result.rows[0];

            if (!user.verified) {
                console.log('User email not verified');
                return res.status(401).json({ error: 'Please verify your email address before logging in' });
            }

            if (user.u_passwort) {
                console.log('User has a hashed password');

                // Check if hashed password is defined
                if (bcrypt.compareSync(passwort, user.u_passwort)) {
                    console.log('Password comparison successful');
                    req.session.user = { id: user.u_id, email: user.u_email };
                    res.redirect('/doctorsearch');
                } else {
                    console.log('Incorrect email or password');
                    res.status(401).json({ error: 'Invalid email or password' });
                }
            } else {
                console.log('User does not have a hashed password');
                res.status(401).json({ error: 'Invalid email or password' });
            }
        } else {
            console.log('No user found with the provided email');
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            // Redirect to the home page after logout
            res.redirect('/home.html'); // Ändere dies zu der URL deiner Home-Seite
        }
    });
});


// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
