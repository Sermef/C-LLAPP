// scene.js
// Questo file contiene la logica specifica per la scena corrente,
// inclusa la lettura dell'XML, la gestione dei bottoni e la progressione.

// Variabili globali specifiche della scena
let minScoreToPass = 0;
let correctlyClickedOkItems = 0;
let totalOkItems = 0;
let currentSceneId = '1_1'; // Valore di default, verrà sovrascritto dall'URL
let liveFeedbackMessagesElement; // Riferimento al nuovo div per i messaggi di feedback

// Funzione di utilità per ottenere i parametri dall'URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Funzione di inizializzazione della scena, chiamata da script.js
function initScene() {
    console.log("Inizializzazione della scena...");
    // Ottieni il reference al div per i messaggi di feedback
    liveFeedbackMessagesElement = document.getElementById('live-feedback-messages');
    if (!liveFeedbackMessagesElement) {
        console.error("Elemento #live-feedback-messages non trovato nel DOM.");
    }

    // Ottieni il sceneId dall'URL, se presente
    const sceneIdFromUrl = getUrlParameter('sceneId');
    if (sceneIdFromUrl) {
        currentSceneId = sceneIdFromUrl;
    }
    console.log(`Caricamento scena: ${currentSceneId}`);
    // Carica i dati della scena dal file XML
    loadXMLScene();
}

// --- LOGICA DI RESET SPECIFICA DELLA SCENA ---
// Questa funzione viene chiamata da script.js per resettare lo stato della scena.
function resetSceneState() {
    correctlyClickedOkItems = 0; // Resetta il contatore degli oggetti "ok" cliccati
    totalOkItems = 0; // Resetta il totale degli oggetti "ok"

    // Pulisce i messaggi di feedback intermedi
    if (liveFeedbackMessagesElement) {
        liveFeedbackMessagesElement.innerHTML = '';
    }

    // Riabilita tutti i bottoni delle opzioni e resetta il loro colore
    let optionButtons = document.querySelectorAll("#options-container .option");
    optionButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("correct"); // Rimuove la classe 'correct'
        btn.classList.remove("red-background"); // Rimuove la classe 'red-background'
        btn.style.backgroundColor = ""; // Rimuove il colore di sfondo impostato da precedenti click (se non si usa la classe)
    });

    // Nasconde il bottone "Passa alla Scena Successiva"
    const nextSceneBtn = document.getElementById('next-scene-btn');
    if (nextSceneBtn) {
        nextSceneBtn.remove(); // Rimuove il bottone dal DOM
    }

    // Ricarica la scena dal XML per rigenerare le parole e l'intro
    loadXMLScene();
    console.log("Stato della scena resettato.");
}

// --- CARICAMENTO E PARSING XML DELLA SCENA ---
// Carica il file XML che definisce la scena
function loadXMLScene() {
    // Costruisci il percorso del file XML dinamicamente
    const xmlFilePath = `media_scene/scena_${currentSceneId}.xml`;
    
    fetch(xmlFilePath) // Percorso del file XML
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
            console.error(`Error loading XML for scene ${currentSceneId}:`, error);
            // Mostra un messaggio di errore all'utente se il caricamento fallisce
            const sceneIntroTextElement = window.App.getSceneIntroTextElement();
            if(sceneIntroTextElement) {
                sceneIntroTextElement.textContent = `Errore nel caricamento della scena ${currentSceneId}. Riprova più tardi.`;
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
        const sceneIntroTextElement = window.App.getSceneIntroTextElement();
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
    const campaignTitleElement = window.App.getCampaignTitleElement();
    if(campaignTitleElement) {
        campaignTitleElement.textContent = campaignTitle;
    }


    // Estrai i dati dalla Scena (all'interno di Campagna)
    const scenaElement = campagnaElement.querySelector('scena');
    if (!scenaElement) {
        console.error("Elemento <scena> non trovato nel XML (o non è un figlio diretto di <Campagna>).");
        return;
    }

    const titoloScena = scenaElement.querySelector('TitoloScena')?.textContent || 'Scena senza titolo';
    const introText = scenaElement.querySelector('Intro')?.textContent || 'Nessuna introduzione.';
    
    // Estrai il punteggio minimo per passare alla scena successiva
    const minScoreElement = scenaElement.querySelector('MinScore');
    if (minScoreElement) {
        minScoreToPass = parseInt(minScoreElement.textContent, 10);
        console.log("Punteggio minimo per passare alla scena successiva:", minScoreToPass);
    } else {
        console.warn("Elemento <MinScore> non trovato nel XML. Impostato a 0.");
        minScoreToPass = 0;
    }

    // Aggiorna gli elementi HTML con i dati estratti
    const sceneTitleElement = window.App.getSceneTitleElement();
    const sceneIntroTextElement = window.App.getSceneIntroTextElement();
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

    // Imposta il numero totale di oggetti "ok" per la scena
    totalOkItems = okWords.length;

    // Gestione di casi insufficienti (per evitare errori se ci sono meno di 2 "ok" o "ko")
    if (okWords.length < 2 || koWords.length < 2) {
        console.error("Non ci sono abbastanza oggetti 'ok' o 'ko' nel XML per selezionarne 2 per categoria.");
        document.getElementById("options-container").innerHTML = "<p>Errore: non abbastanza parole per avviare il gioco.</p>";
        return;
    }

    // Usa le funzioni di utilità da window.App
    let selectedOk = window.App.getRandomElements(okWords, 2);
    let selectedKo = window.App.getRandomElements(koWords, 2);
    let selected = [...selectedOk, ...selectedKo]; // Combina le selezioni
    window.App.shuffleArray(selected); // Mischia l'ordine

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
    // Accedi a startTime tramite window.App
    let elapsed = clickTime - window.App.getStartTime(); 
    let result = btn.getAttribute("data-result"); // "ok" o "ko"
    let objectDelaySeconds = parseInt(btn.getAttribute("data-delay"), 10); // Ritardo specifico dell'oggetto

    console.log(`Bottone "${btn.textContent}" cliccato a ${elapsed}ms - risultato previsto: ${result}, ritardo richiesto: ${objectDelaySeconds}s`);

    let feedbackMessage = "";
    // La risposta è considerata corretta se:
    // 1. Il click è avvenuto dopo il 'time' specificato per quell'oggetto (convertito in millisecondi)
    // 2. L'attributo 'chk' dell'oggetto è "ok"
    let isCorrect = (elapsed >= (objectDelaySeconds * 1000) && result === "ok");

    // Usa le funzioni da window.App per aggiornare XP
    if (isCorrect) {
        btn.classList.add("correct"); // Applica la classe per le risposte corrette
        window.App.updateUserExperience(100); // Aggiunge XP per risposte corrette
        feedbackMessage = `Corretto! Hai guadagnato 100 XP cliccando "${btn.textContent}".`;
        correctlyClickedOkItems++; // Incrementa il contatore degli oggetti "ok" cliccati correttamente
    } else {
        btn.classList.add("red-background"); // Applica la classe per le risposte sbagliate
        window.App.updateUserExperience(-50); // Penalità di XP per risposte sbagliate
        feedbackMessage = `Sbagliato! Hai perso 50 XP cliccando "${btn.textContent}".`;
    }

    // Aggiungi il messaggio di feedback al div dedicato
    if (liveFeedbackMessagesElement) {
        const p = document.createElement('p');
        p.textContent = feedbackMessage;
        p.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect'); // Aggiungi classi per stile
        liveFeedbackMessagesElement.appendChild(p);
        // Scorrimento automatico per visualizzare l'ultimo messaggio
        liveFeedbackMessagesElement.scrollTop = liveFeedbackMessagesElement.scrollHeight;
    }

    btn.disabled = true; // Disabilita il bottone dopo il click

    // Controlla se tutti gli oggetti "ok" sono stati cliccati correttamente
    if (correctlyClickedOkItems === totalOkItems) {
        console.log("Tutti gli oggetti 'ok' sono stati cliccati correttamente.");
        checkAndDisplayNextSceneButton();
    }
}
// --- FINE LOGICA DI GIOCO ---

// --- LOGICA DI PROGRESSIONE SCENA ---
function checkAndDisplayNextSceneButton() {
    // Accedi ai dati utente tramite window.App
    const user = window.App.getSimulatedUser(); 
    console.log(`Controllo progressione scena: XP Utente: ${user.experiencePoints}, Punteggio Minimo: ${minScoreToPass}`);

    let finalModalMessage = "";
    if (user.experiencePoints >= minScoreToPass) {
        finalModalMessage = `Complimenti! Hai superato la scena con ${user.experiencePoints} XP. Punteggio minimo richiesto: ${minScoreToPass} XP.`;
        // Mostra il modal e, alla sua chiusura, il bottone per la scena successiva
        window.App.showModal(finalModalMessage, displayNextSceneButton);
    } else {
        finalModalMessage = `Peccato! Non hai raggiunto il punteggio minimo (${minScoreToPass} XP). Il tuo punteggio è ${user.experiencePoints} XP. Riprova!`;
        // Mostra il modal, ma non il bottone di avanzamento
        window.App.showModal(finalModalMessage);
    }
}

function displayNextSceneButton() {
    let gameArea = document.querySelector('.game-area');
    let nextSceneBtn = document.getElementById('next-scene-btn');

    // Se il bottone esiste già, non fare nulla
    if (nextSceneBtn) {
        return;
    }

    nextSceneBtn = document.createElement('a');
    nextSceneBtn.id = 'next-scene-btn';
    
    // Calcola il prossimo sceneId in base al currentSceneId
    // Assumiamo che il formato sia 'X_Y' e incrementiamo solo Y
    const parts = currentSceneId.split('_');
    let nextSceneNum = parseInt(parts[1], 10) + 1;
    const nextSceneId = `${parts[0]}_${nextSceneNum}`;

    nextSceneBtn.href = `scene.html?sceneId=${nextSceneId}`; // Link alla prossima scena dinamica
    nextSceneBtn.textContent = 'Passa alla Scena Successiva';
    
    // Aggiungi il bottone alla fine dell'area di gioco
    gameArea.appendChild(nextSceneBtn);
    console.log(`Bottone 'Passa alla Scena Successiva' aggiunto al DOM. Prossima scena: ${nextSceneId}`);
}
// --- FINE LOGICA DI PROGRESSIONE SCENA ---

// Espone le funzioni di inizializzazione e reset della scena globalmente
// in modo che script.js possa chiamarle.
window.initScene = initScene;
window.resetSceneState = resetSceneState;
