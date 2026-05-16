// js/state.js - Frontend only, no API keys!

const state = {
  files: {},
  activeFile: null,
  history: [],
  changeLog: [],
  mode: 'step',
  retryCount: 0,
  lastError: null,
  lastPrompt: null,
  thinking: false,
  
  // Backend proxy URL - CHANGE THIS TO YOUR DEPLOYED URL
  backendUrl: 'https://vibecoders-backend2.onrender.com',
  
  geminiModel: 'gemini-2.5-flash',
  
  clearAll() {
    this.files = {};
    this.activeFile = null;
    this.history = [];
    this.changeLog = [];
    this.retryCount = 0;
    this.lastError = null;
    this.lastPrompt = null;
  }
};
