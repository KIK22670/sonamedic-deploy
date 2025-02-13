// Funktion zur Umwandlung der Termintyp-ID in den Namen
function getTermintypName(termintypId) {
    const termintypMap = {
        1: 'Hörtest und Beratung',
        2: 'Beratung Gehörschutz',
        3: 'Routineuntersuchung'
    };
    return termintypMap[termintypId] || 'Unbekannter Typ';
}

// Funktion zum Laden der Termine
async function loadAppointments() {
    try {
        const response = await fetch('/termine');
        
        if (!response.ok) {
            throw new Error(`❌ Fehler beim Abrufen: ${response.status} ${response.statusText}`);
        }

        const appointments = await response.json();
        console.log("📋 Empfangene Termine im Frontend:", appointments);

        const pastContainer = document.getElementById('past-appointments');
        const upcomingContainer = document.getElementById('upcoming-appointments');

        // Falls die Container nicht existieren, Fehler anzeigen
        if (!pastContainer || !upcomingContainer) {
            console.error("❌ Fehler: Termin-Container nicht gefunden!");
            return;
        }

        // Container leeren
        pastContainer.innerHTML = '';
        upcomingContainer.innerHTML = '';

        const today = new Date();

        if (appointments.length === 0) {
            console.warn("⚠️ Keine Termine vorhanden!");
            pastContainer.innerHTML = `<p class="text-muted text-center">Keine vergangenen Termine.</p>`;
            upcomingContainer.innerHTML = `<p class="text-muted text-center">Keine offenen Termine.</p>`;
            return;
        }

        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.z_datum);
            const appointmentTime = appointment.z_startzeit ? appointment.z_startzeit.substring(0, 5) : "⚠️ Zeit fehlt";
            const termintyp = getTermintypName(appointment.tt_termintyp_tt_id);

            console.log(`📅 Termin: ${appointmentDate.toLocaleDateString('de-DE')} um ${appointmentTime}, Typ: ${termintyp}`);

            const div = document.createElement('div');
            div.className = 'appointment border p-2 mb-2';
            div.innerHTML = `
                <p><strong>📅 Datum:</strong> ${appointmentDate.toLocaleDateString('de-DE')}</p>
                <p><strong>⏰ Uhrzeit:</strong> ${appointmentTime} Uhr</p>
                <p><strong>📋 Typ:</strong> ${termintyp}</p>
                ${appointmentDate >= today ? `
                    <button class="btn btn-danger btn-sm" onclick="cancelAppointment(${appointment.t_id})">🗑 Stornieren</button>
                    <button class="btn btn-primary btn-sm" onclick="openEditModal(${appointment.t_id}, '${appointment.tt_termintyp_tt_id}')">✏ Bearbeiten</button>
                ` : ''}
            `;

            if (appointmentDate < today) {
                pastContainer.appendChild(div);
            } else {
                upcomingContainer.appendChild(div);
            }
        });

    } catch (error) {
        console.error('❌ Fehler beim Laden der Termine:', error);
    }
}

// Erstellt ein HTML-Element für einen Termin
function createAppointmentElement(appointment, isUpcoming = false) {
    const appointmentDate = formatDate(appointment.z_datum);
    const appointmentTime = formatTime(appointment.z_startzeit);
    const termintyp = getTermintypName(appointment.tt_termintyp_tt_id);

    const div = document.createElement('div');
    div.className = 'appointment border p-2 mb-2';
    div.innerHTML = `
        <p><strong>Datum:</strong> ${appointmentDate}</p>
        <p><strong>Uhrzeit:</strong> ${appointmentTime}</p>
        <p><strong>Typ:</strong> ${termintyp}</p>
        ${isUpcoming ? `
            <button class="btn btn-danger btn-sm" onclick="cancelAppointment(${appointment.t_id})">Stornieren</button>
            <button class="btn btn-primary btn-sm" onclick="openEditModal(${appointment.t_id}, '${appointment.tt_termintyp_tt_id}')">Bearbeiten</button>
        ` : ''}
    `;
    return div;
}

// Funktion zum Stornieren eines Termins
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

// Öffnet das Bearbeitungsmodal
async function openEditModal(id, currentTermintypId) {
    const modal = document.getElementById('edit-modal');
    const termintypInput = document.getElementById('edit-termintyp-input');

    try {
        const response = await fetch('/termintypen');
        const termintypen = await response.json();

        termintypInput.innerHTML = '';
        termintypen.forEach(termintyp => {
            const option = document.createElement('option');
            option.value = termintyp.tt_id;
            option.textContent = termintyp.tt_bezeichnung;
            if (termintyp.tt_id == currentTermintypId) option.selected = true;
            termintypInput.appendChild(option);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Termintypen:', error);
    }

    modal.dataset.id = id;
    modal.style.display = 'block';
}

async function editAppointment() {
    const modal = document.getElementById('edit-modal');
    const id = modal.dataset.id;
    const newTermintyp = document.getElementById('edit-termintyp-input').value;

    try {
        const response = await fetch(`/termine/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tt_termintyp_tt_id: newTermintyp })
        });

        const updatedAppointment = await response.json();
        console.log(`🔄 Aktualisierter Termin:`, updatedAppointment);

        if (response.ok) {
            showAlert('✅ Termin wurde erfolgreich bearbeitet.', 'success');
            modal.style.display = 'none';
            await loadAppointments();  // 🚀 Nach Update sofort Terminübersicht neuladen
        } else {
            showAlert('❌ Fehler beim Bearbeiten des Termins.', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Bearbeiten des Termins:', error);
        showAlert('Fehler beim Bearbeiten des Termins.', 'danger');
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
    document.getElementById('edit-modal').style.display = 'none';
}

// Datum formatieren (DD.MM.YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
}

// Zeit formatieren (HH:MM)
function formatTime(timeString) {
    return timeString.substring(0, 5);
}

document.addEventListener('DOMContentLoaded', loadAppointments);
