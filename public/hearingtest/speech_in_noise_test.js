document.addEventListener("DOMContentLoaded", function() {
    const patientId = 4; // ID des angemeldeten Patienten hier anpassen
    let audioContext;
    let audioBuffer;
    let sourceNode;
    let gainNode;

    // Patientendaten laden
    fetch(`/api/patient/${patientId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('patientName').innerText = `${data.p_vorname} ${data.p_nachname}`;
            const birthDate = new Date(data.p_geburtsdatum);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            document.getElementById('patientAge').innerText = age;
            document.getElementById('patientGender').innerText = data.p_geschlecht === 1 ? 'männlich' : 'weiblich';
        })
        .catch(error => console.error('Fehler beim Abrufen der Patientendaten:', error));

    // Lautstärkeanpassung
    const volumeControl = document.getElementById('volumeControl');
    volumeControl.addEventListener('input', function() {
        if (gainNode) {
            gainNode.gain.value = this.value; // Lautstärke einstellen
        }
    });

    // Test starten
    document.getElementById('startTestButton').addEventListener('click', function() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();

        fetch('/audios/lautstärke.mp3') // Pfad zur Audiodatei
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netzwerkantwort war nicht ok: ' + response.statusText);
                }
                return response.arrayBuffer();
            })
            .then(data => {
                return audioContext.decodeAudioData(data);
            })
            .then(buffer => {
                audioBuffer = buffer;
                sourceNode = audioContext.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.connect(gainNode);
                gainNode.connect(audioContext.destination); // Lautstärke ausgeben
                sourceNode.start(0);
                document.getElementById('submitAnswers').style.display = 'inline'; // Zeige den Button erst nach dem Test
            })
            .catch(error => {
                console.error('Fehler beim Laden oder Dekodieren der Audiodatei:', error);
            });
    });

    // Antworten einreichen
    document.getElementById('submitAnswers').addEventListener('click', function() {
        const answers = {};
        document.querySelectorAll('[name^="answer-"]').forEach(input => {
            if (input.checked) {
                const questionId = input.name.split('-')[1];
                answers[questionId] = input.value; // Speichere die ausgewählte Antwort
            }
        });

        fetch(`/api/speech_in_noise_test/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(answers),
        }).then(response => {
            if (response.ok) {
                alert('Antworten erfolgreich eingereicht!');
            } else {
                alert('Fehler beim Einreichen der Antworten.');
            }
        });
    });
});
