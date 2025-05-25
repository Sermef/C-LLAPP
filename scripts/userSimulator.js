// userSimulator.js

// Oggetto globale che simula l'utente collegato.
// Lo rendiamo globale (o lo esponiamo) in modo che script.js possa accedervi.
window.currentUser = {
    nickname: "CodingExplorer",
    level: 7,
    experiencePoints: 2100,
    sessionCode: null // Sarà generato qui
};

// Funzione per generare un codice sessione randomico (per scopi di debug simulati)
function generateSessionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Quando questo script viene caricato, inizializziamo il codice sessione.
window.currentUser.sessionCode = generateSessionCode();

// Funzione che script.js potrà chiamare per ottenere i dati dell'utente.
// Potrebbe anche contenere logica più complessa in futuro,
// come la simulazione di un "login" o il caricamento da "local storage".
function getSimulatedUser() {
    return window.currentUser;
}

// Possiamo anche esporre direttamente la funzione di generazione del codice sessione
// se volessimo che script.js potesse chiamarla per qualche motivo (es. reset).
window.generateDebugSessionCode = generateSessionCode;

// Nota: per applicazioni più complesse e modulari, si userebbero
// moduli ES6 (import/export), ma per ora 'window' è più semplice per iniziare.