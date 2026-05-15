function setThinking(on, msg='generating code') {
  state.thinking = on;
  document.getElementById('thinking-overlay').classList.toggle('visible', on);
  document.getElementById('thinking-sub').textContent = msg;
  document.getElementById('status-dot').className = 'status-dot' + (on ? ' thinking' : ' active');
  document.getElementById('btn-submit').disabled = on;
  document.getElementById('btn-template').disabled = on;
}

function log(msg, type='info') {
  const area = document.getElementById('output-area');
  const div = document.createElement('div');
  div.className = 'output-line ' + type;
  div.textContent = msg;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function clearLog() {
  document.getElementById('output-area').innerHTML = '';
}

function setStatus(text) {
  document.getElementById('bottom-info').textContent = text;
}

function updateTags() {
  const lang = document.getElementById('lang-select').value;
  const level = document.getElementById('level-select').value;
  const names = { javascript:'JavaScript', python:'Python', html:'HTML/CSS', react:'React (JSX)' };
  document.getElementById('lang-tag').textContent = names[lang] || lang;
  document.getElementById('level-tag').textContent = level.charAt(0).toUpperCase() + level.slice(1);
}

function getLangContext() {
  const lang = document.getElementById('lang-select').value;
  const level = document.getElementById('level-select').value;
  return { lang, level };
}

function setMode(m) {
  state.mode = m;
  document.getElementById('mode-step').classList.toggle('active', m === 'step');
  document.getElementById('mode-goal').classList.toggle('active', m === 'goal');
}

function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';
  if (state.apiKey) document.getElementById('api-key-input').value = state.apiKey;
  document.getElementById('api-key-input').focus();
}
