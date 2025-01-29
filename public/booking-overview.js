// Funktion zur Umwandlung der Termintyp-ID in den Namen
function getTermintypName(termintypId) {
    switch (termintypId) {
        case '1':
        case 'Hörtest und Beratung':
            return 'Hörtest und Beratung';
        case '2':
        case 'Beratung Gehörschutz':
            return 'Beratung Gehörschutz';
        case '3':
        case 'Routineuntersuchung':
            return 'Routineuntersuchung';
        default:
            return 'Unbekannter Typ';
    }
}

// Funktion zum Laden der Termine
async function loadAppointments() {
    try {
        const response = await fetch('/termine');
        const appointments = await response.json();

        const pastContainer = document.getElementById('past-appointments');
        const upcomingContainer = document.getElementById('upcoming-appointments');

        pastContainer.innerHTML = '';
        upcomingContainer.innerHTML = '';

        const today = new Date();

        // Sortiere Termine: Zukünftige Termine aufsteigend, Vergangene Termine absteigend
        const pastAppointments = appointments
            .filter(appointment => new Date(appointment.t_datum) < today)
            .sort((a, b) => new Date(b.t_datum) - new Date(a.t_datum)); // Absteigend
        const upcomingAppointments = appointments
            .filter(appointment => new Date(appointment.t_datum) >= today)
            .sort((a, b) => new Date(a.t_datum) - new Date(b.t_datum)); // Aufsteigend

        // Render Vergangene Termine
        pastAppointments.forEach(appointment => {
            const appointmentDate = formatDate(appointment.t_datum);
            const appointmentTime = formatTime(appointment.t_uhrzeit);

            const div = document.createElement('div');
            div.className = 'appointment border p-2 mb-2';
            div.innerHTML = `
                <p><strong>Datum:</strong> ${appointmentDate}</p>
                <p><strong>Uhrzeit:</strong> ${appointmentTime}</p>
                <p><strong>Typ:</strong> ${getTermintypName(appointment.t_termintyp)}</p>
            `;
            pastContainer.appendChild(div);
        });

        // Render Offene Termine
        upcomingAppointments.forEach(appointment => {
            const appointmentDate = formatDate(appointment.t_datum);
            const appointmentTime = formatTime(appointment.t_uhrzeit);

            const div = document.createElement('div');
            div.className = 'appointment border p-2 mb-2';
            div.innerHTML = `
                <p><strong>Datum:</strong> ${appointmentDate}</p>
                <p><strong>Uhrzeit:</strong> ${appointmentTime}</p>
                <p><strong>Typ:</strong> ${getTermintypName(appointment.t_termintyp)}</p>
                <button class="btn btn-danger btn-sm" onclick="cancelAppointment(${appointment.t_id})">Stornieren</button>
                <button class="btn btn-primary btn-sm" onclick="openEditModal(${appointment.t_id}, '${appointment.t_termintyp}')">Bearbeiten</button>
            `;
            upcomingContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Termine:', error);
    }
}

// Funktion zum Bearbeiten des Termins
async function editAppointment() {
    const modal = document.getElementById('edit-modal');
    const id = modal.dataset.id;
    const newTermintyp = document.getElementById('edit-termintyp-input').value;

    // Wenn der neue Termintyp ein Textwert ist, konvertiere ihn in eine ID
    let termintypId;
    switch (newTermintyp) {
        case 'Hörtest und Beratung':
            termintypId = '1';
            break;
        case 'Beratung Gehörschutz':
            termintypId = '2';
            break;
        case 'Routineuntersuchung':
            termintypId = '3';
            break;
        default:
            termintypId = newTermintyp; // Falls es sich bereits um eine ID handelt
    }

    try {
        await fetch(`/termine/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ t_termintyp: termintypId }), // Nur den neuen Termintyp senden
        });
        showAlert('Termin wurde erfolgreich bearbeitet.', 'success');
        modal.style.display = 'none';
        loadAppointments();
    } catch (error) {
        showAlert('Fehler beim Bearbeiten des Termins.', 'danger');
        console.error('Fehler beim Bearbeiten des Termins:', error);
    }
}

// Funktion zum Formatieren von Datum im Format DD.MM.YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Monate sind 0-basiert
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Funktion zum Formatieren von Zeit im Format HH:MM
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':'); // Sekundenteile ignorieren
    return `${hours}:${minutes}`;
}


async function cancelAppointment(id) {
    try {
        await fetch(`/termine/${id}`, { method: 'DELETE' });
        showAlert('Termin wurde erfolgreich storniert.', 'success');
        loadAppointments();
    } catch (error) {
        showAlert('Fehler beim Stornieren des Termins.', 'danger');
        console.error('Fehler beim Stornieren des Termins:', error);
    }
}
async function openEditModal(id, currentTermintyp) {
    const modal = document.getElementById('edit-modal');
    const termintypInput = document.getElementById('edit-termintyp-input');

    // Lade die verfügbaren Termintypen
    try {
        const response = await fetch('/termintypen');
        const text = await response.text();  // Antwort als Text lesen
        console.log(text);  // Überprüfe den Inhalt der Antwort
        const termintypen = JSON.parse(text);  // Wenn es gültiges JSON ist, konvertiere es

        // Fülle die Auswahl mit den verfügbaren Termintypen
        termintypInput.innerHTML = '';
        termintypen.forEach(termintyp => {
            const option = document.createElement('option');
            option.value = termintyp.tt_id;
            option.textContent = termintyp.tt_bezeichnung; // Angenommen, das Feld "name" enthält die Bezeichnung
            if (termintyp.tt_id === currentTermintyp) option.selected = true;
            termintypInput.appendChild(option);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Termintypen:', error);
    }

    modal.dataset.id = id; // Speichere die ID im Modal
    modal.style.display = 'block'; // Zeige Modal an
}

async function editAppointment() {
    const modal = document.getElementById('edit-modal');
    const id = modal.dataset.id;
    const newTermintyp = document.getElementById('edit-termintyp-input').value;

    try {
        await fetch(`/termine/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ t_termintyp: newTermintyp }), // Nur den Termintyp senden
        });
        showAlert('Termin wurde erfolgreich bearbeitet.', 'success');
        modal.style.display = 'none';
        loadAppointments();
    } catch (error) {
        showAlert('Fehler beim Bearbeiten des Termins.', 'danger');
        console.error('Fehler beim Bearbeiten des Termins:', error);
    }
}


// Zeigt eine Benachrichtigung auf der Seite an
function showAlert(message, type) {
    const alertBox = document.getElementById('alert-box');
    alertBox.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    setTimeout(() => {
        alertBox.innerHTML = '';
    }, 3000);
}


// Schließe das Bearbeitungsmodal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadAppointments);