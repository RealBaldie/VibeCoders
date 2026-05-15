// Global state
const state = {
  files: {},
  activeFile: null,
  history: [],
  conversationHistory: [],
  mode: 'step',
  retryCount: 0,
  lastError: null,
  lastPrompt: null,
  thinking: false,
  apiKey: '',
};
