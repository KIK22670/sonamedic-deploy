document.addEventListener('DOMContentLoaded', function() {
    const volumeControl = document.getElementById("volumeControl");
    const audioPlayer = document.getElementById("audioPlayer");
    const playBtn = document.getElementById("playBtn");
    const startTestBtn = document.getElementById("startTestBtn");
    const startTestProcessBtn = document.getElementById("startTestProcessBtn");

    // Setze das Audio zu 100% Lautstärke (maximal) zu Beginn
    audioPlayer.volume = 1;

    // Lautstärkeregler EventListener: Wenn der Schieberegler bewegt wird, wird die Lautstärke des Audio-Players angepasst
    volumeControl.addEventListener("input", function() {
        audioPlayer.volume = volumeControl.value;  // Lautstärke des Audio-Players anpassen
    });

    // Play Button: Audio abspielen, wenn der Button geklickt wird
    playBtn.addEventListener("click", function() {
        audioPlayer.play().then(() => {
            console.log("Audio wird abgespielt.");
            startTestBtn.disabled = false; // Aktiviert den "OK"-Button, wenn das Audio abgespielt wird
        }).catch((error) => {
            console.error("Fehler beim Abspielen des Audios:", error);
        });
    });

    // Stoppen des Audios, wenn der "OK"-Button geklickt wird
    startTestBtn.addEventListener("click", function() {
        audioPlayer.pause();  // Stoppt das Audio
        audioPlayer.currentTime = 0;  // Setzt die Wiedergabeposition auf Anfang
        console.log("Audio gestoppt.");
    });

    // Sobald das Audio zu Ende ist, den Button aktivieren
    audioPlayer.addEventListener("ended", function() {
        startTestBtn.disabled = false;
    });

    // Neuer Button "Test starten"
    startTestProcessBtn.addEventListener("click", function() {
        alert("Der Test beginnt jetzt!");
        // Weitere Logik zum Starten des Tests
        audioPlayer.play(); // Das Audio könnte hier auch wieder gestartet werden, falls es pausiert wurde
    });

});
