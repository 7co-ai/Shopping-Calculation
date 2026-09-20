const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// 1. Remove DOM elements variables for extra
js = js.replace(/const extraNameInput[^;]+;\n/g, '');
js = js.replace(/const extraPriceInput[^;]+;\n/g, '');
js = js.replace(/const addExtraBtn[^;]+;\n/g, '');
js = js.replace(/const extraListEl[^;]+;\n/g, '');

// 2. Remove addExtraBtn event listener
js = js.replace(/addExtraBtn\.addEventListener[\s\S]*?\}\);/g, '');

// 3. Remove extraNameInput event listener
js = js.replace(/extraNameInput\.addEventListener[\s\S]*?\}\);/g, '');
js = js.replace(/extraPriceInput\.addEventListener[\s\S]*?\}\);/g, '');

// 4. Remove addExtraItem function entirely
js = js.replace(/function addExtraItem\(\) \{[\s\S]*?\}\n/g, '');

// 5. Remove renderExtraList function entirely
js = js.replace(/function renderExtraList\(\) \{[\s\S]*?\}\n\n/g, '');

fs.writeFileSync('app.js', js);
