// js/gemini.js - Calls secure backend proxy

async function callGemini(systemPrompt, userMessage) {
  try {
    const response = await fetch(`${state.backendUrl}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt,
        userMessage,
        model: state.geminiModel
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    
    const usage = data?.usageMetadata;
    if (usage) {
      console.log(`Gemini usage - Prompt: ${usage.promptTokenCount}, Response: ${usage.candidatesTokenCount}`);
    }
    
    return text;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini error: ${error.message}`);
  }
}

// Build context for Gemini
async function buildGeminiContext() {
  const changeLog = state.getFullChangeLog?.() || [];
  if (changeLog.length === 0) return '';
  
  let context = '=== PROJECT EVOLUTION ===\n\n';
  for (const entry of changeLog) {
    context += `Change #${entry.id}: ${entry.request.summary}\n`;
    context += `→ ${entry.implementation.summary}\n\n`;
  }
  return context;
}
