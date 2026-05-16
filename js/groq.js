// js/groq.js - Groq API calls for summarization

async function callGroq(prompt, options = {}) {
  if (!state.groqApiKey) {
    throw new Error('No Groq API key set. Add your Groq key in settings.');
  }
  
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const body = {
    model: options.model || 'groq/compound',  // or 'groq/compound-mini'
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options.max_tokens || 200,
    temperature: options.temperature || 0.3,
    top_p: 0.95,
  };
  
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.groqApiKey}`,
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }
  
  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const d = await response.json();
      msg = d?.error?.message || msg;
    } catch(_) {}
    
    if (response.status === 401) {
      throw new Error('Invalid Groq API key. Check your settings.');
    }
    if (response.status === 429) {
      throw new Error('Groq rate limit hit. Waiting 5 seconds...');
    }
    throw new Error(`Groq API error: ${msg}`);
  }
  
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from Groq');
  }
  
  return content.trim();
}

// Groq A: Text summarizer (request summarization)
async function groqSummarizeRequest(currentPrompt, previousSummaries) {
  const prompt = `You are a request summarizer. Given previous user requests and a new request, generate a ONE-SENTENCE summary of the new request.

Previous user requests (most recent last):
${previousSummaries.map((s, i) => `${i+1}. ${s}`).join('\n')}

New user request: "${currentPrompt}"

Generate a summary of this new request. Keep under 150 characters.
Format: "User requested [what they want]"

Summary:`;

  return await callGroq(prompt, { max_tokens: 150, temperature: 0.3 });
}

// Groq B: File change summarizer (implementation summarization)
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

  return await callGroq(prompt, { max_tokens: 150, temperature: 0.3 });
}
