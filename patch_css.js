const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

const additionalCss = `
.history-header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icon-action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: color 0.2s, background 0.2s;
}

.icon-action-btn:active {
  background: var(--bg);
  color: var(--red);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg);
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
}

.history-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  flex: 1;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item-content:active {
  background: rgba(0,0,0,0.05);
}

.history-delete-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  padding: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.history-delete-btn:active {
  color: var(--red);
}
`;

css = css.replace(
  ".history-item {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px;\n  background: var(--bg);\n  border-radius: 12px;\n  margin-bottom: 10px;\n  cursor: pointer;\n  transition: transform 0.1s;\n}\n\n.history-item:active {\n  transform: scale(0.98);\n}",
  ""
);

css += additionalCss;
fs.writeFileSync('style.css', css);
