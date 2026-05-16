// js/gemini.js - Gemini API with multiple keys and model selection

// Available Gemini models
const GEMINI_MODELS = {
  'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', context: '1M tokens', bestFor: 'Fast code generation' },
  'gemini-2.5-pro': { name: 'Gemini 2.5 Pro', context: '1M tokens', bestFor: 'Complex reasoning' },
  'gemini-2.0-flash': { name: 'Gemini 2.0 Flash', context: '1M tokens', bestFor: 'Fast, good quality' },
  'gemini-2.0-flash-lite': { name: 'Gemini 2.0 Flash Lite', context: '1M tokens', bestFor: 'Budget, fast' }
};

async function callGemini(systemPrompt, userMessage, retryCount = 0) {
  const currentKey = state.getCurrentGeminiKey();
  if (!currentKey) {
    throw new Error('No Gemini API key available. Please add at least one key in settings.');
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.geminiModel}:generateContent`;
  
  const fullUserMessage = systemPrompt 
    ? `System: ${systemPrompt}\n\nUser: ${userMessage}`
    : userMessage;
  
  const body = {
    contents: [
      {
        parts: [{ text: fullUserMessage }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': currentKey,
      },
      body: JSON.stringify(body)
    });
    
    if (response.status === 429 || response.status === 403) {
      // Rate limit or quota exceeded - try next key
      console.warn(`Gemini key ${state.currentGeminiIndex + 1} failed (${response.status}), switching to next key...`);
      state.currentGeminiIndex = (state.currentGeminiIndex + 1) % state.geminiApiKeys.length;
      
      if (retryCount < state.geminiApiKeys.length) {
        log(`⚠️ Switching to next Gemini key (attempt ${retryCount + 2}/${state.geminiApiKeys.length})`, 'warn');
        return callGemini(systemPrompt, userMessage, retryCount + 1);
      } else {
        throw new Error('All Gemini API keys exhausted or rate limited. Try again later.');
      }
    }
    
    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try {
        const d = await response.json();
        msg = d?.error?.message || msg;
      } catch(_) {}
      
      throw new Error(`Gemini API error: ${msg}`);
    }
    
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    
    const usage = data?.usageMetadata;
    if (usage) {
      console.log(`Gemini (${state.geminiModel}) - Prompt: ${usage.promptTokenCount}, Response: ${usage.candidatesTokenCount}`);
    }
    
    return text;
    
  } catch (e) {
    if (e.message.includes('API key') && retryCount < state.geminiApiKeys.length) {
      // Try next key on auth errors
      state.currentGeminiIndex = (state.currentGeminiIndex + 1) % state.geminiApiKeys.length;
      return callGemini(systemPrompt, userMessage, retryCount + 1);
    }
    throw e;
  }
}

// Build full context for Gemini from changeLog
async function buildGeminiContext() {
  const changeLog = state.getFullChangeLog();
  
  if (changeLog.length === 0) {
    return '';
  }
  
  let context = '=== PROJECT EVOLUTION ===\n\n';
  
  for (const entry of changeLog) {
    context += `Change #${entry.id} (User requested: "${entry.request.text.substring(0, 100)}")\n`;
    context += `→ Implementation: ${entry.implementation.summary}\n`;
    if (entry.implementation.filesModified.length > 0) {
      context += `→ Files affected: ${entry.implementation.filesModified.join(', ')}\n`;
    }
    context += '\n';
  }
  
  return context;
}

// Get available models list
function getGeminiModels() {
  return GEMINI_MODELS;
}

// Set current model
function setGeminiModel(modelId) {
  if (GEMINI_MODELS[modelId]) {
    state.geminiModel = modelId;
    state.saveToLocalStorage();
    return true;
  }
  return false;
}
