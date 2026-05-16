// js/prompt-handler.js - Handles user prompts using the pipeline

async function generateTemplate() {
  const { lang, level } = getLangContext();
  setThinking(true, 'generating template');
  clearLog();
  log('⚡ Generating starter template…', 'ai');

  const levelDesc = {
    beginner: 'with very simple code, lots of comments, and basic concepts only',
    intermediate: 'with clean code, some comments, and moderate complexity',
    professional: 'with clean production-ready code, best practices, no hand-holding comments',
  }[level];

  const langInstructions = {
    javascript: 'a JavaScript app (browser-based, no frameworks). Output files: index.html, script.js, style.css',
    python: 'a Python script. Output file: main.py',
    html: 'an HTML/CSS webpage. Output files: index.html, style.css',
    react: 'a React app (using CDN scripts in index.html, no build tool). Output files: index.html, App.jsx',
  }[lang];

  // For template generation, we bypass the pipeline and use Gemini directly
  const system = `You are a code generator. Generate starter code templates.
IMPORTANT: Output ONLY code blocks, no explanations. Use this exact format:
\`\`\`filename.ext
// code here
\`\`\`
Generate ${langInstructions}, ${levelDesc}.`;

  try {
    const response = await callGemini(system, `Generate a starter ${lang} template at ${level} level.`);
    const files = parseFilesFromResponse(response);
    setFiles(files);
    
    // Add initial changeLog entry
    state.addChangeLogEntry(
      `[Template] ${lang} / ${level}`,
      `User requested ${lang} ${level} level starter template`,
      `Generated starter template with files: ${Object.keys(files).join(', ')}`,
      Object.keys(files)
    );
    
    log('✓ Template generated!', 'ok');
    log(`  Files: ${Object.keys(files).join(', ')}`, 'info');
    setStatus(`Template ready · ${Object.keys(files).length} file(s)`);
  } catch(e) {
    log('✗ Error: ' + e.message, 'err');
    setStatus('Error generating template');
    document.getElementById('status-dot').className = 'status-dot error';
  } finally {
    setThinking(false);
  }
}

async function submitPrompt(hint = '') {
  const promptInput = document.getElementById('prompt-input');
  const prompt = promptInput.value.trim();
  if (!prompt && !hint) return;
  if (state.thinking) return;

  const fullPrompt = hint ? `${prompt}\n\nUser hint: ${hint}` : prompt;
  state.lastPrompt = fullPrompt;
  state.retryCount = 0;

  setThinking(true, 'running compression pipeline');
  clearLog();
  log(`✦ Processing: "${(prompt || 'retry').substring(0, 60)}…"`, 'ai');

  try {
    // Run the full compression pipeline
    const newFiles = await runCompressionPipeline(fullPrompt);
    
    // Success - clear input and reset state
    promptInput.value = '';
    log('✓ Code updated via compression pipeline!', 'ok');
    log(`  Files: ${Object.keys(newFiles).join(', ')}`, 'info');
    log(`  ChangeLog entries: ${state.changeLog.length} total`, 'info');
    setStatus(`Code updated · ${new Date().toLocaleTimeString()}`);
    hideRetryPanel();
    document.getElementById('retry-label').classList.remove('visible');
    state.retryCount = 0;
  } catch(e) {
    log('✗ Error: ' + e.message, 'err');
    setStatus('Error');
    document.getElementById('status-dot').className = 'status-dot error';
  } finally {
    setThinking(false);
  }
}

// Clear everything - reset state completely
async function clearEverything() {
  if (confirm('Clear all code, history, and changeLog? This cannot be undone.')) {
    state.clearAll();
    document.getElementById('prompt-history').innerHTML = '<div style="color:var(--text3);font-size:11px;padding:8px;font-family:var(--font-ui)">Your prompts will appear here…</div>';
    document.getElementById('code-empty').style.display = 'flex';
    document.getElementById('code-pre').style.display = 'none';
    document.getElementById('file-tabs').innerHTML = '';
    clearLog();
    log('✓ All data cleared (files, history, changeLog)', 'ok');
    log('  Generate a template or send a prompt to start fresh', 'info');
    setStatus('Ready - all cleared');
  }
}
