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
let clickDelaySeconds = 0; // Verrà caricato dal XML per ogni oggetto

// Variabile per poter cancellare il timeout della clickabilità
let clickabilityTimeoutId;

// Elementi per i titoli della scena e della campagna
let campaignTitleElement;
let sceneTitleElement;
let sceneIntroTextElement;

// --- NUOVA LOGICA: Funzione di Reset Audio Centralizzata ---
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

    // Ricarica le opzioni dal XML per resettare il gioco in caso di riproduzione
    // Questo genererà nuove parole e ripristinerà l'intro
    loadXMLScene();
}
// --- FINE NUOVA LOGICA DI RESET ---


// Inizializza i controlli audio
document.getElementById("play-btn").addEventListener("click", function () {
    // Ogni volta che si preme play, resettiamo lo stato del gioco e dell'audio
    // per garantire un avvio pulito della scena
    resetAudioAndGame(); // Richiamo la funzione di reset

    audio.play();
    startTime = new Date().getTime(); // Registra il nuovo tempo di inizio

    // Imposta il timeout per abilitare la clickabilità (usa il valore dell'oggetto cliccato)
    // Non possiamo impostare un timeout globale qui perché il tempo è per oggetto.
    // La logica di canSelect verrà gestita dentro handleOptionClick() ora.
    // Rimuoviamo il setTimeout globale qui.
    // canSelect viene gestita solo dal click dell'utente ora, non da un timer generale.
    // L'unica condizione sarà elapsed >= clickDelaySeconds * 1000 E result === "ok".
});


document.getElementById("pause-btn").addEventListener("click", function () {
    audio.pause();
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

// --- NUOVA FUNZIONE: Processa il XML ---
function processXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // Controlla errori di parsing XML
    const errorNode = xmlDoc.querySelector('parsererror');
    if (errorNode) {
        console.error('Errore nel parsing XML:', errorNode.textContent);
        if(sceneIntroTextElement) {
            sceneIntroTextElement.textContent = "Errore nella lettura dei dati della scena. Formato XML non valido.";
        }
        return;
    }

    // Estrai i dati dalla Campagna
    const campagnaElement = xmlDoc.querySelector('Campagna');
    if (!campagnaElement) {
        console.error("Elemento <Campagna> non trovato nel XML.");
        return;
    }

    // Estrai il Titolo della Campagna e aggiorna l'HTML
    const campaignTitle = campagnaElement.querySelector('Titolo')?.textContent || 'Campagna senza titolo';
    if(campaignTitleElement) {
        campaignTitleElement.textContent = campaignTitle;
    }


    // Estrai i dati dalla scena
    const scenaElement = campagnaElement.querySelector('scena'); // CERCA SCENA DENTRO CAMPAGNA
    if (!scenaElement) {
        console.error("Elemento <scena> non trovato nel XML (o non dentro <Campagna>).");
        return;
    }

    const titoloScena = scenaElement.querySelector('TitoloScena')?.textContent || 'Scena senza titolo';
    const introText = scenaElement.querySelector('Intro')?.textContent || 'Nessuna introduzione.';

    // Aggiorna il titolo della scena nell'HTML
    if(sceneTitleElement) {
        sceneTitleElement.textContent = titoloScena;
    }
    // Aggiorna il testo di introduzione della scena nell'HTML
    if(sceneIntroTextElement) {
        sceneIntroTextElement.textContent = introText;
    }

    const oggetti = [];
    scenaElement.querySelectorAll('Oggetto').forEach(objElement => {
        const idOggetto = objElement.querySelector('idOggetto')?.textContent;
        const chk = objElement.querySelector('chk')?.textContent;
        const time = objElement.querySelector('time')?.textContent;
        const name = objElement.querySelector('name')?.textContent;

        if (idOggetto && chk && time && name) {
            oggetti.push({
                id: parseInt(idOggetto, 10),
                chk: chk.toLowerCase(),
                time: parseInt(time, 10),
                name: name
            });
        }
    });

    console.log("Oggetti estratti dall'XML:", oggetti);

    // Seleziona casualmente 2 parole "ok" e 2 "ko" come prima
    let okWords = oggetti.filter(obj => obj.chk === "ok");
    let koWords = oggetti.filter(obj => obj.chk === "ko");

    if (okWords.length < 2 || koWords.length < 2) {
        console.error("Non ci sono abbastanza oggetti 'ok' o 'ko' nel XML per selezionarne 2 per categoria.");
        // Potresti voler mostrare un messaggio all'utente o disabilitare il gioco qui
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
        btn.textContent = item.name;
        btn.setAttribute("data-result", item.chk);
        btn.setAttribute("data-delay", item.time);

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
    let objectDelaySeconds = parseInt(btn.getAttribute("data-delay"), 10); // Leggiamo il ritardo specifico dell'oggetto

    console.log(`Bottone "${btn.textContent}" cliccato a ${elapsed}ms - risultato previsto: ${result}, ritardo richiesto: ${objectDelaySeconds}s`);

    // La risposta è corretta se:
    // 1. È stata cliccata dopo il 'time' specificato per quell'oggetto (in millisecondi)
    // 2. Il suo attributo 'chk' è "ok"
    let isCorrect = (elapsed >= (objectDelaySeconds * 1000) && result === "ok");

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

// Avvio: carica la scena XML quando la pagina è pronta
window.onload = function () {
    displayUserInfo();
    // Inizializza gli elementi HTML all'avvio
    campaignTitleElement = document.getElementById("campaign-title");
    sceneTitleElement = document.getElementById("scene-title");
    sceneIntroTextElement = document.getElementById("scene-intro-text");

    loadXMLScene();
};