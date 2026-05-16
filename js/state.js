// js/state.js - NO KEYS IN FRONTEND

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
  
  // No keys stored here anymore!
  geminiModel: 'gemini-2.5-flash',
  
  // User-added keys (stored locally only)
  userGeminiKeys: [],
  userGroqKeys: [],
  
  // Backend proxy URL
  backendUrl: 'https://your-backend.onrender.com', // Your proxy server
  
  addGeminiKey(key) {
    if (key && !this.userGeminiKeys.includes(key)) {
      this.userGeminiKeys.push(key);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  },
  
  addGroqKey(key) {
    if (key && !this.userGroqKeys.includes(key)) {
      this.userGroqKeys.push(key);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  },
  
  removeGeminiKey(index) {
    this.userGeminiKeys.splice(index, 1);
    this.saveToLocalStorage();
  },
  
  removeGroqKey(index) {
    this.userGroqKeys.splice(index, 1);
    this.saveToLocalStorage();
  },
  
  saveToLocalStorage() {
    localStorage.setItem('userGeminiKeys', JSON.stringify(this.userGeminiKeys));
    localStorage.setItem('userGroqKeys', JSON.stringify(this.userGroqKeys));
    localStorage.setItem('geminiModel', this.geminiModel);
  },
  
  loadFromLocalStorage() {
    const savedUserGemini = localStorage.getItem('userGeminiKeys');
    const savedUserGroq = localStorage.getItem('userGroqKeys');
    const savedModel = localStorage.getItem('geminiModel');
    
    if (savedUserGemini) this.userGeminiKeys = JSON.parse(savedUserGemini);
    if (savedUserGroq) this.userGroqKeys = JSON.parse(savedUserGroq);
    if (savedModel) this.geminiModel = savedModel;
  },
  
  clearAll() {
    this.files = {};
    this.activeFile = null;
    this.history = [];
    this.changeLog = [];
  }
};

state.loadFromLocalStorage();
