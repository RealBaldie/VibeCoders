async function callGemini(systemPrompt, userMessage) {
  if (!state.apiKey) throw new Error('No API key set. Add your Google Gemini API key.');
  
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  
  // Gemini uses a different message format
  const fullUserMessage = systemPrompt 
    ? `System: ${systemPrompt}\n\nUser: ${userMessage}`
    : userMessage;
  
  const body = {
    contents: [
      {
        parts: [
          { text: fullUserMessage }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
    }
  };
  
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': state.apiKey,
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new Error('Network error — check your connection');
  }
  
  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const d = await response.json();
      msg = d?.error?.message || msg;
    } catch(_) {}
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API key. Get one from aistudio.google.com/apikey');
    }
    if (response.status === 429) {
      throw new Error('Rate limit: 2,000 requests/day on free tier. Try again tomorrow.');
    }
    if (response.status === 400) {
      throw new Error(`Bad request: ${msg}`);
    }
    throw new Error(`API error: ${msg}`);
  }
  
  const data = await response.json();
  
  // Extract text from Gemini's response format
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  
  // Log usage for debugging (optional)
  const usage = data?.usageMetadata;
  if (usage) {
    console.log(`Gemini usage - Prompt: ${usage.promptTokenCount}, Response: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
  }
  
  return text;
}

// Keep the original callClaude function name for compatibility
async function callClaude(systemPrompt, userMessage) {
  return callGemini(systemPrompt, userMessage);
}

function saveApiKey() {
  const input = document.getElementById('api-key-input');
  const key = input.value.trim();
  if (!key || key.length < 10) {
    input.style.borderColor = 'var(--error)';
    input.placeholder = 'Enter your Gemini API key (starts with AIza)...';
    return;
  }
  state.apiKey = key;
  document.getElementById('settings-modal').style.display = 'none';
  document.getElementById('btn-submit').disabled = false;
  document.getElementById('btn-template').disabled = false;
  log('✓ Gemini API key saved. Ready to vibe!', 'ok');
  setStatus('API key set · Ready');
  document.getElementById('status-dot').className = 'status-dot active';
}
