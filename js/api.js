async function callClaude(systemPrompt, userMessage) {
  if (!state.apiKey) throw new Error('No API key set. Click the ⚙ settings button to add your Groq API key.');
  
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const body = {
    model: 'groq/compound',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 8192,
    temperature: 0.7,
    top_p: 0.95,
  };
  
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new Error('Network error — check your internet connection and try again.');
  }
  
  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const d = await response.json();
      msg = d?.error?.message || msg;
    } catch (_) { }
    
    if (response.status === 401) throw new Error('Invalid API key. Click ⚙ to update your Groq key.');
    if (response.status === 429) throw new Error('Rate limit hit. Groq free tier: 30 requests/min, 10,000/day. Wait a moment.');
    if (response.status === 400) throw new Error(`Bad request: ${msg}`);
    throw new Error(`API error: ${msg}`);
  }
  
  const data = await response.json();
  const message = data?.choices?.[0]?.message?.content;
  
  if (!message) throw new Error('Empty response from Groq. Try again.');
  return message;
}

function saveApiKey() {
  const input = document.getElementById('api-key-input');
  const key = input.value.trim();
  if (!key || key.length < 10) {
    input.style.borderColor = 'var(--error)';
    input.placeholder = 'Enter your Groq API key…';
    return;
  }
  state.apiKey = key;
  document.getElementById('settings-modal').style.display = 'none';
  document.getElementById('btn-submit').disabled = false;
  document.getElementById('btn-template').disabled = false;
  log('✓ Groq API key saved. Ready to vibe!', 'ok');
  setStatus('API key set · Ready');
  document.getElementById('status-dot').className = 'status-dot active';
}
