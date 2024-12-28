console.log('Booking-Skript erfolgreich geladen.');

const API_URL = 'http://localhost:3000'; // Lokaler Server auf Port 3000
let selectedDatum = null;
let selectedUhrzeit = null;
let selectedTermintyp = null;

// Funktion: Termintyp auswählen
function selectTermintyp(termintyp) {
    selectedTermintyp = termintyp; // Speichert den ausgewählten Termintyp
    console.log(`Termintyp ausgewählt: ${termintyp}`);
    loadAvailableSlots(); // Lade verfügbare Zeitfenster
}

// Funktion: Verfügbare Zeitfenster laden
async function loadAvailableSlots() {
    try {
        const response = await fetch(`${API_URL}/slots`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Fehler beim Laden der verfügbaren Zeitfenster.');

        const slots = await response.json();
        console.log('Verfügbare Zeitfenster:', slots);

        const container = document.getElementById('termine-container');
        container.innerHTML = ''; // Alte Inhalte löschen

        const slotsPerPage = 6;
        const pages = Math.ceil(slots.length / slotsPerPage);

        for (let i = 0; i < pages; i++) {
            const div = document.createElement('div');
            div.className = `carousel-item ${i === 0 ? 'active' : ''}`;
            const pageSlots = slots.slice(i * slotsPerPage, (i + 1) * slotsPerPage);

            const innerDiv = document.createElement('div');
            innerDiv.className = 'd-flex flex-wrap justify-content-center';

            pageSlots.forEach((slot) => {
                const slotDiv = document.createElement('div');
                slotDiv.className = 'termin m-2 p-2 border rounded';
                slotDiv.style.backgroundColor = '#e6dbc8';

                const dayText = document.createElement('p');
                dayText.textContent = slot.day;
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
    console.log(`Ausgewähltes Zeitfenster: Datum=${t_datum}, Uhrzeit=${t_uhrzeit}`);

    selectedDatum = t_datum;
    selectedUhrzeit = t_uhrzeit;

    document.getElementById('selected-datum').textContent = selectedDatum;
    document.getElementById('selected-uhrzeit').textContent = selectedUhrzeit;
    document.getElementById('selected-termintyp').textContent = selectedTermintyp;

    document.getElementById('create-termin-form').style.display = 'block';
}

// Funktion: Termin buchen
async function bookAppointment() {
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
            document.getElementById('success-message').style.display = 'block';
            resetForm();
            loadAvailableSlots();
        } else {
            alert('Fehler beim Buchen des Termins.');
        }
    } catch (err) {
        console.error('Fehler beim Buchen des Termins:', err);
    }
}

// Funktion: Formular zurücksetzen
function resetForm() {
    document.getElementById('create-termin-form').style.display = 'none';
    selectedDatum = null;
    selectedUhrzeit = null;
    selectedTermintyp = null;
}

document.getElementById('create-termin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    bookAppointment();
});

function initBooking() {
    console.log('Booking-Initialisierung...');
    loadAvailableSlots();
}

initBooking();
