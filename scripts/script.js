// script.js

// --- CODICE PER GESTIONE UTENTE (pre-esistente, non toccato) ---
function displayUserInfo() {
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
// --- FINE CODICE PER GESTIONE UTENTE ---


// Creazione dell'elemento audio dalla cartella media_scene
let audio = new Audio("media_scene/audio_1_1.mp3");
let startTime = 0; // Tempo in ms in cui parte l'audio
let canSelect = false; // Diventa true dopo il tempo di clickabilità

// Variabile per il tempo di clickabilità
let clickDelaySeconds = 0; // Verrà caricato dal CSV

// Variabile per poter cancellare il timeout della clickabilità
let clickabilityTimeoutId;

// --- NUOVA LOGICA: Funzione di Reset Audio Centralizzata ---
// Questa funzione ora si assicura di fermare tutto e ripristinare lo stato iniziale
function resetAudioAndGame() {
    audio.pause();
    audio.currentTime = 0; // Riporta l'audio all'inizio
    startTime = 0; // Resetta il tempo di inizio
    canSelect = false; // Disabilita la clickabilità

    // Cancella qualsiasi timeout pendente per la clickabilità
    if (clickabilityTimeoutId) {
        clearTimeout(clickabilityTimeoutId);
        clickabilityTimeoutId = null; // Resetta l'ID del timeout
    }
    console.log("Audio e gioco resettati. Clickabilità disabilitata.");

    // Riabilita tutti i bottoni delle opzioni e resetta il colore
    let optionButtons = document.querySelectorAll("#options-container .option");
    optionButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.backgroundColor = ""; // Rimuovi il colore di sfondo impostato
        btn.classList.remove("correct"); // Rimuovi la classe 'correct'
    });

    // Ricarica le opzioni dal CSV per resettare il gioco in caso di riproduzione
    loadCSV();
}
// --- FINE NUOVA LOGICA DI RESET ---


// Inizializza i controlli audio
document.getElementById("play-btn").addEventListener("click", function () {
    // Ogni volta che si preme play, resettiamo lo stato del gioco e dell'audio
    // per garantire un avvio pulito della scena
    resetAudioAndGame(); // Richiamo la funzione di reset

    audio.play();
    startTime = new Date().getTime(); // Registra il nuovo tempo di inizio

    // Imposta il timeout per abilitare la clickabilità
    clickabilityTimeoutId = setTimeout(() => {
        canSelect = true;
        console.log(`Ora puoi selezionare le risposte corrette (dopo ${clickDelaySeconds} secondi).`);
    }, clickDelaySeconds * 1000); // Converte secondi in millisecondi
});

document.getElementById("pause-btn").addEventListener("click", function () {
    audio.pause();
    // Non azzeriamo canSelect qui, l'utente potrebbe voler riprendere dopo la pausa
});

// Listener per il nuovo pulsante di reset
document.getElementById("reset-audio-btn").addEventListener("click", function() {
    resetAudioAndGame(); // Richiamo la funzione di reset al click sul pulsante
});


// Alla fine dell'audio, controllo se tutte le opzioni sono corrette (colorate di verde)
audio.onended = function () {
    let buttons = document.querySelectorAll(".option");
    let allGreen = true;
    buttons.forEach((btn) => {
        if (!btn.classList.contains("correct")) {
            allGreen = false;
        }
    });
    if (allGreen) {
        showModal("Prova superata!");
    }
    // Dopo che l'audio finisce, forse vogliamo disabilitare i bottoni
    // o invitare a un nuovo gioco/reset. Per ora, i bottoni rimangono disabilitati
    // se già cliccati, ma quelli non cliccati no. Potrebbe essere un'idea
    // chiamare resetAudioAndGame() qui per ripartire da zero se vuoi.
    // Oppure lasciare che l'utente clicchi il pulsante di reset.
};

// Funzione per mostrare il popup modal
function showModal(message) {
    let modal = document.getElementById("modal");
    let modalMessage = document.getElementById("modal-message");
    modalMessage.textContent = message;
    modal.style.display = "block";
}

// Gestore per la chiusura della modal
document.getElementById("close-modal").addEventListener("click", function () {
    document.getElementById("modal").style.display = "none";
});

// Funzione per caricare il file CSV
function loadCSV() {
    fetch("media_scene/scena_1_1.csv")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.text();
        })
        .then((data) => {
            console.log("CSV data loaded:", data);
            processCSV(data);
        })
        .catch((error) => {
            console.error("Error loading CSV:", error);
            // Potresti voler mostrare un messaggio all'utente qui
        });
}

// Processa il CSV: separa le parole "ok" e "ko"
function processCSV(data) {
    let lines = data.trim().split(/\r?\n/);
    console.log("CSV lines:", lines);
    let okWords = [];
    let koWords = [];

    // Resetting clickDelaySeconds in case CSV is reloaded
    clickDelaySeconds = 0;

    lines.forEach((line) => {
        if (!line.trim()) return;

        let parts = line.split(";");
        if (parts.length >= 2) {
            let key = parts[0].trim().toUpperCase();
            let value = parts[1].trim();

            if (key === "CLICK_DELAY_SECONDS") {
                const parsedDelay = parseInt(value, 10);
                if (!isNaN(parsedDelay) && parsedDelay >= 0) {
                    clickDelaySeconds = parsedDelay;
                    console.log(`Tempo di clickabilità impostato a ${clickDelaySeconds} secondi dal CSV.`);
                } else {
                    console.warn(`Valore CLICK_DELAY_SECONDS non valido nel CSV: ${value}. Usando il default 0.`);
                    clickDelaySeconds = 0;
                }
                return;
            }

            let word = parts[0].trim();
            let result = parts[1].trim().toLowerCase();
            if (result === "ok") {
                okWords.push({ word, result });
            } else if (result === "ko") {
                koWords.push({ word, result });
            }
        }
    });

    console.log("Parole ok:", okWords);
    console.log("Parole ko:", koWords);

    if (okWords.length < 2 || koWords.length < 2) {
        console.error("Non ci sono abbastanza parole nel CSV per entrambe le categorie.");
        // Considera di mostrare un messaggio all'utente o disabilitare il gioco qui
        return;
    }

    let selectedOk = getRandomElements(okWords, 2);
    let selectedKo = getRandomElements(koWords, 2);
    let selected = [...selectedOk, ...selectedKo];
    shuffleArray(selected);

    let optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = ""; // Pulisce le opzioni precedenti
    selected.forEach((item) => {
        let btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = item.word;
        btn.setAttribute("data-result", item.result);
        btn.addEventListener("click", function () {
            handleOptionClick(btn);
        });
        optionsContainer.appendChild(btn);
    });
}

// Gestione del click sui bottoni opzione
function handleOptionClick(btn) {
    if (btn.disabled) return;

    let clickTime = new Date().getTime();
    let elapsed = clickTime - startTime;
    let result = btn.getAttribute("data-result");

    console.log(`Bottone "${btn.textContent}" cliccato a ${elapsed}ms - risultato previsto: ${result}`);

    let isCorrect = (canSelect && result === "ok"); // Controlla anche che sia cliccabile e risultato sia "ok"

    if (isCorrect) {
        btn.style.backgroundColor = "green";
        btn.classList.add("correct");
        updateUserExperience(100); // Esempio: aggiungi 100 XP
    } else {
        btn.style.backgroundColor = "red";
        // Puoi aggiungere una penalità o feedback per risposte sbagliate
        // updateUserExperience(-50); // Esempio: togli 50 XP
    }

    btn.disabled = true;
}

// Aggiornamento dei punti XP dell'utente
function updateUserExperience(points) {
    if (window.currentUser) {
        window.currentUser.experiencePoints += points;
        displayUserInfo();
        console.log(`Punti XP utente aggiornati: ${window.currentUser.experiencePoints}`);
    } else {
        console.warn("Oggetto utente simulato non trovato. Impossibile aggiornare XP.");
    }
}


// Funzione di utilità per selezionare casualmente n elementi da un array
function getRandomElements(array, n) {
    let result = [];
    let clone = array.slice();
    for (let i = 0; i < n && clone.length > 0; i++) {
        let index = Math.floor(Math.random() * clone.length);
        result.push(clone[index]);
        clone.splice(index, 1);
    }
    return result;
}

// Funzione di utilità per mischiare un array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Avvio: carica il CSV quando la pagina è pronta
window.onload = function () {
    displayUserInfo();
    loadCSV();
};