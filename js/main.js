// js/main.js - Multi-key management with defaults

// Update key stats display
function updateKeyStats() {
  const stats = state.getKeyStats();
  const geminiSpan = document.getElementById('gemini-key-stats');
  const groqSpan = document.getElementById('groq-key-stats');
  
  if (geminiSpan) {
    geminiSpan.innerHTML = `${stats.gemini.total} total (${stats.gemini.default} default${stats.gemini.user ? ` + ${stats.gemini.user} yours` : ''})`;
  }
  if (groqSpan) {
    groqSpan.innerHTML = `${stats.groq.total} total (${stats.groq.default} default${stats.groq.user ? ` + ${stats.groq.user} yours` : ''})`;
  }
}

// Render user-added Gemini keys
function renderGeminiKeys() {
  const container = document.getElementById('gemini-keys-container');
  if (!container) return;
  
  container.innerHTML = '';
  state.userGeminiKeys.forEach((key, index) => {
    const keyDiv = document.createElement('div');
    keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    keyDiv.innerHTML = `
      <input type="password" value="${key}" placeholder="AIza..." style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
        onchange="updateGeminiKey(${index}, this.value)">
      <button class="btn btn-danger" onclick="removeGeminiKey(${index})" style="padding:4px 8px;font-size:10px;">✕</button>
    `;
    container.appendChild(keyDiv);
  });
}

// Render user-added Groq keys
function renderGroqKeys() {
  const container = document.getElementById('groq-keys-container');
  if (!container) return;
  
  container.innerHTML = '';
  state.userGroqKeys.forEach((key, index) => {
    const keyDiv = document.createElement('div');
    keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    keyDiv.innerHTML = `
      <input type="password" value="${key}" placeholder="gsk_..." style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
        onchange="updateGroqKey(${index}, this.value)">
      <button class="btn btn-danger" onclick="removeGroqKey(${index})" style="padding:4px 8px;font-size:10px;">✕</button>
    `;
    container.appendChild(keyDiv);
  });
}

// Update user Gemini key
function updateGeminiKey(index, value) {
  if (value && value.startsWith('AIza') && value !== state.userGeminiKeys[index]) {
    // Remove old key from main array
    const oldKey = state.userGeminiKeys[index];
    const mainIndex = state.geminiApiKeys.indexOf(oldKey);
    if (mainIndex > -1) state.geminiApiKeys[mainIndex] = value;
    
    // Update user array
    state.userGeminiKeys[index] = value;
    state.saveToLocalStorage();
    updateKeyStats();
    log(`✓ Updated your Gemini key ${index + 1}`, 'ok');
  }
}

// Update user Groq key
function updateGroqKey(index, value) {
  if (value && value.startsWith('gsk_') && value !== state.userGroqKeys[index]) {
    const oldKey = state.userGroqKeys[index];
    const mainIndex = state.groqApiKeys.indexOf(oldKey);
    if (mainIndex > -1) state.groqApiKeys[mainIndex] = value;
    
    state.userGroqKeys[index] = value;
    state.saveToLocalStorage();
    updateKeyStats();
    log(`✓ Updated your Groq key ${index + 1}`, 'ok');
  }
}

// Add new Gemini key
function addNewGeminiKey(value) {
  if (value && value.startsWith('AIza') && !state.userGeminiKeys.includes(value)) {
    if (state.addGeminiKey(value)) {
      renderGeminiKeys();
      updateKeyStats();
      log(`✓ Added your Gemini key (total: ${state.geminiApiKeys.length}/20 max)`, 'ok');
    } else {
      log('⚠️ Key already exists or invalid', 'warn');
    }
  }
}

// Add new Groq key
function addNewGroqKey(value) {
  if (value && value.startsWith('gsk_') && !state.userGroqKeys.includes(value)) {
    if (state.addGroqKey(value)) {
      renderGroqKeys();
      updateKeyStats();
      log(`✓ Added your Groq key (total: ${state.groqApiKeys.length}/20 max)`, 'ok');
    } else {
      log('⚠️ Key already exists or invalid', 'warn');
    }
  }
}

// Remove user Gemini key
function removeGeminiKey(index) {
  const key = state.userGeminiKeys[index];
  if (confirm(`Remove your Gemini key?`)) {
    state.removeGeminiKey(state.geminiApiKeys.indexOf(key));
    renderGeminiKeys();
    updateKeyStats();
    log(`✓ Removed your Gemini key`, 'ok');
  }
}

// Remove user Groq key
function removeGroqKey(index) {
  const key = state.userGroqKeys[index];
  if (confirm(`Remove your Groq key?`)) {
    state.removeGroqKey(state.groqApiKeys.indexOf(key));
    renderGroqKeys();
    updateKeyStats();
    log(`✓ Removed your Groq key`, 'ok');
  }
}

// Add empty field for new key
function addGeminiKeyField() {
  const container = document.getElementById('gemini-keys-container');
  const keyDiv = document.createElement('div');
  keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  keyDiv.innerHTML = `
    <input type="password" placeholder="New Gemini API key (AIza...)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
      onchange="addNewGeminiKey(this.value); this.parentElement.remove()">
    <button class="btn btn-ghost" onclick="this.parentElement.remove()" style="padding:4px 8px;font-size:10px;">✕</button>
  `;
  container.appendChild(keyDiv);
  keyDiv.querySelector('input').focus();
}

function addGroqKeyField() {
  const container = document.getElementById('groq-keys-container');
  const keyDiv = document.createElement('div');
  keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  keyDiv.innerHTML = `
    <input type="password" placeholder="New Groq API key (gsk_...)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
      onchange="addNewGroqKey(this.value); this.parentElement.remove()">
    <button class="btn btn-ghost" onclick="this.parentElement.remove()" style="padding:4px 8px;font-size:10px;">✕</button>
  `;
  container.appendChild(keyDiv);
  keyDiv.querySelector('input').focus();
}

// Change Gemini model
function changeGeminiModel() {
  const select = document.getElementById('gemini-model-select');
  if (select) {
    state.geminiModel = select.value;
    state.saveToLocalStorage();
    log(`✓ Gemini model changed to ${select.options[select.selectedIndex].text}`, 'ok');
  }
}

// Save and close settings
function saveAllApiKeys() {
  document.getElementById('settings-modal').style.display = 'none';
  document.getElementById('btn-submit').disabled = false;
  document.getElementById('btn-template').disabled = false;
  
  const stats = state.getKeyStats();
  log(`✓ Load balancing ready!`, 'ok');
  log(`  Gemini: ${stats.gemini.total} keys (${stats.gemini.default} default + ${stats.gemini.user} yours)`, 'info');
  log(`  Groq: ${stats.groq.total} keys (${stats.groq.default} default + ${stats.groq.user} yours)`, 'info');
  log(`  Keys rotate automatically on rate limits`, 'info');
  setStatus(`API ready · ${stats.gemini.total} Gemini · ${stats.groq.total} Groq`);
  document.getElementById('status-dot').className = 'status-dot active';
}

// Open settings modal
function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';
  renderGeminiKeys();
  renderGroqKeys();
  updateKeyStats();
  
  const select = document.getElementById('gemini-model-select');
  if (select) {
    select.value = state.geminiModel;
  }
}

// Clear history
function clearHistory() {
  clearEverything();
}

// Event listeners
document.getElementById('lang-select')?.addEventListener('change', updateTags);
document.getElementById('level-select')?.addEventListener('change', updateTags);
document.getElementById('prompt-input')?.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    submitPrompt();
  }
});

document.getElementById('settings-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.style.display = 'none';
  }
});

// Initialize
updateTags();
document.getElementById('status-dot').className = 'status-dot';
document.getElementById('btn-submit').disabled = false;  // Enabled by default now
document.getElementById('btn-template').disabled = false;
document.getElementById('btn-run').disabled = true;
document.getElementById('btn-download').disabled = true;

// Show welcome message with key stats
const stats = state.getKeyStats();
log(`🎉 VibeCode Editor Ready!`, 'ok');
log(`  🔑 Gemini: ${stats.gemini.total} keys loaded (${stats.gemini.default} default)`, 'info');
log(`  ⚡ Groq: ${stats.groq.total} keys loaded (${stats.groq.default} default)`, 'info');
log(`  💡 Click ⚙ to add your own keys as backup`, 'info');
