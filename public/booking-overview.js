async function loadAppointments() {
    try {
        const response = await fetch('/termine');
        const appointments = await response.json();

        const pastContainer = document.getElementById('past-appointments');
        const upcomingContainer = document.getElementById('upcoming-appointments');

        pastContainer.innerHTML = '';
        upcomingContainer.innerHTML = '';

        const today = new Date();

        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.t_datum);
            const container = appointmentDate < today ? pastContainer : upcomingContainer;

            const div = document.createElement('div');
            div.className = 'appointment border p-2 mb-2';
            div.innerHTML = `
                <p><strong>Datum:</strong> ${appointment.t_datum}</p>
                <p><strong>Uhrzeit:</strong> ${appointment.t_uhrzeit}</p>
                <p><strong>Typ:</strong> ${appointment.t_termintyp}</p>
                ${container === upcomingContainer ? `
                    <button class="btn btn-danger btn-sm" onclick="cancelAppointment(${appointment.t_id})">Stornieren</button>
                    <button class="btn btn-primary btn-sm" onclick="openEditModal(${appointment.t_id}, '${appointment.t_datum}', '${appointment.t_uhrzeit}')">Bearbeiten</button>
                ` : ''}
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Termine:', error);
    }
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

async function openEditModal(id, currentDate, currentTime) {
    const modal = document.getElementById('edit-modal');
    const dateInput = document.getElementById('edit-date-input');
    const timeInput = document.getElementById('edit-time-input');

    // Lade verfügbare Slots
    try {
        const response = await fetch('/slots');
        const availableSlots = await response.json();

        const availableDates = [...new Set(availableSlots.map(slot => slot.t_datum))];
        const availableTimes = availableSlots
            .filter(slot => slot.t_datum === currentDate)
            .map(slot => slot.t_uhrzeit);

        // Fülle die Datumauswahl
        dateInput.innerHTML = '';
        availableDates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            if (date === currentDate) option.selected = true;
            dateInput.appendChild(option);
        });

        // Fülle die Uhrzeitauswahl
        timeInput.innerHTML = '';
        availableTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            if (time === currentTime) option.selected = true;
            timeInput.appendChild(option);
        });
    } catch (error) {
        console.error('Fehler beim Laden der verfügbaren Slots:', error);
    }

    modal.dataset.id = id; // Speichere die ID im Modal
    modal.style.display = 'block'; // Zeige Modal an
}

async function editAppointment() {
    const modal = document.getElementById('edit-modal');
    const id = modal.dataset.id;
    const newDate = document.getElementById('edit-date-input').value;
    const newTime = document.getElementById('edit-time-input').value;

    try {
        await fetch(`/termine/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ t_datum: newDate, t_uhrzeit: newTime }),
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
