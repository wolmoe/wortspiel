import { wordList } from './words.js';

// const wordList = ['NUDEL'];

const letters = document.querySelectorAll('.letter');
const rows = document.querySelectorAll('.row');
const keys = document.querySelectorAll('.letter-key');
const enterKey = document.querySelector('#enter');
const backspaceKey = document.querySelector('#backspace');
const restartButton = document.querySelector('#restart');
const alertContainer = document.querySelector('.alerts');

// To Do:
// Prüfen, ob Sieg auf letzten Zug beim letzten Wort des Arrays den richtigen Alert auslöst
// Reload der Seite löscht das Wort und zieht automatisch ein neues. Idee:
    // push solution to localStorage.
    // on page load check if solution is filled.
    // If solution, use the current wordList
    // else take new one from remainingWords

// Weitere Ideen: 
// local Storage für Statistiken nutzen

// CSS Calculations
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

// Basic game variables
let remainingWords = localStorage.getItem('remainingWords')
    ? JSON.parse(localStorage.getItem('remainingWords'))
    : wordList.slice();
let playedWords = [];
let triedLetters = [];
let currentLetters = [];
let solution = "";
let isGameOver = false;
let isGameWon = false;
let turn = 0;
let currentRow = 0;
let currentCol = 0;

// Functions
const setupGame = () => {
    // clear all letter divs, enable keys, remove alerts
    for (let letter of letters) {
        letter.innerText = "";
        letter.classList.remove('used', 'correct', 'contained');
    }
    for (let key of keys) {
        key.disabled = false;
        key.classList.remove('used', 'correct', 'contained');
    }
    enterKey.disabled = false;
    backspaceKey.disabled = false;
    alertContainer.innerHTML = '<h1>Wolfgangs Wortspiel</h1>';
    alertContainer.classList.remove('alert');
    isGameOver = false;
    isGameWon = false;
    turn = 0;
    currentRow = 0;
    currentCol = 0;


    // If remaining words array still contains words, randomly pick one
    if (remainingWords.length > 0 && !localStorage.getItem('solution')) {
        let rand = Math.floor(Math.random() * remainingWords.length);
        solution = remainingWords[rand];
        localStorage.setItem('solution', JSON.stringify(solution));
        remainingWords.splice(rand, 1);
        localStorage.setItem('remainingWords', JSON.stringify(remainingWords));
    } else if (remainingWords.length > 0 && localStorage.getItem('solution')) {
        solution = JSON.parse(localStorage.getItem('solution'));
    } else {
        alertMsg('playThrough');
    }
};

const endTurn = () => {
    if (currentLetters.length === 5 && wordList.includes(currentLetters.join(""))) {
        let currentAttempt = [...solution];

        // first Loop: Search for correct letters
        for (let i = 0; i < 5; i++) {
            if (currentAttempt[i] === currentLetters[i]) {
                rows[currentRow].children[i].classList.add('correct');
                for (let key of keys) {
                    if (currentLetters[i] === key.innerText) {
                        key.classList.add('correct');
                    }
                }
                currentAttempt[i] = "";
            }
        }

        // Second loop: Search for contained letters
        for (let i = 0; i < 5; i++) {
            if (currentAttempt.includes(currentLetters[i])) {
                rows[currentRow].children[i].classList.add('contained');
                currentAttempt[currentAttempt.indexOf(currentLetters[i])] = "";
                for (let key of keys) {
                    if (currentLetters[i] === key.innerText) key.classList.add('contained');
                }
            } else {
                rows[currentRow].children[i].classList.add('used');
                for (let key of keys) {
                    if (currentLetters[i] === key.innerText) key.classList.add('used');
                }
            }
        }
        if (currentLetters.every((letter, i) => letter === [...solution][i])) {
            isGameWon = true;
            playedWords.push(solution);
            gameOver('win');
        }

        // push current letters to triedLetters and prepare for next turn
        for (let letter of currentLetters) {
            triedLetters.push(letter);
        }

        currentLetters = [];
        turn++;
        if (turn > 5 && isGameWon) {
            isGameOver = true;
            gameOver('win');
        } else if (turn > 5 && !isGameWon) {
            isGameOver = true;
            gameOver('lose');
        }
        currentRow++;
        currentCol = 0;
    } else {
        alertMsg('wrongWord');
    }
};

const gameOver = (result = 'lose') => {
    for (let key of keys) {
        key.disabled = true;
    }
    enterKey.disabled = true;
    backspaceKey.disabled = true;
    localStorage.removeItem('solution');
    if (remainingWords.length === 0) {
        alertMsg('playThrough');
    } else if (result === 'win') {
        alertMsg('win');
    } else {
        alertMsg('lose');
    }
};

const resetGame = () => {
    remainingWords = wordList.slice();
    playedWords = [];
    triedLetters = [];
    restartButton.innerText = 'NEUES SPIEL';
    localStorage.clear();
    restartButton.removeEventListener('click', resetGame);
    restartButton.addEventListener('click', setupGame);
    setupGame();
};

const alertMsg = (msg = 'lose') => {
    if (msg === 'win') {
        alertContainer.innerHTML = `Geschafft, ${solution} ist richtig!`;
    } else if (msg === 'playThrough') {
        alertContainer.innerText = 'Gratulation, du hast alle Wörter gespielt!';
        restartButton.innerText = 'RESET';
        restartButton.removeEventListener('click', setupGame);
        restartButton.addEventListener('click', resetGame);
    } else if (msg === 'wrongWord') {
        alertContainer.innerText = 'Wort nicht in Wortliste.';
    } else {
        alertContainer.innerHTML = `Oh je... Das Wort war ${solution}.`;
    }
    alertContainer.classList.add('alert');
};

// Event Listeners
for (let key of keys) {
    key.addEventListener('click', function () {
        if (currentCol < 5) {
            const attempt = this.innerText;
            currentLetters.push(attempt);
            rows[currentRow].children[currentCol].innerText = attempt;
            currentCol++;
        }
    });
};

enterKey.addEventListener('click', endTurn);

restartButton.addEventListener('click', setupGame);

backspaceKey.addEventListener('click', () => {
    if (currentCol > 0) {
        currentLetters.pop();
        currentCol--;
        rows[currentRow].children[currentCol].innerText = "";
        alertContainer.innerHTML = '<h1>Wolfgangs Wortspiel</h1>';
        alertContainer.classList.remove('alert');
    }

});

// Initialize Game
setupGame();