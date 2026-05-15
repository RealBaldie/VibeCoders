function renderTabs() {
  const tabs = document.getElementById('file-tabs');
  tabs.innerHTML = '';
  for (const name of Object.keys(state.files)) {
    const t = document.createElement('div');
    t.className = 'file-tab' + (name === state.activeFile ? ' active' : '');
    t.innerHTML = `<span class="file-dot"></span>${name}`;
    t.onclick = () => switchFile(name);
    tabs.appendChild(t);
  }
}

function switchFile(name) {
  state.activeFile = name;
  renderTabs();
  showCode(state.files[name], name);
}

function showCode(code, filename = '') {
  const empty = document.getElementById('code-empty');
  const pre = document.getElementById('code-pre');
  const block = document.getElementById('code-block');
  if (!code) {
    empty.style.display = 'flex';
    pre.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  pre.style.display = 'block';

  const ext = filename.split('.').pop();
  const langMap = { js: 'javascript', jsx: 'javascript', py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown' };
  block.className = 'language-' + (langMap[ext] || 'javascript');
  block.textContent = code;
  hljs.highlightElement(block);
  document.getElementById('btn-run').disabled = false;
  document.getElementById('btn-download').disabled = false;
  document.getElementById('btn-submit').disabled = false;
}

function setFiles(files) {
  state.files = files;
  const keys = Object.keys(files);
  state.activeFile = keys[0] || null;
  renderTabs();
  if (state.activeFile) showCode(files[state.activeFile], state.activeFile);
}

function addHistory(prompt) {
  state.history.push({ prompt, code: { ...state.files } });
  const area = document.getElementById('prompt-history');
  if (state.history.length === 1) area.innerHTML = '';
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `<div class="hist-num">#${state.history.length}</div>${prompt.substring(0, 80)}${prompt.length > 80 ? '…' : ''}`;
  item.onclick = () => restoreHistory(state.history.length - 1);
  area.appendChild(item);
  area.scrollTop = area.scrollHeight;
}

function restoreHistory(idx) {
  const entry = state.history[idx];
  if (!entry) return;
  setFiles(entry.code);
  log(`↩ Restored version #${idx + 1}`, 'ai');
}

function clearHistory() {
  state.history = [];
  state.conversationHistory = [];
  document.getElementById('prompt-history').innerHTML = '<div style="color:var(--text3);font-size:11px;padding:8px;font-family:var(--font-ui)">Your prompts will appear here…</div>';
  log('✓ History cleared (including conversation context)', 'ok');
}

function parseFilesFromResponse(text) {
  const files = {};
  const blockRegex = /```(\S+?)\n([\s\S]*?)```/g;
  let m;
  while ((m = blockRegex.exec(text)) !== null) {
    const lang = m[1];
    const code = m[2].trim();
    const nameMap = {
      javascript: 'script.js', js: 'script.js',
      python: 'main.py', py: 'main.py',
      html: 'index.html',
      css: 'style.css',
      jsx: 'App.jsx', react: 'App.jsx',
      json: 'config.json',
    };
    let filename;
    if (lang.includes('.')) {
      filename = lang;
    } else {
      filename = nameMap[lang.toLowerCase()] || lang + '.txt';
    }
    files[filename] = code;
  }
  if (Object.keys(files).length === 0) {
    const { lang } = getLangContext();
    const nameMap2 = { javascript: 'script.js', python: 'main.py', html: 'index.html', react: 'App.jsx' };
    files[nameMap2[lang] || 'code.txt'] = text.trim();
  }
  return files;
}

async function downloadFiles() {
  if (!Object.keys(state.files).length) return;
  const zip = new JSZip();
  const folder = zip.folder('vibecode-project');
  for (const [name, code] of Object.entries(state.files)) {
    folder.file(name, code);
  }
  folder.file('README.md', `# VibeCode Project\n\nGenerated with VibeCode Editor.\n\nFiles:\n${Object.keys(state.files).map(f => '- ' + f).join('\n')}\n`);
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vibecode-project.zip';
  a.click();
  log('↓ Downloaded project zip', 'ok');
}
