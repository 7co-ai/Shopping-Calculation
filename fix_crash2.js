const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');
const regex = /\/\/ ===== Extra Items =====[\s\S]*?(?=\/\/ ===== Complete =====)/;
js = js.replace(regex, '');
fs.writeFileSync('app.js', js);
