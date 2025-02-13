console.log('🎉 Booking-Skript erfolgreich geladen.');

const API_URL = 'http://localhost:3000'; 
let selectedSlotId = null;
let selectedTermintyp = null;
let selectedMonth = null;
let selectedDay = null;

// Termintyp auswählen
function selectTermintyp(termintyp, buttonElement) {
    selectedTermintyp = termintyp;
    console.log(`✅ Termintyp ausgewählt: ${termintyp}`);

    document.querySelectorAll('.termintyp-button').forEach(button => {
        button.classList.remove('active-termintyp');
    });

    buttonElement.classList.add('active-termintyp');
    loadAvailableSlots();
}

// Verfügbare Slots laden mit Filtern für Monat & Wochentag
async function loadAvailableSlots() {
    console.log('🔄 Lade verfügbare Termine...');

    try {
        let url = `${API_URL}/slots?`;
        if (selectedMonth) url += `month=${selectedMonth}&`;
        if (selectedDay) url += `day=${selectedDay}&`;

        const [slotsResponse, bookedResponse] = await Promise.all([
            fetch(url, { credentials: 'include' }),
            fetch(`${API_URL}/termine`, { credentials: 'include' })
        ]);

        const slots = await slotsResponse.json();
        const bookedAppointments = await bookedResponse.json();

        const bookedSlots = new Set(bookedAppointments.map(a => a.z_zeitslots_z_id));
        const container = document.getElementById('termine-container');
        
        container.innerHTML = slots.length === 0 
            ? `<p class="text-center text-danger">Keine Termine gefunden.</p>` 
            : generateCarouselSlots(slots, bookedSlots);

    } catch (err) {
        console.error('❌ Fehler beim Laden:', err);
        showErrorMessage('Fehler beim Laden der Termine');
    }
}

// Karussell-Slides generieren
function generateCarouselSlots(slots, bookedSlots) {
    return slots.reduce((slides, slot, index) => {
        if (index % 6 === 0) {
            slides += `<div class="carousel-item ${index === 0 ? 'active' : ''}"><div class="row">`;
        }

        const isBooked = bookedSlots.has(slot.z_id);
        slides += `
    <div class="col-md-4 mb-3">
        <div class="termin p-3 rounded">
            <div class="termin-details">
                <p class="date mb-1"><strong>${new Date(slot.z_datum).toLocaleDateString('de-DE')}</strong></p>
                <p class="time mb-2">${slot.z_startzeit.substring(0, 5)} Uhr</p>
            </div>
            <button class="btn btn-primary btn-sm" 
                    onclick="selectSlot(${slot.z_id}, '${slot.z_datum}', '${slot.z_startzeit}')"
                    data-zid="${slot.z_id}">
                 📅 Termin wählen
            </button>
        </div>
    </div>`;

        if ((index + 1) % 6 === 0 || index === slots.length - 1) {
            slides += `</div></div>`;
        }
        return slides;
    }, '');
}

// Slot auswählen
function selectSlot(slotId, slotDatum, slotZeit) {
    if (!selectedTermintyp) {
        showErrorMessage('❗ Bitte zuerst einen Termintyp auswählen');
        return;
    }

    selectedSlotId = slotId;

    // Datum und Uhrzeit anzeigen
    document.getElementById('selected-datum').textContent = new Date(slotDatum).toLocaleDateString('de-DE');
    document.getElementById('selected-uhrzeit').textContent = slotZeit.substring(0, 5) + ' Uhr'; // Formatierung der Uhrzeit
    document.getElementById('selected-termintyp').textContent = selectedTermintyp;

    // Formular anzeigen
    document.getElementById('create-termin-form').style.display = 'block';
}

// Termin buchen
async function bookAppointment() {
    if (!selectedSlotId || !selectedTermintyp) return;

    try {
        const response = await fetch(`${API_URL}/termine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                z_id: selectedSlotId,
                t_termintyp: selectedTermintyp
            }),
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Buchung fehlgeschlagen');
        
        showSuccessMessage();
        await loadAvailableSlots();
        resetForm();

    } catch (err) {
        console.error('❌ Buchungsfehler:', err);
        showBookingError(err.message);
    }
}

// Erfolgsmeldung anzeigen
function showSuccessMessage() {
    const successElement = document.getElementById('success-message');
    successElement.style.display = 'block';
    successElement.innerHTML = `
        <div class="alert alert-success">
            <h4>✅ Termin erfolgreich gebucht!</h4>
            <p>Datum: ${document.getElementById('selected-datum').textContent}</p>
            <p>Uhrzeit: ${document.getElementById('selected-uhrzeit').textContent}</p>
            <p>Art: ${selectedTermintyp}</p>
            <button onclick="closeSuccessMessage()" class="btn btn-secondary btn-sm">Schließen</button>
        </div>
    `;
}

function closeSuccessMessage() {
    document.getElementById('success-message').style.display = 'none';
}

function resetForm() {
    document.getElementById('create-termin-form').style.display = 'none';
    selectedSlotId = null;
    selectedTermintyp = null;
}

// Event Listener für Filter
document.getElementById('month-filter').addEventListener('change', e => {
    selectedMonth = parseInt(e.target.value) || null;
    loadAvailableSlots();
});

document.getElementById('day-filter').addEventListener('change', e => {
    const dayMapping = { 13: 2, 14: 3, 15: 4 };
    selectedDay = dayMapping[e.target.value] || null;
    loadAvailableSlots();
});

document.getElementById('create-termin-form').addEventListener('submit', async e => {
    e.preventDefault();
    await bookAppointment();
});

function showErrorMessage(message) {
    console.log("⚠️ Fehlernachricht wird angezeigt:", message); // Debugging

    const errorBox = document.getElementById('error-message');

    if (!errorBox) {
        console.error("❌ Fehler: Das Element mit der ID 'error-message' wurde nicht gefunden!");
        return;
    }

    errorBox.textContent = message;
    errorBox.style.display = 'block';

    setTimeout(() => {
        errorBox.style.display = 'none';
    }, 3000);
}


// Initialisierung
function initBooking() {
    console.log('🚀 Booking-System initialisiert');
    loadAvailableSlots();
}

initBooking();
