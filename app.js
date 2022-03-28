import { wordList } from './words.js';

// backup array for testing
// const wordList = ['NUDEL'];

// set game size
let wordLength = 5;
let numTurns = 6;

// generate letter tile grid
const wordGrid = document.querySelector('#wordGrid');
for (let i = 0; i < numTurns; i++) {
    const row = document.createElement('div');
    row.classList.add('row');
    row.setAttribute('data-row', i)
    for (let j = 0; j < wordLength; j++) {
        const tile = document.createElement('div');
        tile.classList.add('letter');
        tile.setAttribute('id', `tile-${i}-${j}`);
        tile.setAttribute('data-row', i);
        tile.setAttribute('data-column', j);
        tile.addEventListener('click', () => {
            if (currentRow === i && !isGameWon) {
                currentTile = document.querySelector(`#tile-${i}-${j}`);
                for (let tile of tiles) {
                    tile.classList.remove('active');
                }
                currentTile.classList.add('active');
                currentCol = j;
            }
        })
        row.append(tile);
    }
    wordGrid.append(row);
}

const wordListVersion = '1.6';
const tiles = document.querySelectorAll('.letter');
const rows = document.querySelectorAll('.row');
const keys = document.querySelectorAll('.letter-key');
const enterKey = document.querySelector('#enter');
const backspaceKey = document.querySelector('#backspace');
const restartButton = document.querySelector('#restart');
const alertContainer = document.querySelector('.alerts');
const resetButton = document.querySelector('#reset');
const version = document.querySelector('#version');
version.innerHTML = wordListVersion;

// Modal Handling
const statsBtn = document.querySelector('#stats-btn');
const howtoBtn = document.querySelector('#howto-btn');
const settingsBtn = document.querySelector('#settings-btn');
const statsModal = document.querySelector('#stats');
const howtoModal = document.querySelector('#howto');
const settingsModal = document.querySelector('#settings');
const closeStats = document.querySelector('#closeStats');
const closeHowto = document.querySelector('#closeHowto');
const closeSettings = document.querySelector('#closeSettings');
const statsNums = document.querySelectorAll('.statsNum');
const statsDist = document.querySelector('#dist');

statsBtn.addEventListener('click', () => statsModal.style.display = 'block');
howtoBtn.addEventListener('click', () => howtoModal.style.display = 'block');
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
closeStats.addEventListener('click', () => statsModal.style.display = 'none');
closeHowto.addEventListener('click', () => howtoModal.style.display = 'none');
closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === statsModal) {
        statsModal.style.display = 'none';
    }
})

let gameStats = localStorage.getItem('gameStats')
    ? JSON.parse(localStorage.getItem('gameStats'))
    : {
        played: 0,
        won: 0,
        currStreak: 0,
        maxStreak: 0,
        solTurns: [0, 0, 0, 0, 0, 0]
      };

gameStats.solTurns.forEach((el, i) => {
    const stat = document.createElement('div');
    stat.innerHTML = `${i + 1}: <span class="statsDistFig">${el}</span>`;
    statsDist.append(stat);
})

const statsDistFigs = document.querySelectorAll('.statsDistFig');

const setStats = (res) => {
    if (res === 'win') {
        gameStats.played++;
        gameStats.won++;
        gameStats.currStreak++;
        if (gameStats.currStreak > gameStats.maxStreak) {
            gameStats.maxStreak = gameStats.currStreak;
        }
        gameStats.solTurns[turn]++;
    } else if (res === 'lose') {
        gameStats.played++;
        gameStats.currStreak = 0;
    }
    statsNums[0].innerText = gameStats.played;
    statsNums[1].innerText = `${Math.round(!gameStats.won ? 0 : gameStats.won / gameStats.played * 100)}%`;
    statsNums[2].innerText = gameStats.currStreak;
    statsNums[3].innerText = gameStats.maxStreak;
    statsDistFigs.forEach((fig, i) => {
        fig.innerText = gameStats.solTurns[i];
    })
    localStorage.setItem('gameStats', JSON.stringify(gameStats))
}

// CSS Calculations
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

// Basic game variables
let remainingWords = localStorage.getItem('remainingWords')
    ? JSON.parse(localStorage.getItem('remainingWords'))
    : wordList.slice();
let playedWords = [];
let triedLetters = [];
let currentLetters = [...Array(wordLength)];
let currentTile = "";
let solution = "";
let isGameOver = false;
let isGameWon = false;
let isAlert = false;
let turn = 0;
let currentRow = 0;
let currentCol = 0;

// Functions
const setupGame = () => {
    if (localStorage.getItem('wordListVersion') !== wordListVersion) {
        resetStorage();
        localStorage.setItem('wordListVersion', wordListVersion);
    }


    // clear all letter divs, enable keys, remove alerts
    for (let tile of tiles) {
        tile.innerText = "";
        tile.classList.remove('used', 'correct', 'contained');
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
    setStats();

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
    highlightActive();
};

const endTurn = () => {
    if (currentLetters.length === wordLength && wordList.includes(currentLetters.join(""))) {
        let currentAttempt = [...solution];

        // first Loop: Search for correct letters
        for (let i = 0; i < wordLength; i++) {
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
        for (let i = 0; i < wordLength; i++) {
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
            setStats('win');
            gameOver('win');
        }

        // push current letters to triedLetters and prepare for next turn
        for (let letter of currentLetters) {
            triedLetters.push(letter);
        }

        currentLetters = [...Array(wordLength)];
        turn++;
        if (turn > wordLength && isGameWon) {
            isGameOver = true;
            gameOver('win');
        } else if (turn > wordLength && !isGameWon) {
            isGameOver = true;
            setStats('lose');
            gameOver('lose');
        }
        currentRow++;
        currentCol = 0;
        highlightActive();
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

const resetStorage = () => {
    remainingWords = wordList.slice();
    playedWords = [];
    triedLetters = [];
    localStorage.clear();
}

const resetStats = () => {
    gameStats.played = 0;
    gameStats.won = 0;
    gameStats.currStreak = 0;
    gameStats.maxStreak = 0;
    gameStats.solTurns = [0, 0, 0, 0, 0, 0];
}

const resetGame = () => {
    resetStorage();
    resetStats();
    restartButton.removeEventListener('click', resetGame);
    restartButton.addEventListener('click', setupGame);
    setupGame();
};

const alertMsg = (msg = 'lose') => {
    if (msg === 'win') {
        alertContainer.innerHTML = `Geschafft, ${solution} ist richtig!`;
    } else if (msg === 'playThrough') {
        alertContainer.innerText = 'Gratulation, du hast alle Wörter gespielt!';
        restartButton.removeEventListener('click', setupGame);
        restartButton.addEventListener('click', resetGame);
    } else if (msg === 'wrongWord') {
        alertContainer.innerText = 'Wort nicht in Wortliste.';
    } else {
        alertContainer.innerHTML = `Oh je... Das Wort war ${solution}.`;
    }
    alertContainer.classList.add('alert');
    isAlert = true;
};

const removeAlert = () => {
    alertContainer.innerHTML = '<h1>Wolfgangs Wortspiel</h1>';
    alertContainer.classList.remove('alert');
    isAlert = false;
}

const highlightActive = (row = currentRow, col = currentCol) => {
    for (let tile of tiles) {
        tile.classList.remove('active');
    }
    if (!isGameWon) rows[row].children[col].classList.add('active');
}

function keyType() {
    if (currentCol < wordLength) {
        const attempt = this.innerText;
        currentLetters[currentCol] = attempt;
        rows[currentRow].children[currentCol].innerText = attempt;
        while (currentCol < wordLength - 1 && rows[currentRow].children[currentCol].innerText) {
            currentCol++
        }
        highlightActive()
        if (isAlert) {
            removeAlert();
        }
    }
}

// Event Listeners
for (let key of keys) {
    key.addEventListener('click', keyType);
};

enterKey.addEventListener('click', endTurn);

backspaceKey.addEventListener('click', () => {
    if (currentCol >= 0 && currentCol <= wordLength) {
        currentLetters[currentCol] = "";
        if (currentCol === 0 || rows[currentRow].children[currentCol].innerText) {
            rows[currentRow].children[currentCol].innerText = "";
        } else {
            currentCol--;
            rows[currentRow].children[currentCol].innerText = "";
        }
        if (isAlert) {
            removeAlert();
        }
        highlightActive();
    }

});

restartButton.addEventListener('click', setupGame);
resetButton.addEventListener('click', resetGame);

// Initialize Game
setupGame();