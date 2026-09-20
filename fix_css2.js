const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

// The bottom of style.css had:
/*
.header-actions {
  display: flex;
  gap: 12px;
}
*/
css = css.replace(/\.header-actions \{\s*display: flex;\s*gap: 12px;\s*\}/g, '');
fs.writeFileSync('style.css', css);
