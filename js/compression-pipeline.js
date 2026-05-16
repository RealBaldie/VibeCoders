// js/compression-pipeline.js - Orchestrates the entire flow

// Main pipeline: user prompt → summary → code → implementation summary
async function runCompressionPipeline(userPrompt) {
  log('🔄 Starting compression pipeline...', 'ai');
  
  // STEP 1: Groq A - Summarize the user request
  log('📝 Step 1/4: Summarizing request (Groq A)...', 'info');
  const last5Requests = state.getLastNRequestSummaries(5);
  const requestSummary = await groqSummarizeRequest(userPrompt, last5Requests);
  log(`✓ Request summary: "${requestSummary}"`, 'ok');
  
  // STEP 2: Gemini - Generate code
  log('🤖 Step 2/4: Generating code (Gemini)...', 'info');
  const oldFiles = { ...state.files };
  const newFiles = await geminiGenerateCode(userPrompt, state.files);
  
  if (Object.keys(newFiles).length === 0) {
    throw new Error('Gemini returned no files');
  }
  
  // Detect which files were modified
  const modifiedFiles = detectModifiedFiles(oldFiles, newFiles);
  log(`✓ Generated/Modified files: ${modifiedFiles.join(', ') || 'none'}`, 'ok');
  
  // STEP 3: Update files
  log('💾 Step 3/4: Updating files...', 'info');
  setFiles(newFiles);
  
  // STEP 4: Groq B - Summarize the implementation changes
  if (modifiedFiles.length > 0) {
    log('📝 Step 4/4: Summarizing implementation (Groq B)...', 'info');
    const last5Implementations = state.getLastNImplementationSummaries(5);
    const diffSummary = createDiffSummary(oldFiles, newFiles, modifiedFiles);
    const implementationSummary = await groqSummarizeImplementation(
      diffSummary,
      last5Implementations,
      modifiedFiles
    );
    log(`✓ Implementation summary: "${implementationSummary}"`, 'ok');
    
    // Add to changeLog
    state.addChangeLogEntry(userPrompt, requestSummary, implementationSummary, modifiedFiles);
    log(`📚 ChangeLog updated: ${state.changeLog.length} total entries`, 'ok');
  } else {
    // No files changed - still log the request but with empty implementation
    log('⚠️ No files were modified by Gemini', 'warn');
    state.addChangeLogEntry(userPrompt, requestSummary, 'No files changed (no action needed)', []);
  }
  
  log('✅ Compression pipeline complete!', 'ok');
  
  return newFiles;
}
