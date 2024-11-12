document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('speechInNoiseBtn').addEventListener('click', function() {
        window.location.href = 'sin.html';  // Weiterleitung zum Speech in Noise Test
    });

    document.getElementById('reintonaudiometrieBtn').addEventListener('click', function() {
        window.location.href = 'reintonaudiometrie.html';  // Weiterleitung zur Reintonaudiometrie
    });
});
