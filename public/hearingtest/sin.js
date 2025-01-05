document.addEventListener('DOMContentLoaded', function () {
    const volumeControl = document.getElementById("volumeControl");
    const audioPlayer = document.getElementById("audioPlayer");
    const playBtn = document.getElementById("playBtn");
    const startTestBtn = document.getElementById("startTestBtn");
    const startTestProcessBtn = document.getElementById("startTestProcessBtn");
    const questionContainer = document.getElementById("questionContainer");
    const questionText = document.getElementById("questionText");
    const optionsContainer = document.getElementById("optionsContainer");
    const audioIndicator = document.getElementById("audioIndicator");

    let selectedAudios = [];
    let currentAudioIndex = 0;
    let score = 0;

    const introAudioSrc = "/hearingtest/SIN-Audios/audio.mp3";
    let availableAudios = [...audioData]; // Kopie des ursprünglichen Fragenpools

    // Lautstärke initial einstellen
    audioPlayer.volume = 1;

    // Lautstärkeregler
    volumeControl.addEventListener("input", () => {
        audioPlayer.volume = volumeControl.value;
    });

    // Einstiegsaudio abspielen
    playBtn.addEventListener("click", () => {
        if (!audioPlayer.src || audioPlayer.src !== introAudioSrc) {
            audioPlayer.src = introAudioSrc;
        }

        console.log("Audio-Pfad vor dem Abspielen:", audioPlayer.src);

        audioPlayer.play()
            .then(() => {
                console.log("Einstiegsaudio wird abgespielt.");
                startTestBtn.disabled = false;
            })
            .catch(error => console.error("Fehler beim Abspielen des Audios:", error));
    });

    // Einstiegsaudio stoppen
    startTestBtn.addEventListener("click", () => {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        console.log("Einstiegsaudio gestoppt.");
        startTestProcessBtn.disabled = false;
    });

    // Test starten
    startTestProcessBtn.addEventListener("click", () => {
        // Überprüfen, ob der Benutzer den Test heute bereits gemacht hat
        fetch('/speech-in-noise/check-today')
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((data) => {
                        throw new Error(data.error || 'Unbekannter Fehler');
                    });
                }
                return response.json();
            })
            .then((data) => {
                if (data.alreadyTaken) {
                    // Modal anzeigen
                    const modal = new bootstrap.Modal(document.getElementById('testTakenModal'));
                    modal.show();
                } else {
                    // Wenn der Test heute noch nicht gemacht wurde, Test starten
                    console.log("Test starten Button geklickt.");
                    audioPlayer.pause();
                    document.querySelector(".card").style.display = "none"; // Einstiegskarte ausblenden
                    questionContainer.style.display = "block"; // Fragencontainer anzeigen
                    startTest();
                }
            })
            .catch((error) => {
                console.error('Fehler beim Überprüfen des Tests:', error.message);
                alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
            });
    });

    // Testlogik starten
    function startTest() {
        if (availableAudios.length < 5) {
            // Wenn weniger als 5 Fragen übrig sind, Fragenpool zurücksetzen
            console.log("Fragenpool wird zurückgesetzt.");
            availableAudios = [...audioData];
        }

        selectedAudios = selectRandomAudios(5); // Wähle 5 zufällige Fragen
        currentAudioIndex = 0;
        score = 0;

        console.log("Ausgewählte Audios:", selectedAudios); // Debugging
        playAudioAndThenShowQuestion();
    }

    // Auswahl zufälliger Audios
    function selectRandomAudios(count) {
        const selected = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * availableAudios.length);
            selected.push(availableAudios.splice(randomIndex, 1)[0]);
        }
        return selected;
    }

    // Audio abspielen und danach die Frage anzeigen
    function playAudioAndThenShowQuestion() {
        const currentAudio = selectedAudios[currentAudioIndex];
        audioPlayer.src = currentAudio.src;
        console.log("Abspielpfad:", audioPlayer.src);

        // Zeige das Symbol und das Hintergrundbild während des Audios
        audioIndicator.style.display = "block";
        document.body.style.backgroundImage = `url(${currentAudio.backgroundImage})`;
        document.body.style.backgroundRepeat = "no-repeat";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        questionText.textContent = ""; 
        optionsContainer.innerHTML = ""; // Frage und Optionen leeren

        // Audio abspielen und nach dem Ende die Frage anzeigen
        audioPlayer.play()
            .then(() => {
                console.log(`Audio für Frage ${currentAudioIndex + 1} wird abgespielt.`);
                audioPlayer.addEventListener("ended", () => {
                    console.log("Audio beendet, Frage wird angezeigt.");
                    audioIndicator.style.display = "none"; // Symbol ausblenden
                    showQuestion(); // Frage erst nach Audioende anzeigen
                }, { once: true });
            })
            .catch(error => console.error("Fehler beim Abspielen des Audios:", error));
    }

    // Antwortoptionen mischen
    function shuffleOptions(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Elemente tauschen
        }
        return array;
    }

    // Frage anzeigen
    function showQuestion() {
        const currentAudio = selectedAudios[currentAudioIndex];
        questionText.textContent = currentAudio.question;
        optionsContainer.innerHTML = "";

        // Antwortoptionen mischen
        const shuffledOptions = shuffleOptions([...currentAudio.options]);

        shuffledOptions.forEach(option => {
            const button = document.createElement("button");
            button.textContent = option;
            button.className = "option-button";
            button.addEventListener("click", () => checkAnswer(option, button));
            optionsContainer.appendChild(button);
        });
    }

    // Antwort prüfen
    function checkAnswer(selectedOption, button) {
        const currentAudio = selectedAudios[currentAudioIndex];

        // Audio stoppen, falls noch nicht beendet
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        if (selectedOption === currentAudio.correctAnswer) {
            score++;
            button.style.backgroundColor = "green"; // Richtige Antwort grün markieren
        } else {
            button.style.backgroundColor = "red"; // Falsche Antwort rot markieren

            // Richtige Antwort hervorheben
            Array.from(optionsContainer.children).forEach(btn => {
                if (btn.textContent === currentAudio.correctAnswer) {
                    btn.style.backgroundColor = "green";
                }
            });
        }

        // Zur nächsten Frage nach einer kurzen Verzögerung
        setTimeout(() => {
            nextAudio();
        }, 1000); // 1 Sekunde Verzögerung
    }

    // Nächste Frage laden
    function nextAudio() {
        currentAudioIndex++;
        if (currentAudioIndex < selectedAudios.length) {
            playAudioAndThenShowQuestion();
        } else {
            endTest();
        }
    }

    // Test beenden
   function endTest() {
    questionContainer.innerHTML = `
        <div class="result-container">
            <h2>Test abgeschlossen!</h2>
            <p>Ihr Punktestand: <span class="score">${score}</span> von <span class="total">${selectedAudios.length}</span></p>
            <button id="viewResultsBtn" class="view-results-button">Ergebnisse anzeigen</button>
        </div>
    `;
    console.log('Test abgeschlossen. Ergebnisse:', score);

    // Ergebnisse speichern
    const falscheAntworten = selectedAudios.length - score;
    saveTestResult(score, falscheAntworten);

    // Event-Listener für den Button
    document.getElementById('viewResultsBtn').addEventListener('click', () => {
        window.location.href = 'sin_ergebnisse.html';
    });
   }

function saveTestResult(richtigeAntworten, falscheAntworten) {
    console.log('Daten, die gesendet werden:', { richtigeAntworten, falscheAntworten });

    fetch('/speech-in-noise/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ richtigeAntworten, falscheAntworten }),
    })
        .then((response) => {
            if (!response.ok) {
                console.error('Fehlerstatus:', response.status);
                return response.json().then((data) => {
                    throw new Error(data.error || 'Unbekannter Fehler');
                });
            }
            return response.json();
        })
        .then((data) => {
            console.log('Erfolgreich gespeichert:', data);
        })
        .catch((error) => {
            console.error('Fehler beim Speichern der Testergebnisse:', error.message);
        });
}
});




// Array of all audio files and their corresponding questions and answers
const audioData = [
    { src: "/hearingtest/SIN-Audios/SIN-1.mp3", question: "Wie viel kostet der Kuchen?", correctAnswer: "3.50 Euro", options: ["2.00 Euro", "3.50 Euro", "5.00 Euro"], backgroundImage: "../img/backgrounds/1.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-2.mp3", question: "Von welchem Bahnsteig fährt der Zug?", correctAnswer: "Bahnsteig B", options: ["Bahnsteig A", "Bahnsteig B", "Bahnsteig C"], backgroundImage: "../img/backgrounds/2.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-3.mp3", question: "In welcher Reihe sind unsere Sitze?", correctAnswer: "Reihe N", options: ["Reihe L", "Reihe M", "Reihe N"], backgroundImage: "../img/backgrounds/3.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-4.mp3", question: "Wann fängt die Band an?", correctAnswer: "21 Uhr", options: ["20 Uhr", "21 Uhr", "22 Uhr"], backgroundImage: "../img/backgrounds/4.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-5.mp3", question: "Wie viel kosten die Schuhe?", correctAnswer: "70 Euro", options: ["50 Euro", "70 Euro", "90 Euro"], backgroundImage: "../img/backgrounds/5.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-6.mp3", question: "Wie spät ist es?", correctAnswer: "14:30 Uhr", options: ["13:30 Uhr", "14:30 Uhr", "15:30 Uhr"], backgroundImage: "../img/backgrounds/6.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-7.mp3", question: "Wohin fährt der Bus in 5 Minuten?", correctAnswer: "Frankfurt", options: ["Berlin", "Hamburg", "Frankfurt"], backgroundImage: "../img/backgrounds/7.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-8.mp3", question: "Wie viele Fans sind da?", correctAnswer: "30.000", options: ["20.000", "30.000", "40.000"], backgroundImage: "../img/backgrounds/8.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-9.mp3", question: "Wie viel kostet das Hauptgericht?", correctAnswer: "12 Euro", options: ["10 Euro", "12 Euro", "15 Euro"], backgroundImage: "../img/backgrounds/9.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-10.mp3", question: "Wie heißt der Film?", correctAnswer: "'Die Rückkehr der Jedi-Ritter'", options: ["'Star Wars'", "'Die Rückkehr der Jedi-Ritter'", "'Das Imperium schlägt zurück'"], backgroundImage: "../img/backgrounds/10.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-11.mp3", question: "Wo ist das Buch?", correctAnswer: "In der Geschichtsecke", options: ["In der Romanecke", "In der Geschichtsecke", "In der Fantasyabteilung"], backgroundImage: "../img/backgrounds/11.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-12.mp3", question: "Wie viele Kinder sind am Spielplatz?", correctAnswer: "Fünf", options: ["Drei", "Fünf", "Sieben"], backgroundImage: "../img/backgrounds/12.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-13.mp3", question: "Wie viel kostet die Katze?", correctAnswer: "50 Euro", options: ["30 Euro", "50 Euro", "70 Euro"], backgroundImage: "../img/backgrounds/13.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-14.mp3", question: "Wie viel kostet der Tisch?", correctAnswer: "120 Euro", options: ["100 Euro", "120 Euro", "140 Euro"], backgroundImage: "../img/backgrounds/14.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-15.mp3", question: "Wie viel Kilogramm Äpfel werden gekauft?", correctAnswer: "1kg", options: ["0.5kg", "1kg", "2kg"], backgroundImage: "../img/backgrounds/15.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-16.mp3", question: "Wie viel kostet die Mitgliedschaft?", correctAnswer: "35 Euro", options: ["25 Euro", "35 Euro", "45 Euro"], backgroundImage: "../img/backgrounds/16.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-17.mp3", question: "Was kostet 2.50€?", correctAnswer: "Kaffee", options: ["Tee", "Kaffee", "Saft"], backgroundImage: "../img/backgrounds/17.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-18.mp3", question: "Wer ist der Künstler?", correctAnswer: "Picasso", options: ["Da Vinci", "Picasso", "Van Gogh"], backgroundImage: "../img/backgrounds/18.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-19.mp3", question: "Wie heißt der Plattenaufleger?", correctAnswer: "Steve", options: ["Mike", "Steve", "John"], backgroundImage: "../img/backgrounds/19.jpg" },
    { src: "/hearingtest/SIN-Audios/SIN-20.mp3", question: "Wer spielt die Hauptrolle?", correctAnswer: "Müller", options: ["Schmidt", "Müller", "Weber"], backgroundImage: "../img/backgrounds/20.jpg" },
];
