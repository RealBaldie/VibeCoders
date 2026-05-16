// js/main.js - Updated API key management

function saveApiKeys() {
  const geminiKey = document.getElementById('gemini-api-key').value.trim();
  const groqKey = document.getElementById('groq-api-key').value.trim();
  
  if (!geminiKey || geminiKey.length < 10) {
    log('❌ Please enter a valid Gemini API key (starts with AIza...)', 'err');
    return;
  }
  
  if (!groqKey || groqKey.length < 10) {
    log('❌ Please enter a valid Groq API key (starts with gsk_...)', 'err');
    return;
  }
  
  state.geminiApiKey = geminiKey;
  state.groqApiKey = groqKey;

  // saves keys for battle mode
  localStorage.setItem('geminiApiKey', geminiKey);
  localStorage.setItem('groqApiKey', groqKey);
  
  document.getElementById('settings-modal').style.display = 'none';
  document.getElementById('btn-submit').disabled = false;
  document.getElementById('btn-template').disabled = false;
  
  log('✓ Both API keys saved!', 'ok');
  log('  Gemini → Code generation (high quality)', 'info');
  log('  Groq → Text summarization (cheap & fast)', 'info');
  setStatus('API keys set · Ready to vibe');
  document.getElementById('status-dot').className = 'status-dot active';
}

function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';
  if (state.geminiApiKey) document.getElementById('gemini-api-key').value = state.geminiApiKey;
  if (state.groqApiKey) document.getElementById('groq-api-key').value = state.groqApiKey;
  document.getElementById('gemini-api-key').focus();
}

function clearHistory() {
  clearEverything();
}

// Event listeners
document.getElementById('lang-select').addEventListener('change', updateTags);
document.getElementById('level-select').addEventListener('change', updateTags);
document.getElementById('prompt-input').addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    submitPrompt();
  }
});

document.getElementById('settings-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget && (state.geminiApiKey || state.groqApiKey)) {
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
setTimeout(() => document.getElementById('gemini-api-key').focus(), 100);
