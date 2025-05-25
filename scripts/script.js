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

// --- NUOVA VARIABILE PER IL TEMPO DI CLICKABILITÀ ---
let clickDelaySeconds = 0; // Verrà caricato dal CSV

// --- NUOVO: Gestione del timer per la clickabilità ---
let clickabilityTimeoutId; // Per poter cancellare il timeout se l'audio viene resettato

// Inizializza i controlli audio
document.getElementById("play-btn").addEventListener("click", function () {
    // Se l'audio è già in riproduzione o in pausa, resettiamolo prima di riprodurre
    if (!audio.paused || audio.currentTime > 0) {
        resetAudio(); // Resetta l'audio prima di riprodurre di nuovo
    }

    audio.play();
    startTime = new Date().getTime();
    canSelect = false; // Resetta lo stato di clickabilità all'inizio di ogni riproduzione

    // Cancella qualsiasi timeout precedente per sicurezza
    if (clickabilityTimeoutId) {
        clearTimeout(clickabilityTimeoutId);
    }

    // Abilita le selezioni corrette dopo il tempo specificato dal CSV
    clickabilityTimeoutId = setTimeout(() => {
        canSelect = true;
        console.log(`Ora puoi selezionare le risposte corrette (dopo ${clickDelaySeconds} secondi).`);
    }, clickDelaySeconds * 1000); // Converte secondi in millisecondi
});

document.getElementById("pause-btn").addEventListener("click", function () {
    audio.pause();
    // Non azzeriamo canSelect qui, l'utente potrebbe voler riprendere dopo la pausa
});

// --- NUOVA FUNZIONE: Reset Audio ---
document.getElementById("reset-audio-btn").addEventListener("click", function() {
    resetAudio();
});

function resetAudio() {
    audio.pause();
    audio.currentTime = 0; // Riporta l'audio all'inizio
    canSelect = false; // Disabilita la clickabilità
    if (clickabilityTimeoutId) {
        clearTimeout(clickabilityTimeoutId); // Cancella il timeout di clickabilità
    }
    console.log("Audio resettato. Clickabilità disabilitata.");

    // Riabilita tutti i bottoni delle opzioni e resetta il colore
    let optionButtons = document.querySelectorAll("#options-container .option");
    optionButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.backgroundColor = ""; // Rimuovi il colore di sfondo impostato
        btn.classList.remove("correct"); // Rimuovi la classe 'correct'
    });
}
// --- FINE NUOVE FUNZIONI AUDIO ---


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
    });
}

// Processa il CSV: separa le parole "ok" e "ko"
function processCSV(data) {
  let lines = data.trim().split(/\r?\n/);
  console.log("CSV lines:", lines);
  let okWords = [];
  let koWords = [];
  
  lines.forEach((line) => {
    if (!line.trim()) return;

    let parts = line.split(";");
    if (parts.length >= 2) {
        let key = parts[0].trim().toUpperCase(); // Leggiamo la chiave
        let value = parts[1].trim();

        // --- NUOVO: Leggi il tempo di clickabilità dal CSV ---
        if (key === "CLICK_DELAY_SECONDS") {
            const parsedDelay = parseInt(value, 10);
            if (!isNaN(parsedDelay) && parsedDelay >= 0) {
                clickDelaySeconds = parsedDelay;
                console.log(`Tempo di clickabilità impostato a ${clickDelaySeconds} secondi dal CSV.`);
            } else {
                console.warn(`Valore CLICK_DELAY_SECONDS non valido nel CSV: ${value}. Usando il default 0.`);
                clickDelaySeconds = 0; // Default o un valore predefinito
            }
            return; // Salta il resto del processing per questa riga di configurazione
        }
        // --- FINE NUOVO: Leggi il tempo di clickabilità ---

        // Logica esistente per parole ok/ko
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
    return;
  }
  
  let selectedOk = getRandomElements(okWords, 2);
  let selectedKo = getRandomElements(koWords, 2);
  let selected = [...selectedOk, ...selectedKo];
  shuffleArray(selected);
  
  let optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";
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
  
  // --- NUOVO: Logica per i Punti XP e check con clickDelaySeconds ---
  let isCorrect = (elapsed >= (clickDelaySeconds * 1000) && result === "ok"); // Controlla anche il tempo
  
  if (isCorrect) {
    btn.style.backgroundColor = "green";
    btn.classList.add("correct");
    // Aggiungi punti XP all'utente simulato
    updateUserExperience(100); // Esempio: aggiungi 100 XP per ogni risposta corretta
  } else {
    btn.style.backgroundColor = "red";
    // Penalità o nessun XP per risposte sbagliate o anticipate
    // updateUserExperience(-50); // Esempio: togli 50 XP per risposte sbagliate
  }
  // --- FINE NUOVO ---

  btn.disabled = true;
}

// --- NUOVA FUNZIONE: Aggiornamento dei punti XP dell'utente ---
function updateUserExperience(points) {
    if (window.currentUser) { // Controlla che l'oggetto utente simulato esista
        window.currentUser.experiencePoints += points;
        // Aggiorna la visualizzazione sulla pagina
        displayUserInfo();
        console.log(`Punti XP utente aggiornati: ${window.currentUser.experiencePoints}`);
    } else {
        console.warn("Oggetto utente simulato non trovato. Impossibile aggiornare XP.");
    }
}
// --- FINE NUOVA FUNZIONE ---


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