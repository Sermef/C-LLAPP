// script.js

// --- CODICE PER GESTIONE UTENTE ---
// Questa funzione aggiorna le informazioni dell'utente simulate nel DOM.
function displayUserInfo() {
    const user = getSimulatedUser(); // Assumi che getSimulatedUser() sia in userSimulator.js
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


// --- VARIABILI GLOBALI PER LA SCENA E L'AUDIO ---
// Creazione dell'elemento audio dalla cartella media_scene
let audio = new Audio("media_scene/audio_1_1.mp3");
let startTime = 0; // Tempo in ms in cui l'audio è partito per la scena corrente
let canSelect = false; // Non usato per il timer globale, ma per controllo generale se necessario
let clickabilityTimeoutId; // Per poter cancellare eventuali timeout futuri se reintrodotti

// Elementi del DOM per l'aggiornamento dinamico dei testi e del tempo
let campaignTitleElement;
let sceneTitleElement;
let sceneIntroTextElement;
let audioTimeDisplayElement; // Elemento per la visualizzazione del tempo dell'audio


// --- FUNZIONI DI UTILITÀ PER IL TEMPO ---
// Formatta i secondi in formato MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
	return `${paddedMinutes}:${paddedSeconds}`;
}

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


// --- LOGICA DI RESET COMPLETO DELLA SCENA ---
// Questa funzione ripristina l'intero stato della scena e dell'audio.
function resetAudioAndGame() {
    audio.pause();
    audio.currentTime = 0; // Riporta l'audio all'inizio
    startTime = 0; // Resetta il tempo di inizio per una nuova sessione di gioco
    canSelect = false; // Disabilita la clickabilità

    // Cancella qualsiasi timeout pendente (utile se reintroduciamo un timer globale)
    if (clickabilityTimeoutId) {
        clearTimeout(clickabilityTimeoutId);
        clickabilityTimeoutId = null;
    }
    console.log("Audio e gioco resettati. Clickabilità disabilitata.");

    // Riabilita tutti i bottoni delle opzioni e resetta il loro colore
    let optionButtons = document.querySelectorAll("#options-container .option");
    optionButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.backgroundColor = ""; // Rimuove il colore di sfondo impostato da precedenti click
        btn.classList.remove("correct"); // Rimuove la classe 'correct'
    });

    // Aggiorna il display del tempo dell'audio a 00:00 (e durata se già disponibile)
    if (audioTimeDisplayElement) {
        audioTimeDisplayElement.textContent = '00:00 / ' + (isNaN(audio.duration) ? '--:--' : formatTime(audio.duration));
    }

    // Ricarica la scena dal XML per rigenerare le parole e l'intro
    loadXMLScene();
}
// --- FINE LOGICA DI RESET COMPLETO DELLA SCENA ---


// --- GESTIONE DEI CONTROLLI AUDIO (PLAY, PAUSE, RESET) ---
// Gestore per il pulsante Play
document.getElementById("play-btn").addEventListener("click", function () {
    // Se l'audio è finito o è al punto iniziale (0), ripartiamo dall'inizio.
    // Altrimenti, riprende semplicemente da dove era stato messo in pausa.
    if (audio.ended || audio.currentTime === 0) {
        audio.currentTime = 0; // Assicurati che parta da 0 se è finito
    }
    audio.play();

    // Registra il tempo di inizio SOLO se non è già stato registrato per la sessione corrente
    // Questo è fondamentale per calcolare il 'elapsed' correttamente per i click sugli oggetti
    if (startTime === 0) {
        startTime = new Date().getTime();
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
    resetAudioAndGame(); // Il pulsante di reset triggera il reset completo della scena
});
// --- FINE GESTIONE DEI CONTROLLI AUDIO ---

// --- GESTIONE MODAL (POPUP) ---
// Funzione per mostrare il popup modal con un messaggio
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
// --- FINE GESTIONE MODAL ---


// --- CARICAMENTO E PARSING XML DELLA SCENA ---
// Carica il file XML che definisce la scena
function loadXMLScene() {
    fetch("media_scene/scena_1_1.xml") // Percorso del file XML
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok: " + response.statusText);
            }
            return response.text();
        })
        .then(xmlString => {
            console.log("XML data loaded:", xmlString);
            processXML(xmlString); // Processa la stringa XML
        })
        .catch(error => {
            console.error("Error loading XML:", error);
            // Mostra un messaggio di errore all'utente se il caricamento fallisce
            if(sceneIntroTextElement) {
                sceneIntroTextElement.textContent = "Errore nel caricamento della scena. Riprova più tardi.";
            }
        });
}

// Processa il contenuto XML per estrarre i dati della scena e generare i bottoni
function processXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // Controlla se ci sono stati errori nel parsing del XML
    const errorNode = xmlDoc.querySelector('parsererror');
    if (errorNode) {
        console.error('Errore nel parsing XML:', errorNode.textContent);
        if(sceneIntroTextElement) {
            sceneIntroTextElement.textContent = "Errore nella lettura dei dati della scena. Formato XML non valido.";
        }
        return;
    }

    // Estrai i dati dalla Campagna (elemento radice)
    const campagnaElement = xmlDoc.querySelector('Campagna');
    if (!campagnaElement) {
        console.error("Elemento <Campagna> non trovato nel XML. Assicurati che sia la radice.");
        return;
    }
    const campaignTitle = campagnaElement.querySelector('Titolo')?.textContent || 'Campagna senza titolo';
    if(campaignTitleElement) {
        campaignTitleElement.textContent = campaignTitle;
    }


    // Estrai i dati dalla Scena (all'interno di Campagna)
    const scenaElement = campagnaElement.querySelector('scena'); // CERCA SCENA DENTRO CAMPAGNA
    if (!scenaElement) {
        console.error("Elemento <scena> non trovato nel XML (o non è un figlio diretto di <Campagna>).");
        return;
    }

    const titoloScena = scenaElement.querySelector('TitoloScena')?.textContent || 'Scena senza titolo';
    const introText = scenaElement.querySelector('Intro')?.textContent || 'Nessuna introduzione.';

    // Aggiorna gli elementi HTML con i dati estratti
    if(sceneTitleElement) {
        sceneTitleElement.textContent = titoloScena;
    }
    if(sceneIntroTextElement) {
        sceneIntroTextElement.textContent = introText;
    }

    // Estrai tutti gli oggetti (`<Oggetto>`) dalla scena
    const oggetti = [];
    scenaElement.querySelectorAll('Oggetto').forEach(objElement => {
        const idOggetto = objElement.querySelector('idOggetto')?.textContent;
        const chk = objElement.querySelector('chk')?.textContent;
        const time = objElement.querySelector('time')?.textContent;
        const name = objElement.querySelector('name')?.textContent;

        // Assicurati che tutti i dati essenziali siano presenti prima di aggiungerli
        if (idOggetto && chk && time && name) {
            oggetti.push({
                id: parseInt(idOggetto, 10),
                chk: chk.toLowerCase(), // Converti in minuscolo per consistenza
                time: parseInt(time, 10), // Converti in numero
                name: name
            });
        } else {
            console.warn("Oggetto incompleto trovato nel XML, ignorato:", objElement.textContent);
        }
    });

    console.log("Oggetti estratti dall'XML:", oggetti);

    // Filtra e seleziona casualmente 2 parole "ok" e 2 "ko"
    let okWords = oggetti.filter(obj => obj.chk === "ok");
    let koWords = oggetti.filter(obj => obj.chk === "ko");

    // Gestione di casi insufficienti (per evitare errori se ci sono meno di 2 "ok" o "ko")
    if (okWords.length < 2 || koWords.length < 2) {
        console.error("Non ci sono abbastanza oggetti 'ok' o 'ko' nel XML per selezionarne 2 per categoria.");
        // Potresti voler mostrare un messaggio di errore visibile all'utente o disabilitare il gioco
        document.getElementById("options-container").innerHTML = "<p>Errore: non abbastanza parole per avviare il gioco.</p>";
        return;
    }

    let selectedOk = getRandomElements(okWords, 2);
    let selectedKo = getRandomElements(koWords, 2);
    let selected = [...selectedOk, ...selectedKo]; // Combina le selezioni
    shuffleArray(selected); // Mischia l'ordine

    // Genera i bottoni delle opzioni nel DOM
    let optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = ""; // Pulisce qualsiasi bottone precedente

    selected.forEach((item) => {
        let btn = document.createElement("button");
        btn.className = "option";
        btn.textContent = item.name; // Testo del bottone dall'attributo 'name' dell'oggetto
        btn.setAttribute("data-result", item.chk); // "ok" o "ko"
        btn.setAttribute("data-delay", item.time); // Tempo di clickabilità specifico per questo oggetto

        btn.addEventListener("click", function () {
            handleOptionClick(btn);
        });
        optionsContainer.appendChild(btn);
    });
}
// --- FINE CARICAMENTO E PARSING XML ---


// --- LOGICA DI GIOCO: GESTIONE DEL CLICK SUI BOTTONI OPZIONE ---
function handleOptionClick(btn) {
    if (btn.disabled) return; // Impedisce doppi click

    let clickTime = new Date().getTime();
    let elapsed = clickTime - startTime; // Tempo trascorso dall'inizio dell'audio
    let result = btn.getAttribute("data-result"); // "ok" o "ko"
    let objectDelaySeconds = parseInt(btn.getAttribute("data-delay"), 10); // Ritardo specifico dell'oggetto

    console.log(`Bottone "${btn.textContent}" cliccato a ${elapsed}ms - risultato previsto: ${result}, ritardo richiesto: ${objectDelaySeconds}s`);

    // La risposta è considerata corretta se:
    // 1. Il click è avvenuto dopo il 'time' specificato per quell'oggetto (convertito in millisecondi)
    // 2. L'attributo 'chk' dell'oggetto è "ok"
    let isCorrect = (elapsed >= (objectDelaySeconds * 1000) && result === "ok");

    if (isCorrect) {
        btn.style.backgroundColor = "green";
        btn.classList.add("correct");
        updateUserExperience(100); // Aggiunge XP per risposte corrette
    } else {
        btn.style.backgroundColor = "red";
        // Potresti aggiungere una penalità di XP qui, o un messaggio di feedback
        // updateUserExperience(-50);
    }

    btn.disabled = true; // Disabilita il bottone dopo il click
}
// --- FINE LOGICA DI GIOCO ---


// --- GESTIONE PUNTI ESPERIENZA (XP) ---
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
// --- FINE GESTIONE PUNTI ESPERIENZA (XP) ---


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

// Mischia un array usando l'algoritmo Fisher-Yates
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Scambia gli elementi
    }
}
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

    loadXMLScene(); // Carica i dati della scena dal file XML
};