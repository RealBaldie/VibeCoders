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

  const system = `You are a code generator for VibeCode Editor. Generate starter code templates.
IMPORTANT: Output ONLY code blocks, no explanations. Use this exact format:
\`\`\`filename.ext
// code here
\`\`\`
Generate ${langInstructions}, ${levelDesc}.
The template should be a simple but complete working example (a to-do list, counter, or similar useful demo).`;

  try {
    const response = await callClaude(system, `Generate a starter ${lang} template at ${level} level.`);
    const files = parseFilesFromResponse(response);
    setFiles(files);
    addHistory(`[Template] ${lang} / ${level}`);
    log('✓ Template generated!', 'ok');
    log(`  Files: ${Object.keys(files).join(', ')}`, 'info');
    setStatus(`Template ready · ${Object.keys(files).length} file(s)`);
  } catch (e) {
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

  const { lang, level } = getLangContext();
  const fullPrompt = hint ? `${prompt}\n\nUser hint: ${hint}` : prompt;
  state.lastPrompt = fullPrompt;
  state.retryCount = 0;

  setThinking(true, 'writing code');
  clearLog();
  log(`✦ Processing: "${(prompt || 'retry').substring(0, 60)}…"`, 'ai');

  const currentCode = Object.entries(state.files)
    .map(([name, code]) => `\`\`\`${name}\n${code}\n\`\`\``)
    .join('\n\n');

  let conversationContext = '';
  if (state.conversationHistory.length > 0) {
    const lastExchanges = state.conversationHistory.slice(-4);
    conversationContext = '\n\nPrevious conversation:\n' +
      lastExchanges.map(msg => `${msg.role}: ${msg.content.substring(0, 300)}`).join('\n');
  }

  const modeContext = state.mode === 'goal'
    ? 'This is a BIG GOAL prompt. Implement the full feature, generating all necessary files.'
    : 'This is a STEP prompt. Make one focused change at a time.';

  const system = `You are a code generation AI inside VibeCode Editor.
Language: ${lang}, Level: ${level}.
${modeContext}
RULES:
- Output ONLY code blocks in format: \`\`\`filename.ext\n...code...\n\`\`\`
- Return ALL files (not just changed ones)
- No explanations, no prose — only code blocks
- Keep code working and complete`;

  const userMsg = currentCode
    ? `Current code:\n${currentCode}${conversationContext}\n\nInstruction: ${fullPrompt}`
    : `Instruction: ${fullPrompt}\nLanguage: ${lang}, Level: ${level}${conversationContext}`;

  try {
    const response = await callClaude(system, userMsg);

    state.conversationHistory.push(
      { role: 'user', content: fullPrompt.substring(0, 500) },
      { role: 'assistant', content: response.substring(0, 500) }
    );
    if (state.conversationHistory.length > 10) {
      state.conversationHistory = state.conversationHistory.slice(-10);
    }

    const files = parseFilesFromResponse(response);
    setFiles(files);
    addHistory(prompt || '[retry with hint]');
    promptInput.value = '';
    log('✓ Code updated!', 'ok');
    log(`  Files: ${Object.keys(files).join(', ')}`, 'info');
    log(`  Conversation history: ${state.conversationHistory.length / 2} exchanges`, 'info');
    setStatus('Code updated · ' + new Date().toLocaleTimeString());
    hideRetryPanel();
    document.getElementById('retry-label').classList.remove('visible');
    state.retryCount = 0;
  } catch (e) {
    log('✗ Error: ' + e.message, 'err');
    setStatus('Error');
    document.getElementById('status-dot').className = 'status-dot error';
  } finally {
    setThinking(false);
  }
}
