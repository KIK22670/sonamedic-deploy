// Variablen zum Speichern der Auswahl
let selectedGender = "";
let selectedAge = "";

// Funktion zum Starten des Tests
function startTest() {
    console.log("Test gestartet");
    document.getElementById("test-start").classList.add("hidden");
    document.getElementById("personal-info").classList.remove("hidden");
}

function selectGender(gender) {
    selectedGender = gender;
    console.log("Ausgewähltes Geschlecht:", selectedGender);
    document.getElementById("age-selection").classList.remove("hidden");
}

function selectAge(age) {
    selectedAge = age;
    console.log("Ausgewähltes Alter:", selectedAge);
    
    document.getElementById("personal-info").classList.add("hidden");
    document.getElementById("volume-check").classList.remove("hidden");
}

function playAudio() {
    const audio = document.getElementById("test-audio");
    const playButton = document.getElementById("play-button");

    if (audio.paused) {
        audio.play();
        playButton.textContent = "⏸️ Pause";
    } else {
        audio.pause();
        playButton.textContent = "▶️ Play";
    }
}

function finishVolumeTest() {
    alert("Der Lautstärketest wurde abgeschlossen.");
    
    document.getElementById("volume-check").classList.add("hidden");
    showSummary();
}

function showSummary() {
    const summaryText = `Geschlecht: ${selectedGender}<br>Alter: ${selectedAge}<br>Lautstärketest abgeschlossen.`;
    document.getElementById("summaryText").innerHTML = summaryText;
    document.getElementById("summary").classList.remove("hidden");
}

function restartTest() {
    selectedGender = "";
    selectedAge = "";
    
    document.getElementById("summary").classList.add("hidden");
    document.getElementById("test-start").classList.remove("hidden");
}
