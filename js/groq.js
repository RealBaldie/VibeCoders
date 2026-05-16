// js/groq.js - Groq API with multiple keys

async function callGroq(prompt, options = {}, retryCount = 0) {
  const currentKey = state.getCurrentGroqKey();
  if (!currentKey) {
    throw new Error('No Groq API key available. Please add at least one key in settings.');
  }
  
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const body = {
    model: options.model || 'groq/compound',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options.max_tokens || 200,
    temperature: options.temperature || 0.3,
    top_p: 0.95,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentKey}`,
      },
      body: JSON.stringify(body)
    });
    
    if (response.status === 429) {
      // Rate limit - try next key
      console.warn(`Groq key ${state.currentGroqIndex + 1} rate limited, switching to next key...`);
      state.currentGroqIndex = (state.currentGroqIndex + 1) % state.groqApiKeys.length;
      
      if (retryCount < state.groqApiKeys.length) {
        log(`⚠️ Switching to next Groq key (attempt ${retryCount + 2}/${state.groqApiKeys.length})`, 'warn');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return callGroq(prompt, options, retryCount + 1);
      } else {
        throw new Error('All Groq API keys rate limited. Try again later.');
      }
    }
    
    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try {
        const d = await response.json();
        msg = d?.error?.message || msg;
      } catch(_) {}
      
      if (response.status === 401) {
        // Invalid key - skip it
        state.currentGroqIndex = (state.currentGroqIndex + 1) % state.groqApiKeys.length;
        if (retryCount < state.groqApiKeys.length) {
          return callGroq(prompt, options, retryCount + 1);
        }
      }
      throw new Error(`Groq API error: ${msg}`);
    }
    
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from Groq');
    }
    
    return content.trim();
    
  } catch (e) {
    if (retryCount < state.groqApiKeys.length) {
      state.currentGroqIndex = (state.currentGroqIndex + 1) % state.groqApiKeys.length;
      return callGroq(prompt, options, retryCount + 1);
    }
    throw e;
  }
}

// Groq A: Text summarizer
async function groqSummarizeRequest(currentPrompt, previousSummaries) {
  const prompt = `You are a request summarizer. Given previous user requests and a new request, generate a ONE-SENTENCE summary of the new request.

Previous user requests (most recent last):
${previousSummaries.map((s, i) => `${i+1}. ${s}`).join('\n')}

New user request: "${currentPrompt}"

Generate a summary of this new request. Keep under 150 characters.
Format: "User requested [what they want]"

Summary:`;

  return await callGroq(prompt, { 
    model: 'groq/compound-mini',
    max_tokens: 150, 
    temperature: 0.3 
  });
}

// Groq B: File change summarizer
async function groqSummarizeImplementation(geminiChanges, previousImplementationSummaries, filesModified) {
  const prompt = `You are an implementation summarizer. Given the changes Gemini just made to code files, summarize what changed.

Previous implementation changes (most recent last):
${previousImplementationSummaries.map((s, i) => `${i+1}. ${s}`).join('\n')}

Gemini just generated these changes:
${geminiChanges}

Files modified: ${filesModified.join(', ')}

Generate a ONE-SENTENCE summary of what changed in this implementation.
Keep under 150 characters.
Format: "Modified [filename]: [what changed]"

Implementation summary:`;

  return await callGroq(prompt, { 
    model: 'groq/compound',
    max_tokens: 150, 
    temperature: 0.3 
  });
}
