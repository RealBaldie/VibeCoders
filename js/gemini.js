// js/gemini.js - Gemini API for code generation

async function callGemini(systemPrompt, userMessage) {
  if (!state.geminiApiKey) {
    throw new Error('No Gemini API key set. Add your Gemini key in settings.');
  }
  
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  
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
  
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': state.geminiApiKey,
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
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Gemini API key. Get one from aistudio.google.com/apikey');
    }
    if (response.status === 429) {
      throw new Error('Gemini rate limit: 2,000 requests/day. Try again tomorrow.');
    }
    throw new Error(`Gemini API error: ${msg}`);
  }
  
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('Empty response from Gemini');
  }
  
  // Log token usage for debugging
  const usage = data?.usageMetadata;
  if (usage) {
    console.log(`Gemini usage - Prompt: ${usage.promptTokenCount}, Response: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
  }
  
  return text;
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

// Generate code with Gemini
async function geminiGenerateCode(userPrompt, currentCode) {
  const context = await buildGeminiContext();
  
  const currentCodeStr = Object.entries(currentCode)
    .map(([name, code]) => `=== ${name} ===\n${code}\n`)
    .join('\n');
  
  const systemPrompt = `You are a code generation AI for VibeCode Editor.
Language: ${document.getElementById('lang-select').value}
Level: ${document.getElementById('level-select').value}
${state.mode === 'goal' ? 'BIG GOAL MODE: Generate complete features.' : 'STEP MODE: Make focused changes.'}

RULES:
- Output ONLY code blocks in format: \`\`\`filename.ext\n...code...\n\`\`\`
- Return ALL files that need to be created/modified
- No explanations outside code blocks
- Keep code working and complete`;

  const userMessage = `${context}

=== CURRENT CODE ===
${currentCodeStr}

=== NEW INSTRUCTION ===
${userPrompt}

Generate the updated code. Return ONLY code blocks.`;

  const response = await callGemini(systemPrompt, userMessage);
  
  // Parse files from response (reuse existing parseFilesFromResponse)
  const files = parseFilesFromResponse(response);
  return files;
}

// Detect which files changed between old and new
function detectModifiedFiles(oldFiles, newFiles) {
  const modified = [];
  const allFiles = new Set([...Object.keys(oldFiles), ...Object.keys(newFiles)]);
  
  for (const file of allFiles) {
    const oldContent = oldFiles[file] || '';
    const newContent = newFiles[file] || '';
    if (oldContent !== newContent) {
      modified.push(file);
    }
  }
  
  return modified;
}

// Create a readable diff summary for Groq B
function createDiffSummary(oldFiles, newFiles, modifiedFiles) {
  const diffs = [];
  
  for (const file of modifiedFiles) {
    const oldContent = oldFiles[file] || '(new file)';
    const newContent = newFiles[file] || '(deleted)';
    
    // Truncate to reasonable length
    const oldPreview = oldContent.length > 500 ? oldContent.substring(0, 500) + '...' : oldContent;
    const newPreview = newContent.length > 500 ? newContent.substring(0, 500) + '...' : newContent;
    
    diffs.push(`File: ${file}\nOLD:\n${oldPreview}\nNEW:\n${newPreview}`);
  }
  
  return diffs.join('\n\n');
}


// Compatibility alias for auto-fix
async function callClaude(systemPrompt, userMessage) {
  return callGemini(systemPrompt, userMessage);
}
