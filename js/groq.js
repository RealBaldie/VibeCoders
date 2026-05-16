// js/groq.js - Calls secure backend proxy

async function callGroq(prompt, options = {}) {
  try {
    const response = await fetch(`${state.backendUrl}/api/groq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, options })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    
    return content.trim();
    
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Groq error: ${error.message}`);
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
