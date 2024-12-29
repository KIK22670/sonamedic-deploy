document.addEventListener('DOMContentLoaded', function () {
    const volumeControl = document.getElementById("volumeControl");
    const audioPlayer = document.getElementById("audioPlayer");
    const playBtn = document.getElementById("playBtn");
    const startTestBtn = document.getElementById("startTestBtn");
    const startTestProcessBtn = document.getElementById("startTestProcessBtn");
    const questionContainer = document.getElementById("questionContainer");
    const questionText = document.getElementById("questionText");
    const optionsContainer = document.getElementById("optionsContainer");

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
        console.log("Test starten Button geklickt.");
        audioPlayer.pause();
        document.querySelector(".card").style.display = "none"; // Einstiegskarte ausblenden
        questionContainer.style.display = "block"; // Fragencontainer anzeigen
        startTest();
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
        playAudio();
        showQuestion();
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

    // Audio abspielen
    function playAudio() {
        const currentAudio = selectedAudios[currentAudioIndex];
        audioPlayer.src = currentAudio.src;
        console.log("Abspielpfad:", audioPlayer.src);

        audioPlayer.play()
            .then(() => {
                console.log(`Audio für Frage ${currentAudioIndex + 1} wird abgespielt.`);
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

        // Audio stoppen, wenn eine Antwort ausgewählt wurde
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
            playAudio();
            showQuestion();
        } else {
            endTest();
        }
    }

    // Test beenden
    function endTest() {
        questionContainer.innerHTML = `
            <h2>Test abgeschlossen!</h2>
            <p>Ihr Punktestand: ${score} von ${selectedAudios.length}</p>
        `;
        console.log("Test abgeschlossen.");
    }
});

// Array of all audio files and their corresponding questions and answers
const audioData = [
    { src: "/hearingtest/SIN-Audios/SIN-1.mp3", question: "Wie viel kostet der Kuchen?", correctAnswer: "3.50 Euro", options: ["2.00 Euro", "3.50 Euro", "5.00 Euro"] },
    { src: "/hearingtest/SIN-Audios/SIN-2.mp3", question: "Von welchem Bahnsteig fährt der Zug?", correctAnswer: "Bahnsteig B", options: ["Bahnsteig A", "Bahnsteig B", "Bahnsteig C"] },
    { src: "/hearingtest/SIN-Audios/SIN-3.mp3", question: "In welcher Reihe sind unsere Sitze?", correctAnswer: "Reihe N", options: ["Reihe L", "Reihe M", "Reihe N"] },
    { src: "/hearingtest/SIN-Audios/SIN-4.mp3", question: "Wann fängt die Band an?", correctAnswer: "21 Uhr", options: ["20 Uhr", "21 Uhr", "22 Uhr"] },
    { src: "/hearingtest/SIN-Audios/SIN-5.mp3", question: "Wie viel kosten die Schuhe?", correctAnswer: "70 Euro", options: ["50 Euro", "70 Euro", "90 Euro"] },
    { src: "/hearingtest/SIN-Audios/SIN-6.mp3", question: "Wie spät ist es?", correctAnswer: "14:30 Uhr", options: ["13:30 Uhr", "14:30 Uhr", "15:30 Uhr"] },
    { src: "/hearingtest/SIN-Audios/SIN-7.mp3", question: "Wohin fährt der Bus in 5 Minuten?", correctAnswer: "Frankfurt", options: ["Berlin", "Hamburg", "Frankfurt"] },
    { src: "/hearingtest/SIN-Audios/SIN-8.mp3", question: "Wie viele Fans sind da?", correctAnswer: "30.000", options: ["20.000", "30.000", "40.000"] },
    { src: "/hearingtest/SIN-Audios/SIN-9.mp3", question: "Wie viel kostet das Hauptgericht?", correctAnswer: "12 Euro", options: ["10 Euro", "12 Euro", "15 Euro"] },
    { src: "/hearingtest/SIN-Audios/SIN-10.mp3", question: "Wie heißt der Film?", correctAnswer: "'Die Rückkehr der Jedi-Ritter'", options: ["'Star Wars'", "'Die Rückkehr der Jedi-Ritter'", "'Das Imperium schlägt zurück'"] },
    { src: "/hearingtest/SIN-Audios/SIN-11.mp3", question: "Wo ist das Buch?", correctAnswer: "In der Geschichtsecke", options: ["In der Romanecke", "In der Geschichtsecke", "In der Fantasyabteilung"] },
    { src: "/hearingtest/SIN-Audios/SIN-12.mp3", question: "Wie viele Kinder sind am Spielplatz?", correctAnswer: "Fünf", options: ["Drei", "Fünf", "Sieben"] },
    { src: "/hearingtest/SIN-Audios/SIN-13.mp3", question: "Wie viel kostet die Katze?", correctAnswer: "50 Euro", options: ["30 Euro", "50 Euro", "70 Euro"] },
    { src: "/hearingtest/SIN-Audios/SIN-14.mp3", question: "Wie viel kostet der Tisch?", correctAnswer: "120 Euro", options: ["100 Euro", "120 Euro", "140 Euro"] },
    { src: "/hearingtest/SIN-Audios/SIN-15.mp3", question: "Wie viel Kilogramm Äpfel werden gekauft?", correctAnswer: "1kg", options: ["0.5kg", "1kg", "2kg"] },
    { src: "/hearingtest/SIN-Audios/SIN-16.mp3", question: "Wie viel kostet die Mitgliedschaft?", correctAnswer: "35 Euro", options: ["25 Euro", "35 Euro", "45 Euro"] },
    { src: "/hearingtest/SIN-Audios/SIN-17.mp3", question: "Was kostet 2.50€?", correctAnswer: "Kaffee", options: ["Tee", "Kaffee", "Saft"] },
    { src: "/hearingtest/SIN-Audios/SIN-18.mp3", question: "Wer ist der Künstler?", correctAnswer: "Picasso", options: ["Da Vinci", "Picasso", "Van Gogh"] },
    { src: "/hearingtest/SIN-Audios/SIN-19.mp3", question: "Wie heißt der Plattenaufleger?", correctAnswer: "Steve", options: ["Mike", "Steve", "John"] },
    { src: "/hearingtest/SIN-Audios/SIN-20.mp3", question: "Wer spielt die Hauptrolle?", correctAnswer: "Müller", options: ["Schmidt", "Müller", "Weber"] }
];

