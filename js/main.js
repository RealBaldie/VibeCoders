// js/main.js - Multi-key API management

// Render Gemini keys container
function renderGeminiKeys() {
  const container = document.getElementById('gemini-keys-container');
  if (!container) return;
  
  container.innerHTML = '';
  state.geminiApiKeys.forEach((key, index) => {
    const keyDiv = document.createElement('div');
    keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    keyDiv.innerHTML = `
      <input type="password" value="${key}" placeholder="AIza..." style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
        onchange="updateGeminiKey(${index}, this.value)">
      <button class="btn btn-danger" onclick="removeGeminiKey(${index})" style="padding:4px 8px;font-size:10px;">✕</button>
    `;
    container.appendChild(keyDiv);
  });
  
  // Add empty fields if less than 10
  for (let i = state.geminiApiKeys.length; i < 10 && i < state.geminiApiKeys.length + 3; i++) {
    const keyDiv = document.createElement('div');
    keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    keyDiv.innerHTML = `
      <input type="password" placeholder="New Gemini API key (AIza...)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
        onchange="addNewGeminiKey(this.value)">
      <button style="padding:4px 8px;font-size:10px;visibility:hidden;">✕</button>
    `;
    container.appendChild(keyDiv);
  }
}

// Render Groq keys container
function renderGroqKeys() {
  const container = document.getElementById('groq-keys-container');
  if (!container) return;
  
  container.innerHTML = '';
  state.groqApiKeys.forEach((key, index) => {
    const keyDiv = document.createElement('div');
    keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    keyDiv.innerHTML = `
      <input type="password" value="${key}" placeholder="gsk_..." style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
        onchange="updateGroqKey(${index}, this.value)">
      <button class="btn btn-danger" onclick="removeGroqKey(${index})" style="padding:4px 8px;font-size:10px;">✕</button>
    `;
    container.appendChild(keyDiv);
  });
  
  // Add empty fields if less than 10
  for (let i = state.groqApiKeys.length; i < 10 && i < state.groqApiKeys.length + 3; i++) {
    const keyDiv = document.createElement('div');
    keyDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    keyDiv.innerHTML = `
      <input type="password" placeholder="New Groq API key (gsk_...)" style="flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:11px;" 
        onchange="addNewGroqKey(this.value)">
      <button style="padding:4px 8px;font-size:10px;visibility:hidden;">✕</button>
    `;
    container.appendChild(keyDiv);
  }
}

// Key management functions
function updateGeminiKey(index, value) {
  if (value && value.startsWith('AIza')) {
    state.geminiApiKeys[index] = value;
    state.saveToLocalStorage();
    log(`✓ Gemini key ${index + 1} updated`, 'ok');
  }
}

function updateGroqKey(index, value) {
  if (value && value.startsWith('gsk_')) {
    state.groqApiKeys[index] = value;
    state.saveToLocalStorage();
    log(`✓ Groq key ${index + 1} updated`, 'ok');
  }
}

function addNewGeminiKey(value) {
  if (value && value.startsWith('AIza') && state.geminiApiKeys.length < 10) {
    state.geminiApiKeys.push(value);
    state.saveToLocalStorage();
    renderGeminiKeys();
    log(`✓ Added Gemini key ${state.geminiApiKeys.length}/10`, 'ok');
  }
}

function addNewGroqKey(value) {
  if (value && value.startsWith('gsk_') && state.groqApiKeys.length < 10) {
    state.groqApiKeys.push(value);
    state.saveToLocalStorage();
    renderGroqKeys();
    log(`✓ Added Groq key ${state.groqApiKeys.length}/10`, 'ok');
  }
}

function removeGeminiKey(index) {
  state.removeGeminiKey(index);
  renderGeminiKeys();
  log(`✓ Removed Gemini key ${index + 1}`, 'ok');
}

function removeGroqKey(index) {
  state.removeGroqKey(index);
  renderGroqKeys();
  log(`✓ Removed Groq key ${index + 1}`, 'ok');
}

function addGeminiKeyField() {
  // Just focus the first empty field
  const inputs = document.querySelectorAll('#gemini-keys-container input');
  for (const input of inputs) {
    if (!input.value) {
      input.focus();
      return;
    }
  }
  log('⚠️ Maximum 10 Gemini keys allowed', 'warn');
}

function addGroqKeyField() {
  const inputs = document.querySelectorAll('#groq-keys-container input');
  for (const input of inputs) {
    if (!input.value) {
      input.focus();
      return;
    }
  }
  log('⚠️ Maximum 10 Groq keys allowed', 'warn');
}

function changeGeminiModel() {
  const select = document.getElementById('gemini-model-select');
  if (select) {
    state.geminiModel = select.value;
    state.saveToLocalStorage();
    log(`✓ Gemini model changed to ${select.options[select.selectedIndex].text}`, 'ok');
  }
}

function saveAllApiKeys() {
  // Keys are already saved via individual updates
  // Just close modal and show status
  document.getElementById('settings-modal').style.display = 'none';
  document.getElementById('btn-submit').disabled = false;
  document.getElementById('btn-template').disabled = false;
  
  const geminiCount = state.geminiApiKeys.length;
  const groqCount = state.groqApiKeys.length;
  
  log(`✓ Load balancing ready!`, 'ok');
  log(`  Gemini: ${geminiCount} key(s) - ${state.geminiModel}`, 'info');
  log(`  Groq: ${groqCount} key(s) - auto-rotating on rate limits`, 'info');
  setStatus(`API keys set · ${geminiCount} Gemini · ${groqCount} Groq`);
  document.getElementById('status-dot').className = 'status-dot active';
}

function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';
  renderGeminiKeys();
  renderGroqKeys();
  
  // Set model select to current value
  const select = document.getElementById('gemini-model-select');
  if (select) {
    select.value = state.geminiModel;
  }
  
  document.getElementById('gemini-keys-container').scrollIntoView({ behavior: 'smooth' });
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
  if (e.target === e.currentTarget && (state.geminiApiKeys.length > 0 || state.groqApiKeys.length > 0)) {
    e.currentTarget.style.display = 'none';
  }
});

// Initialize
updateTags();
document.getElementById('status-dot').className = 'status-dot';
document.getElementById('btn-submit').disabled = true;
document.getElementById('btn-template').disabled = true;
document.getElementById('btn-run').disabled = true;
document.getElementById('btn-download').disabled = true;

// Show settings modal if no keys are saved
if (state.geminiApiKeys.length === 0 && state.groqApiKeys.length === 0) {
  setTimeout(() => openSettings(), 100);
} else {
  // Enable buttons if keys exist
  if (state.geminiApiKeys.length > 0 && state.groqApiKeys.length > 0) {
    document.getElementById('btn-submit').disabled = false;
    document.getElementById('btn-template').disabled = false;
  }
}
