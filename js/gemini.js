// js/gemini.js - Complete Gemini integration with backend proxy

// ============================================
// 🚀 CORE GEMINI API CALL
// ============================================

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
        model: state.geminiModel || 'gemini-2.5-flash'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    
    // Log token usage for debugging
    const usage = data?.usageMetadata;
    if (usage) {
      console.log(`Gemini (${state.geminiModel}) - Prompt: ${usage.promptTokenCount}, Response: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
    }
    
    return text;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini error: ${error.message}`);
  }
}

// ============================================
// 📝 PARSE FILES FROM GEMINI RESPONSE
// ============================================

function parseFilesFromResponse(text) {
  const files = {};
  const blockRegex = /```(\S+?)\n([\s\S]*?)```/g;
  let m;
  
  while ((m = blockRegex.exec(text)) !== null) {
    const lang = m[1];
    const code = m[2].trim();
    
    const nameMap = {
      javascript: 'script.js', js: 'script.js',
      python: 'main.py', py: 'main.py',
      html: 'index.html',
      css: 'style.css',
      jsx: 'App.jsx', react: 'App.jsx',
      json: 'config.json',
      md: 'README.md'
    };
    
    let filename;
    if (lang.includes('.')) {
      filename = lang;
    } else {
      filename = nameMap[lang.toLowerCase()] || lang + '.txt';
    }
    files[filename] = code;
  }
  
  // If no code blocks found, treat entire response as a single file
  if (Object.keys(files).length === 0) {
    const langSelect = document.getElementById('lang-select');
    const lang = langSelect ? langSelect.value : 'javascript';
    const nameMap2 = { 
      javascript: 'script.js', 
      python: 'main.py', 
      html: 'index.html', 
      react: 'App.jsx' 
    };
    files[nameMap2[lang] || 'code.txt'] = text.trim();
  }
  
  return files;
}

// ============================================
// 🏗️ BUILD CONTEXT FROM CHANGE LOG
// ============================================

async function buildGeminiContext() {
  const changeLog = state.getFullChangeLog();
  if (changeLog.length === 0) return '';
  
  let context = '=== PROJECT EVOLUTION ===\n\n';
  for (const entry of changeLog) {
    context += `Change #${entry.id}: ${entry.request.summary}\n`;
    context += `→ Implementation: ${entry.implementation.summary}\n`;
    if (entry.implementation.filesModified && entry.implementation.filesModified.length > 0) {
      context += `→ Files affected: ${entry.implementation.filesModified.join(', ')}\n`;
    }
    context += '\n';
  }
  
  return context;
}

// ============================================
// 💻 GENERATE CODE WITH GEMINI
// ============================================

async function geminiGenerateCode(userPrompt, currentCode) {
  // Get context from change log
  const context = await buildGeminiContext();
  
  // Format current code
  const currentCodeStr = Object.entries(currentCode)
    .map(([name, code]) => `=== ${name} ===\n${code}\n`)
    .join('\n');
  
  // Get UI settings
  const langSelect = document.getElementById('lang-select');
  const levelSelect = document.getElementById('level-select');
  const mode = state.mode || 'step';
  
  const language = langSelect ? langSelect.value : 'javascript';
  const level = levelSelect ? levelSelect.value : 'beginner';
  
  // Build system prompt
  const systemPrompt = `You are a code generation AI for VibeCode Editor.
Language: ${language}
Level: ${level}
${mode === 'goal' ? 'BIG GOAL MODE: Generate complete features.' : 'STEP MODE: Make focused changes.'}

RULES:
- Output ONLY code blocks in format: \`\`\`filename.ext\n...code...\n\`\`\`
- Return ALL files that need to be created or modified
- No explanations outside code blocks
- Keep code working and complete
- For HTML/CSS/JS, make sure it's a complete working example`;

  // Build user message
  const userMessage = `${context}

=== CURRENT CODE ===
${currentCodeStr || '(No existing code)'}

=== NEW INSTRUCTION ===
${userPrompt}

Generate the updated code. Return ONLY code blocks.`;

  // Call Gemini
  const response = await callGemini(systemPrompt, userMessage);
  
  // Parse files from response
  const files = parseFilesFromResponse(response);
  return files;
}

// ============================================
// 🔍 DETECT MODIFIED FILES
// ============================================

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

// ============================================
// 📊 CREATE DIFF SUMMARY FOR GROQ B
// ============================================

function createDiffSummary(oldFiles, newFiles, modifiedFiles) {
  const diffs = [];
  
  for (const file of modifiedFiles) {
    const oldContent = oldFiles[file] || '(new file)';
    const newContent = newFiles[file] || '(deleted)';
    
    // Truncate to reasonable length (500 chars each)
    const oldPreview = oldContent.length > 500 ? oldContent.substring(0, 500) + '...' : oldContent;
    const newPreview = newContent.length > 500 ? newContent.substring(0, 500) + '...' : newContent;
    
    diffs.push(`File: ${file}\nOLD:\n${oldPreview}\nNEW:\n${newPreview}`);
  }
  
  return diffs.join('\n\n');
}

// ============================================
// 🎯 GENERATE TEMPLATE (used by main editor)
// ============================================

async function generateTemplateWithGemini(language, level) {
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
  }[language];

  const systemPrompt = `You are a code generator. Generate starter code templates.
IMPORTANT: Output ONLY code blocks, no explanations. Use this exact format:
\`\`\`filename.ext
// code here
\`\`\`
Generate ${langInstructions}, ${levelDesc}.
The template should be a simple but complete working example (a to-do list, counter, or similar useful demo).`;

  const userMessage = `Generate a starter ${language} template at ${level} level.`;

  const response = await callGemini(systemPrompt, userMessage);
  const files = parseFilesFromResponse(response);
  return files;
}

// ============================================
// 🔧 HELPER: GET LANGUAGE CONTEXT
// ============================================

function getLangContext() {
  const langSelect = document.getElementById('lang-select');
  const levelSelect = document.getElementById('level-select');
  
  return {
    lang: langSelect ? langSelect.value : 'javascript',
    level: levelSelect ? levelSelect.value : 'beginner'
  };
}

async function callClaude(systemPrompt, userMessage) {
  return callGemini(systemPrompt, userMessage);
}

// ============================================
// 📚 EXPORTS (for use in other files)
// ============================================
// Fix for auto-fix.js
window.callClaude = callClaude;
// Make sure all functions are globally available
window.callGemini = callGemini;
window.parseFilesFromResponse = parseFilesFromResponse;
window.geminiGenerateCode = geminiGenerateCode;
window.detectModifiedFiles = detectModifiedFiles;
window.createDiffSummary = createDiffSummary;
window.generateTemplateWithGemini = generateTemplateWithGemini;
window.getLangContext = getLangContext;
window.buildGeminiContext = buildGeminiContext;
