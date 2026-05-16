// js/battle.js - Multiplayer battle logic with usernames

// Battle state
let battleState = {
  roomId: null,
  isHost: false,
  opponentName: null,
  myName: null,
  challenge: null,
  myCode: '',
  opponentCode: null,
  opponentSubmitted: false,
  mySubmitted: false,
  timer: null,
  timeLeft: 60,
  battleActive: false
};

// Get username from input or generate default
function getUsername() {
  let username = document.getElementById('username-input').value.trim();
  if (!username) {
    const adjectives = ['Vibe', 'Code', 'Swift', 'Lucky', 'Neon', 'Shadow', 'Pixel', 'Rapid'];
    const nouns = ['Coder', 'Wizard', 'Master', 'Ninja', 'Hero', 'Vibester', 'Dev', 'Ghost'];
    username = adjectives[Math.floor(Math.random() * adjectives.length)] + 
               nouns[Math.floor(Math.random() * nouns.length)] +
               Math.floor(Math.random() * 100);
    document.getElementById('username-input').value = username;
  }
  return username;
}

// Validate username
function isUsernameValid() {
  const username = document.getElementById('username-input').value.trim();
  if (!username) {
    logBattle('⚠️ Please enter a username before starting!', 'warn');
    return false;
  }
  if (username.length < 2) {
    logBattle('⚠️ Username must be at least 2 characters!', 'warn');
    return false;
  }
  if (username.length > 20) {
    logBattle('⚠️ Username cannot exceed 20 characters!', 'warn');
    return false;
  }
  return true;
}

// Generate random name for opponent
function generateRandomName() {
  const adjectives = ['Vibe', 'Code', 'Swift', 'Lucky', 'Neon', 'Shadow', 'Pixel', 'Rapid', 'Turbo', 'Flash'];
  const nouns = ['Coder', 'Wizard', 'Master', 'Ninja', 'Hero', 'Vibester', 'Dev', 'Ghost', 'Lord', 'Queen'];
  return adjectives[Math.floor(Math.random() * adjectives.length)] + 
         nouns[Math.floor(Math.random() * nouns.length)];
}

// Create a new battle room
async function createBattle() {
  if (!isUsernameValid()) return;
  
  const username = getUsername();
  battleState.myName = username;
  battleState.isHost = true;
  battleState.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  battleState.challenge = await getRandomChallenge();
  
  document.getElementById('room-code').textContent = battleState.roomId;
  document.getElementById('room-info').style.display = 'block';
  document.getElementById('join-section').style.display = 'none';
  document.getElementById('battle-arena').style.display = 'block';
  document.getElementById('your-name').textContent = username;
  document.getElementById('challenge-prompt').textContent = battleState.challenge;
  document.getElementById('opponent-name').textContent = 'Waiting for opponent...';
  document.getElementById('waiting-opponent-name').textContent = 'opponent';
  
  listenForOpponent();
  
  logBattle(`✨ Battle room created! Your username: "${username}"`, 'ok');
  logBattle(`📋 Share room code: ${battleState.roomId} with your opponent`, 'ai');
}

// Join an existing battle
async function joinBattle() {
  if (!isUsernameValid()) return;
  
  const roomId = document.getElementById('opponent-id').value.trim().toUpperCase();
  if (!roomId) {
    logBattle('⚠️ Please enter a room code!', 'err');
    return;
  }
  
  const username = getUsername();
  battleState.myName = username;
  battleState.roomId = roomId;
  battleState.isHost = false;
  
  battleState.challenge = await getRandomChallenge();
  
  document.getElementById('join-section').style.display = 'none';
  document.getElementById('battle-arena').style.display = 'block';
  document.getElementById('your-name').textContent = username;
  document.getElementById('challenge-prompt').textContent = battleState.challenge;
  
  logBattle(`⚔️ Joined room ${roomId} as "${username}"!`, 'ok');
  
  setTimeout(() => {
    battleState.opponentName = generateRandomName();
    document.getElementById('opponent-name').textContent = battleState.opponentName;
    logBattle(`👤 Connected to opponent: "${battleState.opponentName}"`, 'ok');
    startBattle();
  }, 2000);
}

// Get random challenge
async function getRandomChallenge() {
  const challenges = [
    "Build a counter app with increment, decrement, and reset buttons. Use HTML, CSS, and JavaScript.",
    "Create a to-do list app where users can add and delete tasks. Style it nicely.",
    "Build a simple calculator that can add, subtract, multiply, and divide two numbers.",
    "Create a color palette generator that shows 5 random colors when a button is clicked.",
    "Build a simple quiz app with 3 questions about programming. Show score at the end.",
    "Create a digital clock that updates every second and shows date and time.",
    "Build a simple weather card that displays fake weather data (temperature, condition, location).",
    "Create a tip calculator that calculates tip amount and total per person.",
    "Build a simple notes app where users can add and delete notes.",
    "Create a random quote generator that fetches quotes from an array and displays them."
  ];
  
  try {
    const prompt = `Generate a unique, creative coding challenge for a 1-minute vibe coding battle. 
    The challenge should be simple enough to implement in 1 minute but fun. 
    Return ONLY the challenge text, no explanations. Keep it under 200 characters.`;
    
    const challenge = await callGemini('You are a coding challenge generator.', prompt);
    return challenge.substring(0, 500);
  } catch(e) {
    return challenges[Math.floor(Math.random() * challenges.length)];
  }
}

// Start the battle
function startBattle() {
  battleState.battleActive = true;
  battleState.timeLeft = 60;
  battleState.mySubmitted = false;
  battleState.opponentSubmitted = false;
  
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('timer').textContent = '01:00';
  document.getElementById('timer').classList.remove('warning');
  
  battleState.timer = setInterval(() => {
    if (!battleState.battleActive) return;
    
    battleState.timeLeft--;
    const minutes = Math.floor(battleState.timeLeft / 60);
    const seconds = battleState.timeLeft % 60;
    document.getElementById('timer').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (battleState.timeLeft <= 10) {
      document.getElementById('timer').classList.add('warning');
    }
    
    if (battleState.timeLeft <= 0) {
      endBattle();
    }
  }, 1000);
  
  logBattle(`🏁 Battle started! You have 60 seconds!`, 'ok');
  logBattle(`🎯 Challenge: ${battleState.challenge.substring(0, 100)}...`, 'ai');
}

// Ask AI for help
async function askAI() {
  const prompt = document.getElementById('ai-prompt').value.trim();
  if (!prompt) return;
  
  const currentCode = document.getElementById('battle-code').value;
  
  logBattle(`🤖 Asking AI: "${prompt}"`, 'ai');
  
  const systemPrompt = `You are an AI assistant for a vibe coding battle. 
  Help the user generate or modify code for this challenge: ${battleState.challenge}
  
  RULES:
  - Output ONLY code, no explanations
  - Keep code simple and working
  - Use HTML/CSS/JavaScript`;
  
  const userPrompt = `Current code:\n${currentCode}\n\nUser request: ${prompt}\n\nGenerate the updated code. Return ONLY the complete HTML/JS/CSS.`;
  
  try {
    const response = await callGemini(systemPrompt, userPrompt);
    document.getElementById('battle-code').value = response;
    logBattle('✓ AI generated code! Review and submit if ready.', 'ok');
  } catch(e) {
    logBattle('✗ AI error: ' + e.message, 'err');
  }
  
  document.getElementById('ai-prompt').value = '';
}

// Submit solution
async function submitSolution() {
  if (battleState.mySubmitted) {
    logBattle('You already submitted!', 'warn');
    return;
  }
  
  battleState.myCode = document.getElementById('battle-code').value;
  battleState.mySubmitted = true;
  document.getElementById('submit-btn').disabled = true;
  
  logBattle(`✅ "${battleState.myName}" submitted solution! Waiting for opponent...`, 'ok');
  document.getElementById('opponent-status').innerHTML = `
    <div class="status-indicator waiting"></div>
    <span>Waiting for ${battleState.opponentName || 'opponent'} to submit...</span>
  `;
  
  simulateOpponentSubmission();
}

// Simulate opponent submission
function simulateOpponentSubmission() {
  const delay = 10000 + Math.random() * 40000;
  
  setTimeout(() => {
    if (!battleState.opponentSubmitted && battleState.battleActive) {
      battleState.opponentSubmitted = true;
      battleState.opponentCode = generateMockSolution();
      
      document.getElementById('opponent-status').innerHTML = `
        <div class="status-indicator done"></div>
        <span>${battleState.opponentName || 'Opponent'} submitted! Judging both solutions...</span>
      `;
      
      judgeBattle();
    }
  }, delay);
}

// Generate mock solution
function generateMockSolution() {
  return `<!DOCTYPE html>
<html>
<head><title>Solution</title><style>
body { font-family: system-ui; padding: 20px; background: #f0f0f0; }
.container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
button:hover { background: #005bb5; }
</style></head>
<body>
<div class="container">
<h1>${battleState.opponentName || 'Opponent'}'s Solution</h1>
<p>Challenge: ${battleState.challenge.substring(0, 80)}...</p>
<button onclick="alert('Working solution!')">Click Me</button>
<p>This is a ${battleState.challenge.length > 100 ? 'complex' : 'simple'} implementation.</p>
</div>
</body>
</html>`;
}

// Judge the battle
async function judgeBattle() {
  clearInterval(battleState.timer);
  battleState.battleActive = false;
  
  logBattle('⚖️ Judging both solutions...', 'ai');
  document.getElementById('submit-btn').disabled = true;
  
  const judgePrompt = `You are a judge for a vibe coding battle.

Challenge given: "${battleState.challenge}"

=== PLAYER 1 (${battleState.myName}) SOLUTION ===
${battleState.myCode}

=== PLAYER 2 (${battleState.opponentName || 'Opponent'}) SOLUTION ===
${battleState.opponentCode || 'No code submitted'}

Evaluate both solutions on:
1. Correctness (does it meet the challenge requirements?)
2. Code quality (clean, readable, efficient)
3. Creativity (unique approach, styling)

Return a JSON object with:
{
  "winner": "Player 1" or "Player 2" or "Tie",
  "score1": 0-100,
  "score2": 0-100,
  "feedback1": "Brief feedback for ${battleState.myName}",
  "feedback2": "Brief feedback for ${battleState.opponentName || 'Opponent'}",
  "reasoning": "Why this winner was chosen"
}

Only return the JSON, no other text.`;

  try {
    const result = await callGemini('You are a code battle judge.', judgePrompt);
    const parsed = JSON.parse(result);
    displayResults(parsed);
  } catch(e) {
    logBattle('✗ Judging error: ' + e.message, 'err');
    displayResults({
      winner: 'Tie',
      score1: 50,
      score2: 50,
      feedback1: 'Well played! The code shows good effort.',
      feedback2: 'Well played! The code shows good effort.',
      reasoning: 'Technical issue with judge AI. Both players played well!'
    });
  }
}

// Display results
function displayResults(results) {
  document.getElementById('results').style.display = 'block';
  document.getElementById('opponent-status').style.display = 'none';
  
  const isWinner = results.winner === 'Player 1';
  const isTie = results.winner === 'Tie';
  
  const winnerText = isWinner ? '🏆 YOU WIN!' : 
                     isTie ? '🤝 TIE!' : 
                     '💔 YOU LOSE!';
  
  const winnerColor = isWinner ? 'var(--accent3)' :
                      isTie ? 'var(--warning)' :
                      'var(--error)';
  
  document.getElementById('judge-output').innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; color: ${winnerColor};">${winnerText}</div>
      <div style="font-size: 24px; margin-top: 10px;">
        ${battleState.myName}: ${results.score1} | ${battleState.opponentName || 'Opponent'}: ${results.score2}
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4>🎯 Feedback for ${battleState.myName}:</h4>
      <p>${results.feedback1}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4>👤 Feedback for ${battleState.opponentName || 'Opponent'}:</h4>
      <p>${results.feedback2}</p>
    </div>
    
    <div style="background: var(--surface); padding: 15px; border-radius: 8px;">
      <h4>⚖️ Judge's Reasoning:</h4>
      <p>${results.reasoning}</p>
    </div>
  `;
}

// End battle due to timeout
function endBattle() {
  if (battleState.battleActive) {
    battleState.battleActive = false;
    clearInterval(battleState.timer);
    
    if (!battleState.mySubmitted) {
      logBattle('⏰ Time\'s up! Your solution has been auto-submitted.', 'warn');
      battleState.myCode = document.getElementById('battle-code').value || 'No code written';
      battleState.mySubmitted = true;
    }
    
    if (!battleState.opponentSubmitted) {
      battleState.opponentSubmitted = true;
      battleState.opponentCode = 'No code submitted in time';
    }
    
    judgeBattle();
  }
}

// Reset battle
function resetBattle() {
  location.reload();
}

// Listen for opponent
function listenForOpponent() {
  logBattle(`🎮 Waiting for opponent to join room ${battleState.roomId}...`, 'info');
  
  setTimeout(() => {
    if (battleState.isHost && !battleState.battleActive) {
      battleState.opponentName = generateRandomName();
      document.getElementById('opponent-name').textContent = battleState.opponentName;
      document.getElementById('waiting-opponent-name').textContent = battleState.opponentName;
      logBattle(`👤 "${battleState.opponentName}" joined the battle!`, 'ok');
      startBattle();
    }
  }, 5000 + Math.random() * 5000);
}

// Log to battle console
function logBattle(msg, type = 'info') {
  const outputArea = document.getElementById('output-area');
  if (!outputArea) return;
  
  const div = document.createElement('div');
  div.className = `output-line ${type}`;
  div.textContent = msg;
  outputArea.appendChild(div);
  outputArea.scrollTop = outputArea.scrollHeight;
}
