// js/state.js - Complete state management with changeLog

const state = {
  // Current code files
  files: {},
  activeFile: null,
  
  // Synchronized history (user request → implementation)
  changeLog: [],
  
  // UI state
  mode: 'step',
  retryCount: 0,
  lastError: null,
  lastPrompt: null,
  thinking: false,
  
  // API keys
  groqApiKey: '',
  geminiApiKey: '',
  
  // Helper methods
  getLastNRequestSummaries(n) {
    return this.changeLog.slice(-n).map(entry => entry.request.summary);
  },
  
  getLastNImplementationSummaries(n) {
    return this.changeLog.slice(-n).map(entry => entry.implementation.summary);
  },
  
  getAllRequestSummaries() {
    return this.changeLog.map(entry => entry.request.summary);
  },
  
  getAllImplementationSummaries() {
    return this.changeLog.map(entry => entry.implementation.summary);
  },
  
  getFullChangeLog() {
    return this.changeLog;
  },
  
  addChangeLogEntry(requestText, requestSummary, implementationSummary, filesModified) {
    const newId = this.changeLog.length + 1;
    this.changeLog.push({
      id: newId,
      timestamp: Date.now(),
      request: {
        text: requestText,
        summary: requestSummary
      },
      implementation: {
        summary: implementationSummary,
        filesModified: filesModified
      }
    });
    return newId;
  },
  
  clearAll() {
    this.files = {};
    this.activeFile = null;
    this.changeLog = [];
    this.retryCount = 0;
    this.lastError = null;
    this.lastPrompt = null;
  }
};
