// Initialize Firebase (make sure you have this configured)
// Your Firebase config should be imported or initialized here

// Game state
let gameState = {
    board: [],
    words: [],
    foundWords: [],
    score: 0
  };
  
  // Sample crossword data
  const crosswordData = {
    words: [
      { word: "HELLO", clue: "A common greeting", startRow: 0, startCol: 0, direction: "across" },
      { word: "WORLD", clue: "The planet we live on", startRow: 1, startCol: 0, direction: "down" },
      { word: "GAME", clue: "Activity for fun", startRow: 0, startCol: 2, direction: "down" },
      { word: "FIRE", clue: "Hot flames", startRow: 2, startCol: 0, direction: "across" }
    ],
    size: 5
  };
  
  // Initialize the game board
  function initializeBoard() {
    const board = Array(crosswordData.size).fill().map(() => 
      Array(crosswordData.size).fill().map(() => ({
        letter: '',
        isWord: false,
        isFound: false
      }))
    );
  
    // Place words on the board
    crosswordData.words.forEach(wordObj => {
      const { word, startRow, startCol, direction } = wordObj;
      
      for (let i = 0; i < word.length; i++) {
        const row = direction === 'across' ? startRow : startRow + i;
        const col = direction === 'across' ? startCol + i : startCol;
        
        if (row < crosswordData.size && col < crosswordData.size) {
          board[row][col].letter = word[i];
          board[row][col].isWord = true;
        }
      }
    });
  
    gameState.board = board;
    gameState.words = crosswordData.words;
  }
  
  // Render the board to the DOM
  function renderBoard() {
    const boardElement = document.getElementById('crossword-board');
    boardElement.innerHTML = '';
    
    // Set grid columns based on board size
    boardElement.className = `grid grid-cols-${crosswordData.size} gap-1`;
    
    gameState.board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell w-12 h-12 flex items-center justify-center border border-gray-300 font-bold';
        
        if (cell.isWord) {
          cellElement.classList.add('bg-blue-100');
          cellElement.textContent = cell.letter;
        } else {
          cellElement.classList.add('bg-gray-200');
        }
        
        cellElement.addEventListener('click', () => handleCellClick(rowIndex, colIndex));
        boardElement.appendChild(cellElement);
      });
    });
  }
  
  // Handle cell clicks
  function handleCellClick(row, col) {
    // Implement your cell click logic here
    // For now, just mark the cell as found if it's part of a word
    if (gameState.board[row][col].isWord && !gameState.board[row][col].isFound) {
      gameState.board[row][col].isFound = true;
      gameState.score += 10;
      updateScore();
      renderBoard();
      checkWordCompletion();
    }
  }
  
  // Check if any words are fully completed
  function checkWordCompletion() {
    gameState.words.forEach(wordObj => {
      const { word, startRow, startCol, direction } = wordObj;
      let isComplete = true;
      
      for (let i = 0; i < word.length; i++) {
        const row = direction === 'across' ? startRow : startRow + i;
        const col = direction === 'across' ? startCol + i : startCol;
        
        if (!gameState.board[row][col].isFound) {
          isComplete = false;
          break;
        }
      }
      
      if (isComplete && !gameState.foundWords.includes(word)) {
        gameState.foundWords.push(word);
        gameState.score += 50; // Bonus for completing a word
        updateScore();
      }
    });
  }
  
  // Update score display
  function updateScore() {
    document.getElementById('userScore').textContent = `Sua Pontuação: ${gameState.score}`;
  }
  
  // Start the game
  function startGame() {
    initializeBoard();
    renderBoard();
    gameState.score = 0;
    gameState.foundWords = [];
    updateScore();
    
    // Initialize Firebase if needed
    // firebase.initializeApp(firebaseConfig);
  }
  
  // Event listener for the start button
  document.getElementById('startBtn').addEventListener('click', startGame);
  
  // Your existing Firebase functions (keep these)
  const saveUserScore = async (score, gameId) => {
    const user = firebase.auth().currentUser;
  
    if (user) {
      try {
        await firebase.firestore().collection("users").doc(user.uid).set({
          username: user.email,
          score: score,
          game_id: gameId
        }, { merge: true });
        console.log("Pontuação salva com sucesso!");
      } catch (error) {
        console.error("Erro ao salvar a pontuação:", error);
      }
    } else {
      console.log("Usuário não autenticado.");
    }
  };
  
  const updateHighScore = async (score, gameId) => {
    try {
      const highScoreDoc = await firebase.firestore().collection("high_scores").doc(gameId).get();
  
      if (highScoreDoc.exists) {
        const highScore = highScoreDoc.data().score;
  
        if (score > highScore) {
          await firebase.firestore().collection("high_scores").doc(gameId).set({
            score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log("Novo high-score global!");
        }
      } else {
        await firebase.firestore().collection("high_scores").doc(gameId).set({
          score: score,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("High-score global criado!");
      }
    } catch (error) {
      console.error("Erro ao atualizar high-score:", error);
    }
  };
  
  const displayScores = async (gameId) => {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
        const userScore = userDoc.exists ? userDoc.data().score : 0;
  
        const highScoreDoc = await firebase.firestore().collection("high_scores").doc(gameId).get();
        const highScore = highScoreDoc.exists ? highScoreDoc.data().score : 0;
  
        document.getElementById("userScore").textContent = `Sua Pontuação: ${userScore}`;
        document.getElementById("highScore").textContent = `High-Score Global: ${highScore}`;
      } catch (error) {
        console.error("Erro ao exibir pontuação:", error);
      }
    }
  };
  
  // Initialize scores display when page loads
  window.addEventListener('DOMContentLoaded', () => {
    displayScores("crossword");
  });
