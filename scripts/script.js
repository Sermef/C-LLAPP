// Creazione dell'elemento audio dalla cartella media_scene
let audio = new Audio("media_scene/audio_1_1.mp3");
let startTime = 0; // Tempo in ms in cui parte l'audio
let canSelect = false; // Diventa true dopo 14 secondi

// Inizializza i controlli audio
document.getElementById("play-btn").addEventListener("click", function () {
  audio.play();
  startTime = new Date().getTime();
  // Dopo 14 secondi, abilito le selezioni corrette
  setTimeout(() => {
    canSelect = true;
    console.log("Ora puoi selezionare le risposte corrette.");
  }, 14000);
});

document.getElementById("pause-btn").addEventListener("click", function () {
  audio.pause();
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
  // Utilizza entrambi i tipi di newline, compatibile con Windows e Unix
  let lines = data.trim().split(/\r?\n/);
  console.log("CSV lines:", lines);
  let okWords = [];
  let koWords = [];
  
  lines.forEach((line) => {
    // Ignora righe vuote
    if (!line.trim()) return;
    
    let parts = line.split(";");
    if (parts.length >= 2) {
      let word = parts[0].trim();
      let result = parts[1].trim().toLowerCase(); // "ok" o "ko"
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
  
  // Seleziona casualmente 2 parole per ciascuna categoria
  let selectedOk = getRandomElements(okWords, 2);
  let selectedKo = getRandomElements(koWords, 2);
  let selected = [...selectedOk, ...selectedKo];
  // Mischia l'array per un ordine casuale
  shuffleArray(selected);
  
  // Popola le opzioni nella pagina
  let optionsContainer = document.getElementById("options-container");
  // Pulisce il container se necessario
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
  // Se il bottone è già stato cliccato, esce
  if (btn.disabled) return;
  
  let clickTime = new Date().getTime();
  let elapsed = clickTime - startTime;
  let result = btn.getAttribute("data-result");
  
  console.log(`Bottone "${btn.textContent}" cliccato a ${elapsed}ms - risultato previsto: ${result}`);
  
  // Se l'utente clicca dopo 14 secondi e il risultato è "ok": colore verde, altrimenti rosso
  if (elapsed >= 14000 && result === "ok") {
    btn.style.backgroundColor = "green";
    btn.classList.add("correct");
  } else {
    btn.style.backgroundColor = "red";
  }
  btn.disabled = true; // disabilita il bottone dopo il click
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
  loadCSV();
};
