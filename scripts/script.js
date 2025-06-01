// script.js
// Questo file contiene le funzionalità principali dell'applicazione,
// la gestione dell'utente, i controlli audio e la gestione del modal.

// Crea un oggetto globale 'App' per esporre funzioni e variabili ad altri script,
// come scene.js, evitando variabili globali sparse.
window.App = window.App || {};

// --- CODICE PER GESTIONE UTENTE ---
// Questa funzione aggiorna le informazioni dell'utente simulate nel DOM.
function displayUserInfo() {
    // Assumi che getSimulatedUser() sia definito in userSimulator.js e accessibile globalmente
    const user = getSimulatedUser(); 
    const nicknameElement = document.getElementById('user-nickname');
    const levelElement = document.getElementById('user-level');
    const xpElement = document.getElementById('user-xp');
    const sessionCodeElement = document.getElementById('session-code');

    if (nicknameElement) {
        nicknameElement.textContent = user.nickname;
    }
    if (levelElement) {
        levelElement.textContent = user.level;
    }
    if (xpElement) {
        xpElement.textContent = user.experiencePoints;
    }
    if (sessionCodeElement) {
        sessionCodeElement.textContent = user.sessionCode;
    }
}
// Espone la funzione displayUserInfo tramite l'oggetto App
window.App.displayUserInfo = displayUserInfo;
// Espone getSimulatedUser per essere accessibile da scene.js (se necessario)
window.App.getSimulatedUser = typeof getSimulatedUser !== 'undefined' ? getSimulatedUser : () => ({ nickname: 'Ospite', level: 0, experiencePoints: 0, sessionCode: 'N/A' });


// Aggiorna i punti esperienza dell'utente simulato e il display
function updateUserExperience(points) {
    if (window.currentUser) { // Assicurati che l'oggetto utente simulato esista
        window.currentUser.experiencePoints += points;
        displayUserInfo(); // Aggiorna la visualizzazione delle informazioni utente
        console.log(`Punti XP utente aggiornati: ${window.currentUser.experiencePoints}`);
    } else {
        console.warn("Oggetto utente simulato (window.currentUser) non trovato. Impossibile aggiornare XP.");
    }
}
// Espone la funzione updateUserExperience tramite l'oggetto App
window.App.updateUserExperience = updateUserExperience;
// --- FINE CODICE PER GESTIONE UTENTE ---


// --- VARIABILI GLOBALI PER L'AUDIO E RIFERIMENTI DOM ---
// Creazione dell'elemento audio dalla cartella media_scene
let audio = new Audio("media_scene/audio_1_1.mp3");
let startTime = 0; // Tempo in ms in cui l'audio è partito per la scena corrente

// Elementi del DOM per l'aggiornamento dinamico dei testi e del tempo
let campaignTitleElement;
let sceneTitleElement;
let sceneIntroTextElement;
let audioTimeDisplayElement; // Elemento per la visualizzazione del tempo dell'audio

// Espone l'oggetto audio e le funzioni per accedere/modificare startTime
window.App.audio = audio;
window.App.getStartTime = () => startTime;
window.App.setStartTime = (time) => { startTime = time; };

// Espone i riferimenti agli elementi DOM
window.App.getCampaignTitleElement = () => campaignTitleElement;
window.App.getSceneTitleElement = () => sceneTitleElement;
window.App.getSceneIntroTextElement = () => sceneIntroTextElement;
window.App.getAudioTimeDisplayElement = () => audioTimeDisplayElement;


// --- FUNZIONI DI UTILITÀ PER IL TEMPO ---
// Formatta i secondi in formato MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
	return `${paddedMinutes}:${paddedSeconds}`;
}
// Espone la funzione formatTime
window.App.formatTime = formatTime;

// Listener che aggiorna il display del tempo dell'audio mentre l'audio è in riproduzione
audio.addEventListener('timeupdate', function() {
    if (audioTimeDisplayElement) {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        audioTimeDisplayElement.textContent = formatTime(currentTime) + ' / ' + (isNaN(duration) ? '--:--' : formatTime(duration));
    }
});

// Listener che aggiorna il display della durata totale dell'audio non appena i metadati sono disponibili
audio.addEventListener('loadedmetadata', function() {
    if (audioTimeDisplayElement) {
        const duration = audio.duration;
        audioTimeDisplayElement.textContent = '00:00 / ' + (isNaN(duration) ? '--:--' : formatTime(duration));
    }
});
// --- FINE FUNZIONI DI UTILITÀ PER IL TEMPO ---


// --- LOGICA DI RESET COMPLETO DELL'APPLICAZIONE ---
// Questa funzione ripristina l'intero stato dell'audio e chiama il reset della scena.
function resetAudioAndGame() {
    audio.pause();
    audio.currentTime = 0; // Riporta l'audio all'inizio
    window.App.setStartTime(0); // Resetta il tempo di inizio per una nuova sessione di gioco

    console.log("Audio resettato.");

    // Aggiorna il display del tempo dell'audio a 00:00 (e durata se già disponibile)
    if (audioTimeDisplayElement) {
        audioTimeDisplayElement.textContent = '00:00 / ' + (isNaN(audio.duration) ? '--:--' : formatTime(audio.duration));
    }

    // Chiama la funzione di reset specifica della scena, se definita
    if (typeof window.resetSceneState === 'function') {
        window.resetSceneState();
    }
}
// --- FINE LOGICA DI RESET COMPLETO DELL'APPLICAZIONE ---


// --- GESTIONE DEI CONTROLLI AUDIO (PLAY, PAUSE, RESET) ---
// Gestore per il pulsante Play
document.getElementById("play-btn").addEventListener("click", function () {
    if (audio.ended || audio.currentTime === 0) {
        audio.currentTime = 0;
    }
    audio.play();
    if (window.App.getStartTime() === 0) {
        window.App.setStartTime(new Date().getTime());
    }
    console.log("Audio riprodotto.");
});

// Gestore per il pulsante Pause
document.getElementById("pause-btn").addEventListener("click", function () {
    audio.pause();
    console.log("Audio in pausa.");
});

// Gestore per il pulsante Reset
document.getElementById("reset-audio-btn").addEventListener("click", function() {
    resetAudioAndGame();
});
// --- FINE GESTIONE DEI CONTROLLI AUDIO ---

// --- GESTIONE MODAL (POPUP) ---
// Funzione per mostrare il popup modal con un messaggio
function showModal(message) {
    let modal = document.getElementById("modal");
    let modalMessage = document.getElementById("modal-message");
    if (modal && modalMessage) { // Aggiunto controllo null
        modalMessage.textContent = message;
        modal.style.display = "flex"; // Usa flex per centrare il contenuto
    } else {
        console.error("Modal o modalMessage non trovati nel DOM.");
    }
}
// Espone la funzione showModal
window.App.showModal = showModal;

// Gestore per la chiusura della modal
document.getElementById("close-modal").addEventListener("click", function () {
    let modal = document.getElementById("modal");
    if (modal) { // Aggiunto controllo null
        modal.style.display = "none";
    }
});
// --- FINE GESTIONE MODAL ---


// --- FUNZIONI DI UTILITÀ GENERALI ---
// Seleziona casualmente 'n' elementi da un array
function getRandomElements(array, n) {
    let result = [];
    let clone = array.slice(); // Clona l'array per non modificarlo
    for (let i = 0; i < n && clone.length > 0; i++) {
        let index = Math.floor(Math.random() * clone.length);
        result.push(clone[index]);
        clone.splice(index, 1); // Rimuove l'elemento selezionato per evitare duplicati
    }
    return result;
}
// Espone la funzione getRandomElements
window.App.getRandomElements = getRandomElements;

// Mischia un array usando l'algoritmo Fisher-Yates
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Scambia gli elementi
    }
}
// Espone la funzione shuffleArray
window.App.shuffleArray = shuffleArray;
// --- FINE FUNZIONI DI UTILITÀ GENERALI ---


// --- AVVIO DELL'APPLICAZIONE AL CARICAMENTO DELLA PAGINA ---
// Questa funzione viene eseguita una volta che l'intero DOM è stato caricato.
window.onload = function () {
    displayUserInfo(); // Mostra le informazioni utente simulate

    // Inizializza le variabili con i riferimenti agli elementi HTML
    campaignTitleElement = document.getElementById("campaign-title");
    sceneTitleElement = document.getElementById("scene-title");
    sceneIntroTextElement = document.getElementById("scene-intro-text");
    audioTimeDisplayElement = document.getElementById("audio-time"); // Riferimento all'elemento del tempo audio

    // Imposta il display del tempo iniziale a 00:00 / --:-- (la durata verrà aggiornata in loadedmetadata)
    if (audioTimeDisplayElement) {
        audioTimeDisplayElement.textContent = '00:00 / --:--';
    }

    // Chiama la funzione di inizializzazione della scena, definita in scene.js
    if (typeof window.initScene === 'function') {
        window.initScene();
    } else {
        console.error("Errore: La funzione 'initScene' non è stata trovata. Assicurati che 'scene.js' sia caricato correttamente.");
    }
};
