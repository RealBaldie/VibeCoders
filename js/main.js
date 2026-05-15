// Handle iframe messages
window.addEventListener('message', (e) => {
  if (e.data?.type === 'log') log('  ' + e.data.msg, 'ok');
  else if (e.data?.type === 'warn') log('  ⚠ ' + e.data.msg, 'warn');
  else if (e.data?.type === 'error') {
    if (window._pendingRunResolve) {
      window._pendingRunResolve(e.data.msg);
      window._pendingRunResolve = null;
    } else {
      log('  ✗ ' + e.data.msg, 'err');
    }
  }
});

// Setup event listeners
document.getElementById('lang-select').addEventListener('change', updateTags);
document.getElementById('level-select').addEventListener('change', updateTags);
document.getElementById('prompt-input').addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    submitPrompt();
  }
});

document.getElementById('settings-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget && state.apiKey) {
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
setTimeout(() => document.getElementById('api-key-input').focus(), 100);
