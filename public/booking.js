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
        const response = await fetch(`${API_URL}/slots`);
        let slots = await response.json();

        // Filter für Monat und Wochentag anwenden
        slots = slots.filter(slot => {
            const slotDate = new Date(slot.t_datum);
            const matchesMonth = selectedMonth ? slotDate.getMonth() + 1 === selectedMonth : true;
            const matchesDay = selectedDay !== null ? slotDate.getDay() === selectedDay : true;
            return matchesMonth && matchesDay;
        });

        const container = document.getElementById('termine-container');
        container.innerHTML = ''; // Alte Inhalte löschen

        if (slots.length === 0) {
            container.innerHTML = `<p class="text-center text-danger">Keine Termine gefunden. Bitte passen Sie Ihre Filter an.</p>`;
            return;
        }

        const slotsPerPage = 6;
        const pages = Math.ceil(slots.length / slotsPerPage);

        for (let i = 0; i < pages; i++) {
            const div = document.createElement('div');
            div.className = `carousel-item ${i === 0 ? 'active' : ''}`;
            const pageSlots = slots.slice(i * slotsPerPage, (i + 1) * slotsPerPage);

            const innerDiv = document.createElement('div');
            innerDiv.className = 'd-flex flex-wrap justify-content-center';

            pageSlots.forEach(slot => {
                const slotDiv = document.createElement('div');
                slotDiv.className = 'termin m-2 p-2 border rounded';
                slotDiv.style.backgroundColor = '#e6dbc8';

                const dayText = document.createElement('p');
                dayText.textContent = new Date(slot.t_datum).toLocaleDateString('de-DE', { weekday: 'long' });
                slotDiv.appendChild(dayText);

                const timeText = document.createElement('p');
                timeText.textContent = `${slot.t_datum} um ${slot.t_uhrzeit}`;
                slotDiv.appendChild(timeText);

                const button = document.createElement('button');
                button.className = 'btn btn-custom';
                button.textContent = 'Termin wählen';
                button.addEventListener('click', () => selectSlot(slot.t_datum, slot.t_uhrzeit));
                slotDiv.appendChild(button);

                innerDiv.appendChild(slotDiv);
            });

            div.appendChild(innerDiv);
            container.appendChild(div);
        }
    } catch (err) {
        console.error('Fehler beim Laden der Zeitfenster:', err);
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

// Funktion: Termin buchen
async function bookAppointment() {
    if (!selectedTermintyp) {
        showErrorMessage('Bitte wählen Sie zuerst einen Termintyp aus.');
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

        if (response.ok) {
            console.log('Termin erfolgreich gebucht.');
            const successMessage = document.getElementById('success-message');
            successMessage.style.display = 'block';
            successMessage.innerHTML = `
                <p>Termin erfolgreich gebucht!</p>
                <p>Ihr Termin ist am <strong>${selectedDatum}</strong> um <strong>${selectedUhrzeit}</strong>.</p>
                <p>Liebe Grüße, Dr. Edlinger</p>
                <button class="btn btn-secondary" onclick="closeSuccessMessage()">Schließen</button>
            `;
            resetForm();
            loadAvailableSlots();
        } else {
            showErrorMessage('Fehler beim Buchen des Termins.');
        }
    } catch (err) {
        console.error('Fehler beim Buchen des Termins:', err);
    }
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
