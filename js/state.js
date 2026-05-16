// js/state.js - Complete state management

const state = {
  // Current code files
  files: {},
  activeFile: null,
  
  // UI history (for left panel display)
  history: [],
  
  // Synchronized AI context history
  changeLog: [],
  
  // UI state
  mode: 'step',
  retryCount: 0,
  lastError: null,
  lastPrompt: null,
  thinking: false,
  
  // Backend proxy URL - CHANGE THIS TO YOUR RENDER URL
  backendUrl: 'https://vibecoders-backend2.onrender.com',  // ← Update this!
  
  // Gemini model
  geminiModel: 'gemini-2.5-flash',
  
  // ============================================
  // 🔑 HELPER METHODS (These were missing!)
  // ============================================
  
  // Get last N request summaries from changeLog
  getLastNRequestSummaries(n) {
    return this.changeLog.slice(-n).map(entry => entry.request.summary);
  },
  
  // Get last N implementation summaries from changeLog
  getLastNImplementationSummaries(n) {
    return this.changeLog.slice(-n).map(entry => entry.implementation.summary);
  },
  
  // Get all request summaries
  getAllRequestSummaries() {
    return this.changeLog.map(entry => entry.request.summary);
  },
  
  // Get all implementation summaries
  getAllImplementationSummaries() {
    return this.changeLog.map(entry => entry.implementation.summary);
  },
  
  // Get full changeLog
  getFullChangeLog() {
    return this.changeLog;
  },
  
  // Add entry to changeLog
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
  
  // Clear all data
  clearAll() {
    this.files = {};
    this.activeFile = null;
    this.history = [];
    this.changeLog = [];
    this.retryCount = 0;
    this.lastError = null;
    this.lastPrompt = null;
  },
  
  // Save to localStorage (for user-added keys if any)
  saveToLocalStorage() {
    localStorage.setItem('userGeminiKeys', JSON.stringify(this.userGeminiKeys || []));
    localStorage.setItem('userGroqKeys', JSON.stringify(this.userGroqKeys || []));
    localStorage.setItem('geminiModel', this.geminiModel);
  },
  
  // Load from localStorage
  loadFromLocalStorage() {
    const savedModel = localStorage.getItem('geminiModel');
    if (savedModel) this.geminiModel = savedModel;
  }
};

// Initialize
state.loadFromLocalStorage();

// Make state global for debugging
window.state = state;
