// js/battle.js - REAL MULTIPLAYER with WebSocket

// WebSocket connection
let socket = null;
let currentRoomId = null;
let isHost = false;
let battleActive = false;
let myName = '';
let opponentName = '';
let currentChallenge = '';
let myCode = '';
let battleTimer = null;
let timeLeft = 60;

// DOM elements
const joinSection = document.getElementById('join-section');
const battleArena = document.getElementById('battle-arena');
const usernameInput = document.getElementById('username-input');
const opponentIdInput = document.getElementById('opponent-id');
const roomInfo = document.getElementById('room-info');
const roomCodeDisplay = document.getElementById('room-code');
const yourNameDisplay = document.getElementById('your-name');
const opponentNameDisplay = document.getElementById('opponent-name');
const challengePrompt = document.getElementById('challenge-prompt');
const battleCode = document.getElementById('battle-code');
const submitBtn = document.getElementById('submit-btn');
const timerDisplay = document.getElementById('timer');
const opponentStatus = document.getElementById('opponent-status');
const resultsDiv = document.getElementById('results');
const judgeOutput = document.getElementById('judge-output');
const newBattleBtn = document.getElementById('new-battle-btn');

// Server URL - CHANGE THIS TO YOUR RENDER URL
const SERVER_URL = 'https://vibecoders-backend.onrender.com'; // Replace with your actual Render URL

// Load saved API keys from localStorage
function loadApiKeys() {
  const savedGeminiKey = localStorage.getItem('geminiApiKey');
  
  if (savedGeminiKey) {
    if (typeof state !== 'undefined') {
      state.geminiApiKey = savedGeminiKey;
    }
    window.geminiApiKey = savedGeminiKey;
    logBattle('✓ Gemini API key loaded', 'ok');
    return true;
  } else {
    logBattle('⚠️ No Gemini API key found. Please save keys in main editor first.', 'warn');
    return false;
  }
}

// Override callGemini to use localStorage key
const originalCallGemini = callGemini;
window.callGemini = async function(systemPrompt, userMessage) {
  if ((typeof state !== 'undefined' && !state.geminiApiKey) || !window.geminiApiKey) {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      if (typeof state !== 'undefined') state.geminiApiKey = savedKey;
      window.geminiApiKey = savedKey;
    } else {
      throw new Error('No Gemini API key. Please set it in the main editor first.');
    }
  }
  
  const apiKey = (typeof state !== 'undefined' && state.geminiApiKey) ? state.geminiApiKey : window.geminiApiKey;
  return originalCallGemini.call(this, systemPrompt, userMessage);
};

// Connect to WebSocket
function connectWebSocket() {
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5
  });
  
  socket.on('connect', () => {
    logBattle('✅ Connected to battle server!', 'ok');
  });
  
  socket.on('connect_error', (error) => {
    logBattle(`❌ Connection error: ${error.message}`, 'err');
  });
  
  socket.on('disconnect', () => {
    logBattle('❌ Disconnected from server', 'err');
    battleActive = false;
    if (battleTimer) clearInterval(battleTimer);
  });
  
  socket.on('opponent-joined', (data) => {
    const opponent = data.players.find(p => p.id !== socket.id);
    if (opponent) {
      opponentName = opponent.name;
      opponentNameDisplay.textContent = opponentName;
      logBattle(`👤 ${opponentName} joined the room!`, 'ok');
      
      if (isHost) {
        logBattle('🎮 You are the host. Click "Start Battle" when ready!', 'info');
        const startBtn = document.getElementById('start-battle-btn');
        if (startBtn) startBtn.style.display = 'flex';
      }
    }
  });
  
  socket.on('battle-started', (data) => {
    startBattleUI(data.timeLeft, data.challenge);
  });
  
  socket.on('timer-update', (data) => {
    timeLeft = data.timeLeft;
    updateTimerDisplay();
  });
  
  socket.on('opponent-submitted', (data) => {
    logBattle(`✅ ${data.name} submitted their solution!`, 'ok');
    opponentStatus.innerHTML = `
      <div class="status-indicator done"></div>
      <span>${opponentName} submitted! Judging...</span>
    `;
  });
  
  socket.on('battle-ended', (data) => {
    endBattleUI(data);
  });
  
  socket.on('opponent-disconnected', (data) => {
    logBattle(`⚠️ ${data.name} disconnected. Battle cancelled.`, 'err');
    battleActive = false;
    if (battleTimer) clearInterval(battleTimer);
    submitBtn.disabled = true;
  });
}

// Create battle room
async function createBattle() {
  const username = usernameInput.value.trim();
  if (!username) {
    logBattle('⚠️ Please enter a username!', 'warn');
    return;
  }
  if (!loadApiKeys()) return;
  
  myName = username;
  connectWebSocket();
  
  socket.emit('create-room', { username }, (response) => {
    if (response.success) {
      currentRoomId = response.roomId;
      isHost = true;
      currentChallenge = response.challenge;
      
      roomCodeDisplay.textContent = currentRoomId;
      roomInfo.style.display = 'block';
      joinSection.style.display = 'none';
      battleArena.style.display = 'block';
      yourNameDisplay.textContent = myName;
      challengePrompt.textContent = currentChallenge;
      opponentNameDisplay.textContent = 'Waiting for opponent...';
      
      logBattle(`✨ Battle room created! Room code: ${currentRoomId}`, 'ok');
      logBattle(`📋 Share this code with your opponent to join`, 'ai');
      logBattle(`⏳ Waiting for opponent to join...`, 'info');
    } else {
      logBattle(`❌ Failed to create room: ${response.error}`, 'err');
    }
  });
}

// Join battle room
async function joinBattle() {
  const username = usernameInput.value.trim();
  const roomId = opponentIdInput.value.trim().toUpperCase();
  
  if (!username) {
    logBattle('⚠️ Please enter a username!', 'warn');
    return;
  }
  if (!roomId) {
    logBattle('⚠️ Please enter a room code!', 'warn');
    return;
  }
  if (!loadApiKeys()) return;
  
  myName = username;
  connectWebSocket();
  
  socket.emit('join-room', { username, roomId }, (response) => {
    if (response.success) {
      currentRoomId = roomId;
      isHost = false;
      currentChallenge = response.challenge;
      opponentName = response.opponentName;
      
      joinSection.style.display = 'none';
      battleArena.style.display = 'block';
      yourNameDisplay.textContent = myName;
      opponentNameDisplay.textContent = opponentName;
      challengePrompt.textContent = currentChallenge;
      
      logBattle(`⚔️ Joined room ${roomId}! Waiting for host to start...`, 'ok');
    } else {
      logBattle(`❌ Failed to join: ${response.error}`, 'err');
    }
  });
}

// Start battle (host only)
function startBattle() {
  if (!isHost) {
    logBattle('Only the host can start the battle!', 'warn');
    return;
  }
  
  socket.emit('start-battle', {}, (response) => {
    if (!response.success) {
      logBattle(`❌ Failed to start: ${response.error}`, 'err');
    }
  });
}

// Start battle UI
function startBattleUI(initialTime, challenge) {
  battleActive = true;
  timeLeft = initialTime;
  currentChallenge = challenge;
  challengePrompt.textContent = challenge;
  submitBtn.disabled = false;
  
  const startBtn = document.getElementById('start-battle-btn');
  if (startBtn) startBtn.style.display = 'none';
  
  updateTimerDisplay();
  
  logBattle(`🏁 Battle started! You have 60 seconds!`, 'ok');
  logBattle(`🎯 Challenge: ${challenge.substring(0, 100)}...`, 'ai');
  
  opponentStatus.innerHTML = `
    <div class="status-indicator waiting"></div>
    <span>Waiting for ${opponentName} to submit...</span>
  `;
}

// Update timer display
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (timeLeft <= 10) {
    timerDisplay.classList.add('warning');
  }
}

// Submit solution
function submitSolution() {
  if (!battleActive) {
    logBattle('Battle is not active!', 'warn');
    return;
  }
  
  myCode = battleCode.value;
  if (!myCode.trim()) {
    logBattle('Please write some code before submitting!', 'warn');
    return;
  }
  
  socket.emit('submit-code', { code: myCode }, (response) => {
    if (response.success) {
      submitBtn.disabled = true;
      logBattle(`✅ Solution submitted! Waiting for ${opponentName}...`, 'ok');
      opponentStatus.innerHTML = `
        <div class="status-indicator waiting"></div>
        <span>Waiting for ${opponentName} to submit...</span>
      `;
    } else {
      logBattle(`❌ Failed to submit: ${response.error}`, 'err');
    }
  });
}

// End battle UI
function endBattleUI(data) {
  battleActive = false;
  if (battleTimer) clearInterval(battleTimer);
  
  const player1 = data.player1;
  const player2 = data.player2;
  const isPlayer1 = player1.name === myName;
  
  const myResult = isPlayer1 ? player1 : player2;
  const opponentResult = isPlayer1 ? player2 : player1;
  
  judgeBattleWithAPI(currentChallenge, myResult.code, opponentResult.code, myResult.name, opponentResult.name);
}

// Judge battle using Gemini API
async function judgeBattleWithAPI(challenge, myCode, opponentCode, myName, opponentName) {
  logBattle('⚖️ Sending solutions to judge...', 'ai');
  
  const judgePrompt = `You are a judge for a vibe coding battle.

Challenge given: "${challenge}"

=== PLAYER 1 (${myName}) SOLUTION ===
${myCode.substring(0, 3000)}

=== PLAYER 2 (${opponentName}) SOLUTION ===
${opponentCode.substring(0, 3000)}

Evaluate both solutions on:
1. Correctness (does it meet the challenge requirements?)
2. Code quality (clean, readable, efficient)
3. Creativity (unique approach, styling)

Return ONLY valid JSON. Do not include any other text.
Use this exact format:
{"winner": "Player 1 or Player 2 or Tie", "score1": 0-100, "score2": 0-100, "feedback1": "feedback for player 1", "feedback2": "feedback for player 2", "reasoning": "why this winner was chosen"}`;

  try {
    const result = await callGemini('You are a code battle judge. Return ONLY valid JSON.', judgePrompt);
    
    let cleanedResult = result.trim();
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(cleanedResult);
    displayResults(parsed, myName, opponentName);
  } catch(e) {
    logBattle('✗ Judging error: ' + e.message, 'err');
    displayResults({
      winner: 'Tie',
      score1: 50,
      score2: 50,
      feedback1: 'Thanks for playing! Good effort.',
      feedback2: 'Thanks for playing! Good effort.',
      reasoning: 'Both players participated well!'
    }, myName, opponentName);
  }
}

// Display results
function displayResults(results, myName, opponentName) {
  resultsDiv.style.display = 'block';
  opponentStatus.style.display = 'none';
  newBattleBtn.style.display = 'flex';
  
  const isWinner = results.winner === 'Player 1';
  const isTie = results.winner === 'Tie';
  
  const winnerText = isWinner ? '🏆 YOU WIN!' : 
                     isTie ? '🤝 TIE!' : 
                     '💔 YOU LOSE!';
  
  const winnerColor = isWinner ? 'var(--accent3)' :
                      isTie ? 'var(--warning)' :
                      'var(--error)';
  
  judgeOutput.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; color: ${winnerColor};">${winnerText}</div>
      <div style="font-size: 24px; margin-top: 10px;">
        ${myName}: ${results.score1} | ${opponentName}: ${results.score2}
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4>🎯 Feedback for ${myName}:</h4>
      <p>${results.feedback1}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h4>👤 Feedback for ${opponentName}:</h4>
      <p>${results.feedback2}</p>
    </div>
    
    <div style="background: var(--surface); padding: 15px; border-radius: 8px;">
      <h4>⚖️ Judge's Reasoning:</h4>
      <p>${results.reasoning}</p>
    </div>
  `;
}

// Reset battle
function resetBattle() {
  if (socket) socket.disconnect();
  location.reload();
}

// Ask AI for help
async function askAI() {
  const prompt = document.getElementById('ai-prompt').value.trim();
  if (!prompt) return;
  
  const currentCode = battleCode.value;
  
  logBattle(`🤖 Asking AI: "${prompt}"`, 'ai');
  
  const systemPrompt = `You are an AI assistant for a vibe coding battle. 
  Help the user generate or modify code for this challenge: ${currentChallenge}
  
  RULES:
  - Output ONLY code, no explanations
  - Keep code simple and working
  - Use HTML/CSS/JavaScript`;
  
  const userPrompt = `Current code:\n${currentCode}\n\nUser request: ${prompt}\n\nGenerate the updated code. Return ONLY the complete HTML/JS/CSS.`;
  
  try {
    const response = await callGemini(systemPrompt, userPrompt);
    battleCode.value = response;
    logBattle('✓ AI generated code! Review and submit if ready.', 'ok');
  } catch(e) {
    logBattle('✗ AI error: ' + e.message, 'err');
  }
  
  document.getElementById('ai-prompt').value = '';
}

// Setup code editor restrictions
function setupCodeEditorRestrictions() {
  const textarea = battleCode;
  if (!textarea) return;
  
  textarea.addEventListener('paste', (e) => {
    e.preventDefault();
    logBattle('❌ Manual code pasting is not allowed! Use AI Assist to generate code.', 'err');
  });
  
  textarea.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    logBattle('❌ Right-click is disabled. Use AI Assist to generate code.', 'err');
  });
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

// Initialize
setupCodeEditorRestrictions();
loadApiKeys();

// Make functions global
window.createBattle = createBattle;
window.joinBattle = joinBattle;
window.startBattle = startBattle;
window.submitSolution = submitSolution;
window.askAI = askAI;
window.resetBattle = resetBattle;
