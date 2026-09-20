const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// 1. Remove voiceBtn textContent logic
js = js.replace(/voiceBtn\.querySelector\('\.mic-icon'\)\.textContent = '🔴';/g, '');
js = js.replace(/voiceBtn\.querySelector\('\.mic-icon'\)\.textContent = '🎙️';/g, '');

// 2. Add Theme logic
const themeLogic = `
  // ===== Theme =====
  const themeBtn = $('#theme-btn');
  const themeOverlay = $('#theme-overlay');
  const themeCloseBtn = $('#theme-close-btn');
  const themeOptions = document.querySelectorAll('.theme-option-btn');
  
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeOptions.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
    });
  }

  themeBtn.addEventListener('click', () => {
    themeOverlay.classList.remove('hidden');
  });

  themeCloseBtn.addEventListener('click', () => {
    themeOverlay.classList.add('hidden');
  });

  themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-val');
      applyTheme(theme);
      state.theme = theme;
      saveState();
    });
  });
`;

js = js.replace('// ===== History Modal =====', themeLogic + '\n  // ===== History Modal =====');

// 3. Load/Save theme in state
js = js.replace('const state = {', 'const state = { theme: document.body.getAttribute("data-theme") || "simple",');
js = js.replace('isTaxInclusive = state.isTaxInclusive || false;', 'isTaxInclusive = state.isTaxInclusive || false;\n      if(state.theme) applyTheme(state.theme);');

fs.writeFileSync('app.js', js);
