const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

const themeVariables = `
:root, [data-theme="simple"] {
  --green-primary: #4CAF50;
  --green-dark: #388E3C;
  --green-light: #C8E6C9;
  --accent: #FF9800;
  --accent-dark: #F57C00;
  --red: #E53935;
  --red-light: #FFEBEE;
  --bg: #F5F5F5;
  --card-bg: #FFFFFF;
  --text: #212121;
  --text-secondary: #757575;
  --border: #E0E0E0;
  --radius: 12px;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
  --header-height: 72px;
}

[data-theme="sakura"] {
  --green-primary: #f472b6;
  --green-dark: #db2777;
  --green-light: #fce7f3;
  --accent: #fbbf24;
  --accent-dark: #f59e0b;
  --bg: #fff1f2;
}

[data-theme="ocean"] {
  --green-primary: #38bdf8;
  --green-dark: #0284c7;
  --green-light: #e0f2fe;
  --accent: #f472b6;
  --accent-dark: #db2777;
  --bg: #f0f9ff;
}
`;

css = css.replace(/:root\s*\{[^}]+\}/, themeVariables);

css += `
/* ===== Titles with Icons ===== */
.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--green-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* ===== Theme Switcher ===== */
.theme-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.theme-option-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: bold;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}
.theme-option-btn.active {
  border-color: var(--green-primary);
  background: var(--green-light);
}
.theme-color-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* ===== Voice Mic SVG ===== */
.mic-icon-svg {
  stroke: white;
}
`;
fs.writeFileSync('style.css', css);
