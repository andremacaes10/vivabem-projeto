// Game state
const gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    score: 0,
    timer: 0,
    timerInterval: null,
    isPlaying: false
};

// Card pairs (8 pairs = 16 cards)
const cardValues = [
    '🐶', '🐱', '🐭', '🐹', 
    '🐰', '🦊', '🐻', '🐼',
    '🐶', '🐱', '🐭', '🐹', 
    '🐰', '🦊', '🐻', '🐼'
];

// Initialize game
function initGame() {
    // Reset game state
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.moves = 0;
    gameState.score = 0;
    gameState.isPlaying = true;
    
    // Clear timer if running
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState.timer = 0;
    updateTimer();
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    // Shuffle cards
    const shuffledCards = [...cardValues].sort(() => Math.random() - 0.5);
    
    // Create card objects
    gameState.cards = shuffledCards.map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
    }));
    
    renderBoard();
    updateDisplay();
    displayScores("memory");
}

// Render game board
function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card h-20 flex items-center justify-center text-3xl cursor-pointer';
        
        if (card.isFlipped || card.isMatched) {
            cardElement.textContent = card.value;
            cardElement.classList.add('flipped', 'bg-purple-100');
        } else {
            cardElement.classList.add('bg-purple-600', 'text-purple-600');
        }
        
        if (!card.isMatched) {
            cardElement.addEventListener('click', () => flipCard(card.id));
        }
        
        board.appendChild(cardElement);
    });
}

// Flip a card
function flipCard(cardId) {
    if (!gameState.isPlaying || 
        gameState.flippedCards.length >= 2 || 
        gameState.cards[cardId].isFlipped || 
        gameState.cards[cardId].isMatched) {
        return;
    }
    
    // Flip the card
    gameState.cards[cardId].isFlipped = true;
    gameState.flippedCards.push(cardId);
    renderBoard();
    
    // Check for match when two cards are flipped
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateDisplay();
        
        const [firstId, secondId] = gameState.flippedCards;
        const firstCard = gameState.cards[firstId];
        const secondCard = gameState.cards[secondId];
        
        if (firstCard.value === secondCard.value) {
            // Match found
            firstCard.isMatched = true;
            secondCard.isMatched = true;
            gameState.matchedPairs++;
            
            // Calculate score: base 100 + bonus for quick matches
            const timeBonus = Math.max(0, 30 - Math.floor(gameState.timer / 5)) * 5;
            gameState.score += 100 + timeBonus;
            
            gameState.flippedCards = [];
            updateDisplay();
            renderBoard();
            
            // Check if game is complete
            if (gameState.matchedPairs === cardValues.length / 2) {
                endGame();
            }
        } else {
            // No match - flip back after delay
            setTimeout(() => {
                firstCard.isFlipped = false;
                secondCard.isFlipped = false;
                gameState.flippedCards = [];
                renderBoard();
            }, 1000);
        }
    }
}

// End the game
function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);
    
    // Completion bonus based on time and moves
    const timeBonus = Math.max(0, 60 - gameState.timer) * 5;
    const moveBonus = Math.max(0, 20 - gameState.moves) * 10;
    gameState.score += 200 + timeBonus + moveBonus;
    
    updateDisplay();
    
    // Save scores
    saveUserScore(gameState.score, "memory");
    updateHighScore(gameState.score, "memory");
    displayScores("memory");
    
    // Show congratulations
    setTimeout(() => {
        alert(`Parabéns! Você completou o jogo em ${gameState.timer} segundos com ${gameState.moves} movimentos. Pontuação: ${gameState.score}`);
    }, 500);
}

// Update display
function updateDisplay() {
    document.getElementById('moves').textContent = `Movimentos: ${gameState.moves}`;
    document.getElementById('matches').textContent = `Pares: ${gameState.matchedPairs}/${cardValues.length/2}`;
    document.getElementById('userScore').textContent = `Sua Pontuação: ${gameState.score}`;
}

// Update timer
function updateTimer() {
    if (gameState.isPlaying) {
        gameState.timer++;
        const minutes = Math.floor(gameState.timer / 60).toString().padStart(2, '0');
        const seconds = (gameState.timer % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }
}

// Firebase functions
async function saveUserScore(score, gameId) {
    const user = firebase.auth().currentUser;
    
    try {
        if (user) {
            await firebase.firestore().collection("users").doc(user.uid).set({
                username: user.email,
                score: score,
                game_id: gameId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } else {
            await firebase.firestore().collection("users").doc(`guest-${Date.now()}`).set({
                username: "Convidado",
                score: score,
                game_id: gameId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Erro ao salvar pontuação:", error);
    }
}

async function updateHighScore(score, gameId) {
    try {
        const docRef = firebase.firestore().collection("high_scores").doc(gameId);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists || score > docSnap.data().score) {
            await docRef.set({
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Erro ao atualizar high-score:", error);
    }
}

async function displayScores(gameId) {
    try {
        // Get user score
        let userScore = 0;
        const user = firebase.auth().currentUser;
        if (user) {
            const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
            userScore = userDoc.exists ? userDoc.data().score || 0 : 0;
        }
        
        // Get high score
        const highScoreDoc = await firebase.firestore().collection("high_scores").doc(gameId).get();
        const highScore = highScoreDoc.exists ? highScoreDoc.data().score || 0 : 0;
        
        // Update UI
        document.getElementById('userScore').textContent = `Sua Pontuação: ${userScore}`;
        document.getElementById('highScore').textContent = `High-Score Global: ${highScore}`;
    } catch (error) {
        console.error("Erro ao exibir pontuações:", error);
    }
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', initGame);

// Initialize scores on page load
document.addEventListener('DOMContentLoaded', () => {
    displayScores("memory");
});