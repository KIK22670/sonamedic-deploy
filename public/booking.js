console.log('Booking-Skript erfolgreich geladen.');

const API_URL = 'http://localhost:3000'; // Lokaler Server auf Port 3000
let selectedDatum = null;
let selectedUhrzeit = null;
let selectedTermintyp = null;
let selectedMonth = null; // Gewählter Monat
let selectedDay = null; // Gewählter Wochentag (0 = Sonntag, 1 = Montag, ...)

// Funktion: Termintyp auswählen
function selectTermintyp(termintyp, buttonElement) {
    selectedTermintyp = termintyp; // Speichert den ausgewählten Termintyp
    console.log(`Termintyp ausgewählt: ${termintyp}`);

    // Entferne aktive Klasse von allen Buttons
    document.querySelectorAll('.termintyp-button').forEach(button => {
        button.classList.remove('active-termintyp');
    });

    // Füge aktive Klasse zum angeklickten Button hinzu
    buttonElement.classList.add('active-termintyp');

    loadAvailableSlots(); // Lade verfügbare Zeitfenster
}

// Funktion: Verfügbare Zeitfenster laden
async function loadAvailableSlots() {
    try {
        const response = await fetch(`${API_URL}/slots`, { credentials: 'include' });
        let slots = await response.json();

        // Filter für Monat und Wochentag anwenden
        slots = slots.filter(slot => {
            const slotDate = new Date(slot.t_datum);
            const matchesMonth = selectedMonth ? slotDate.getMonth() + 1 === selectedMonth : true;
            const matchesDay = selectedDay !== null ? slotDate.getDay() === selectedDay : true;
            return matchesMonth && matchesDay;
        });

        const bookedResponse = await fetch(`${API_URL}/termine`, { credentials: 'include' });
        const bookedAppointments = await bookedResponse.json();

        console.log("📌 API Antwort für eigene gebuchte Termine:", bookedAppointments);

        // Set mit bereits gebuchten Terminen erstellen
        const bookedSlots = new Set(bookedAppointments.map(slot => `${slot.t_datum} ${slot.t_uhrzeit}`));

        const container = document.getElementById('termine-container');
        container.innerHTML = '';

        if (slots.length === 0) {
            container.innerHTML = `<p class="text-center text-danger">Keine Termine gefunden.</p>`;
            return;
        }

        // Termin-Gruppen für das Karussell (jeweils 6 Termine pro Slide)
        let slides = "";
        for (let i = 0; i < slots.length; i += 6) {
            let activeClass = i === 0 ? "active" : "";
            slides += `<div class="carousel-item ${activeClass}"><div class="row">`;

            for (let j = i; j < i + 6 && j < slots.length; j++) {
                let slot = slots[j];
                let slotKey = `${slot.t_datum} ${slot.t_uhrzeit}`; // Eindeutiger Schlüssel für Termin
                let isBooked = bookedSlots.has(slotKey);

                slides += `
                    <div class="col-md-4">
                        <div class="termin" style="color: white;">
                            <p style="color: white;"><strong>${slot.t_datum}</strong></p>
                            <p style="color: white;">${slot.t_uhrzeit}</p>
                            ${isBooked ? 
                                `<p class="text-warning">Bereits gebucht</p>` : 
                                `<button class="btn btn-light" style="color: black; font-weight: bold;" onclick="selectSlot('${slot.t_datum}', '${slot.t_uhrzeit}')">Termin wählen</button>`}
                        </div>
                    </div>`;
            }

            slides += `</div></div>`;
        }

        // **Setze die innerHTML für das Karussell**
        container.innerHTML = slides;
    } catch (err) {
        console.error('❌ Fehler beim Laden der Zeitfenster:', err);
    }
}


// Funktion: Zeitfenster auswählen
function selectSlot(t_datum, t_uhrzeit) {
    if (!selectedTermintyp) {
        showErrorMessage('Bitte wählen Sie zuerst einen Termintyp aus.');
        return;
    }

    selectedDatum = t_datum;
    selectedUhrzeit = t_uhrzeit;

    document.getElementById('selected-datum').textContent = selectedDatum;
    document.getElementById('selected-uhrzeit').textContent = selectedUhrzeit;
    document.getElementById('selected-termintyp').textContent = selectedTermintyp;

    document.getElementById('create-termin-form').style.display = 'block';
}

/// Funktion Termine buchen
async function bookAppointment() {
    if (!selectedTermintyp) {
        showBookingError('Bitte wählen Sie zuerst einen Termintyp aus.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/termine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                t_datum: selectedDatum,
                t_uhrzeit: selectedUhrzeit,
                t_termintyp: selectedTermintyp,
            }),
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('Termin erfolgreich gebucht.');
            document.getElementById('success-message').style.display = 'block';
            document.getElementById('success-message').innerHTML = `
                <p>Termin erfolgreich gebucht!</p>
                <p>Ihr Termin ist am <strong>${selectedDatum}</strong> um <strong>${selectedUhrzeit}</strong>.</p>
                <p>Liebe Grüße, Dr. Edlinger</p>
                <button class="btn btn-secondary" onclick="closeSuccessMessage()">Schließen</button>
            `;

            resetForm();
            await loadAvailableSlots(); // 🔄 **Liste der freien Termine aktualisieren**
        } else {
            showBookingError(responseData.error || 'Fehler beim Buchen des Termins.');
        }
    } catch (err) {
        console.error('Fehler beim Buchen:', err);
        showBookingError('Ein unerwarteter Fehler ist aufgetreten.');
    }
}

function showBookingError(message) {
    const bookingErrorContainer = document.getElementById('booking-error-message');
    bookingErrorContainer.style.display = 'block';
    bookingErrorContainer.innerHTML = `<p class="text-danger">${message}</p>`;
}



// Funktion: Schließen der Erfolgsmeldung
function closeSuccessMessage() {
    document.getElementById('success-message').style.display = 'none';
}

// Funktion: Fehlernachricht anzeigen
function showErrorMessage(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.style.display = 'block';
    errorMessage.textContent = message;
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Funktion: Formular zurücksetzen
function resetForm() {
    document.getElementById('create-termin-form').style.display = 'none';
    selectedDatum = null;
    selectedUhrzeit = null;
    selectedTermintyp = null;
}

// Filter: Event-Listener für Monat und Tag
document.getElementById('month-filter').addEventListener('change', event => {
    selectedMonth = parseInt(event.target.value) || null;
    loadAvailableSlots();
});

document.getElementById('day-filter').addEventListener('change', event => {
    const dayMapping = { 13: 2, 14: 3, 15: 4 }; // Mapping für Dienstag, Mittwoch, Donnerstag
    selectedDay = dayMapping[event.target.value] || null;
    loadAvailableSlots();
});

document.getElementById('create-termin-form').addEventListener('submit', e => {
    e.preventDefault();
    bookAppointment();
});

function initBooking() {
    console.log('Booking-Initialisierung...');
    loadAvailableSlots();
}

initBooking();
