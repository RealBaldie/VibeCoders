function showRetryPanel() {
  document.getElementById('retry-panel').classList.add('visible');
}

function hideRetryPanel() {
  document.getElementById('retry-panel').classList.remove('visible');
  document.getElementById('retry-input').value = '';
}

async function autoFix(error) {
  state.retryCount++;
  const label = document.getElementById('retry-label');
  label.textContent = `Auto-fix attempt ${state.retryCount}/3`;
  label.classList.add('visible');

  if (state.retryCount > 3) {
    log('✗ 3 auto-fix attempts failed.', 'err');
    log('  Please provide a hint below.', 'warn');
    showRetryPanel();
    return;
  }

  state.lastError = error;
  setThinking(true, `auto-fixing (attempt ${state.retryCount}/3)`);

  const currentCode = Object.entries(state.files)
    .map(([name, code]) => `\`\`\`${name}\n${code}\n\`\`\``)
    .join('\n\n');

  const system = `You are a bug-fixing AI. Fix the runtime error in the code.
RULES:
- Output ONLY code blocks: \`\`\`filename.ext\n...code...\n\`\`\`
- Return ALL files
- Fix the specific error mentioned
- No explanations`;

  try {
    const response = await callClaude(system,
      `Error: ${error}\n\nCurrent code:\n${currentCode}\n\nFix this error. Return all files.`
    );
    const files = parseFilesFromResponse(response);
    setFiles(files);
    log(`✓ Auto-fix ${state.retryCount} applied. Re-running…`, 'ok');
    setThinking(false);
    await new Promise(r => setTimeout(r, 500));
    await runCode();
  } catch (e) {
    log('✗ Auto-fix failed: ' + e.message, 'err');
    setThinking(false);
  }
}

async function submitRetry() {
  const hint = document.getElementById('retry-input').value.trim();
  if (!hint) return;
  hideRetryPanel();
  state.retryCount = 0;
  await submitPrompt(hint);
}
