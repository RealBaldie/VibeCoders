function launchIframe(htmlContent) {
  // Create a complete HTML document
  let finalHtml = htmlContent;
  
  // Ensure proper HTML structure
  if (!finalHtml.includes('<!DOCTYPE html>')) {
    finalHtml = '<!DOCTYPE html>\n' + finalHtml;
  }
  
  // Inject CSS and JS properly BEFORE adding error handler
  // First, extract CSS and JS from state.files if they exist
  const cssContent = state.files['style.css'];
  const jsContent = state.files['script.js'];
  
  // Build the error handler script
  const errorHandler = `
    <script>
    window.onerror = (msg, src, line, col, err) => {
      parent.postMessage({type:'error', msg: msg + ' (line '+line+')'}, '*');
      return false;
    };
    const _log = console.log, _warn = console.warn, _err = console.error;
    console.log = (...a) => { parent.postMessage({type:'log', msg: a.map(x=>typeof x==='object'?JSON.stringify(x):x).join(' ')}, '*'); _log(...a); };
    console.warn = (...a) => { parent.postMessage({type:'warn', msg: a.join(' ')}, '*'); _warn(...a); };
    console.error = (...a) => { parent.postMessage({type:'error', msg: a.join(' ')}, '*'); _err(...a); };
    <\/script>
  `;
  
  // Inject CSS into head if it exists in state.files AND not already in HTML
  let cssInjected = false;
  if (cssContent && !finalHtml.includes('<style') && !finalHtml.includes('style.css')) {
    const styleTag = `<style id="vibecode-injected-css">\n${cssContent}\n</style>`;
    if (finalHtml.includes('</head>')) {
      finalHtml = finalHtml.replace('</head>', `${styleTag}</head>`);
      cssInjected = true;
    } else if (finalHtml.includes('<head>')) {
      finalHtml = finalHtml.replace('<head>', `<head>${styleTag}`);
      cssInjected = true;
    } else {
      // No head tag - add one
      finalHtml = finalHtml.replace('<html>', '<html><head></head>');
      finalHtml = finalHtml.replace('</head>', `${styleTag}</head>`);
      cssInjected = true;
    }
  }
  
  // Inject error handler into head (after CSS to not interfere)
  if (finalHtml.includes('</head>')) {
    finalHtml = finalHtml.replace('</head>', `${errorHandler}</head>`);
  } else if (finalHtml.includes('<head>')) {
    finalHtml = finalHtml.replace('<head>', `<head>${errorHandler}`);
  } else {
    finalHtml = finalHtml.replace('<html>', '<html><head></head>');
    finalHtml = finalHtml.replace('</head>', `${errorHandler}</head>`);
  }
  
  // Inject JS into body at the end if it exists in state.files
  if (jsContent && !finalHtml.includes('vibecode-injected-js')) {
    const scriptTag = `<script id="vibecode-injected-js">\n${jsContent}\n<\/script>`;
    if (finalHtml.includes('</body>')) {
      finalHtml = finalHtml.replace('</body>', `${scriptTag}</body>`);
    } else {
      finalHtml = finalHtml.replace('</html>', `${scriptTag}</html>`);
    }
  }
  
  // Debug log to see what's being sent
  console.log('Iframe HTML length:', finalHtml.length);
  console.log('CSS injected:', cssInjected);
  console.log('CSS present:', !!cssContent);
  console.log('JS injected:', !!jsContent);
  
  const iframe = document.getElementById('run-iframe');
  const ibar = document.getElementById('iframe-bar');
  
  iframe.srcdoc = finalHtml;
  iframe.classList.add('visible');
  ibar.classList.add('visible');
  
  log('✓ Running in preview window', 'ok');
  setStatus('Running…');
  
  // Error handling for iframe loading
  state._runError = null;
  const errorWait = new Promise(res => {
    const tid = setTimeout(() => res(null), 2000);
    window._pendingRunResolve = (err) => { clearTimeout(tid); res(err); };
  });
  errorWait.then(error => {
    if (error) {
      log(`✗ Runtime error: ${error}`, 'err');
      log('⟳ Attempting AI auto-fix…', 'warn');
      autoFix(error);
    }
  });
}

function runReact() {
  const jsx = state.files['App.jsx'] || state.files[Object.keys(state.files).find(f => f.endsWith('.jsx'))] || '';
  const css = state.files['style.css'] || '';
  const htmlContent = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>body{margin:0;font-family:sans-serif;background:#fff;color:#111}${css}</style>
<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
</head><body>
<div id="root"></div>
<script type="text/babel">
${jsx}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(typeof App !== 'undefined' ? App : () => React.createElement('div', null, 'No App component found'), null));
<\/script>
</body></html>`;
  launchIframe(htmlContent);
}

async function runPython() {
  log('⏳ Loading Python runtime (Pyodide)…', 'warn');
  setStatus('Loading Python…');

  const code = state.files['main.py'] || state.files[Object.keys(state.files).find(f => f.endsWith('.py'))] || '';
  if (!code) { log('No Python file found.', 'err'); return; }

  const pyHtml = `<!DOCTYPE html><html><head>
<script src="https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"><\/script>
</head><body>
<script>
async function main() {
  parent.postMessage({type:'log', msg:'⏳ Pyodide loading…'}, '*');
  const pyodide = await loadPyodide();
  parent.postMessage({type:'log', msg:'✓ Python ready'}, '*');
  pyodide.runPython(\`
import sys, io
class _Capture(io.StringIO):
    def write(self, s):
        import js
        if s.strip(): js.parent.postMessage({'type': 'log', 'msg': s.rstrip()}, '*')
        return len(s)
sys.stdout = _Capture()
sys.stderr = _Capture()
  \`);
  try {
    pyodide.runPython(${JSON.stringify(code)});
    parent.postMessage({type:'log', msg:'✓ Done'}, '*');
  } catch(e) {
    parent.postMessage({type:'error', msg: e.message}, '*');
  }
}
main();
<\/script></body></html>`;

  const iframe = document.getElementById('run-iframe');
  const ibar = document.getElementById('iframe-bar');
  iframe.srcdoc = pyHtml;
  iframe.classList.add('visible');
  ibar.classList.add('visible');
  setStatus('Python running…');
}

async function runCode() {
  if (!state.activeFile && !Object.keys(state.files).length) return;
  const lang = document.getElementById('lang-select').value;

  clearLog();
  log('▶ Running code…', 'info');

  if (lang === 'python') {
    await runPython();
    return;
  }

  if (lang === 'react') {
    runReact();
    return;
  }

  let htmlContent = '';
  if (state.files['index.html']) {
    htmlContent = state.files['index.html'];
    if (state.files['style.css'] && !htmlContent.includes('<style>') && !htmlContent.includes('style.css')) {
      htmlContent = htmlContent.replace('</head>', `<style>${state.files['style.css']}</style></head>`);
    }
    if (state.files['script.js'] && !htmlContent.includes('script.js')) {
      htmlContent = htmlContent.replace('</body>', `<script>${state.files['script.js']}<\/script></body>`);
    }
  } else {
    const js = state.files['script.js'] || state.files[state.activeFile] || '';
    htmlContent = `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:20px;background:#fff;color:#111}*{box-sizing:border-box}</style></head><body><script>
    try { ${js} } catch(e) { document.body.innerHTML = '<pre style="color:red">'+e.toString()+'</pre>'; }
    <\/script></body></html>`;
  }

  launchIframe(htmlContent);
}

function closeIframe() {
  document.getElementById('run-iframe').classList.remove('visible');
  document.getElementById('iframe-bar').classList.remove('visible');
}
