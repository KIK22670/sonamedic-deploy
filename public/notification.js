document.addEventListener('DOMContentLoaded', function () {
    const notificationBadge = document.getElementById('notificationBadge');
    const userId = document.body.getAttribute('data-user-id'); // Benutzer-ID vom Backend übergeben
    console.log('User ID:', userId); // Logge die Benutzer-ID

    // Funktion zur Überprüfung der Benachrichtigungen
    function checkNotifications() {
        console.log('Starte Überprüfung der Benachrichtigungen...');
        Promise.all([
            fetch(`/api/check-speech-in-noise-test?userId=${userId}`).then(res => res.json()),
            fetch(`/api/check-speech-in-noise-test2?userId=${userId}`).then(res => res.json()),
            fetch(`/api/check-seven-days-no-test?userId=${userId}`).then(res => res.json())
        ]).then(results => {
            console.log('Ergebnisse der Benachrichtigungsabfragen:', results); // Logge die Ergebnisse der API-Abfragen
            const activeNotifications = results.filter(result => result.alert);
            console.log('Aktive Benachrichtigungen (mit Alert):', activeNotifications); // Logge nur die Benachrichtigungen mit Alert
            const notificationCount = activeNotifications.length;

            // Setzen der Badge-Anzeige
            if (notificationCount > 0) {
                notificationBadge.textContent = notificationCount;
                notificationBadge.style.display = 'inline';
            } else {
                notificationBadge.style.display = 'none';
            }
        }).catch(error => {
            console.error('Fehler beim Überprüfen der Benachrichtigungen:', error);
        });
    }

     // Beobachter, um Benachrichtigungen automatisch zu erkennen und die Anzeige zu aktualisieren
     const notificationsList = document.getElementById('notificationsList');
     const observer = new MutationObserver(() => {
         checkNotifications();
     });
 
     observer.observe(notificationsList, { childList: true });

   
    // Erste Prüfung beim Laden der Seite
    checkNotifications();
});
