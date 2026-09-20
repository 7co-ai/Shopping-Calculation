const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

// We need to remove position absolute from .header-icon-btn
// and instead apply it to .header-actions

const search = `.header-icon-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);`;

const replace = `.header-actions {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 12px;
}

.header-icon-btn {`;

css = css.replace(search, replace);
fs.writeFileSync('style.css', css);
