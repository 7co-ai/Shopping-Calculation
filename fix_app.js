const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// The crash happens because extraNameInput etc are null, and then we call .addEventListener on them.
// We can just find all lines that start with `extraNameInput.addEventListener` and remove them.
// Or we can just add `if (extraNameInput)` before them.

// Let's replace the element selectors with a dummy element creator if they don't exist.
js = js.replace(
  "const extraNameInput = $('#extra-name-input');",
  "const extraNameInput = $('#extra-name-input') || document.createElement('input');"
);
js = js.replace(
  "const extraPriceInput = $('#extra-price-input');",
  "const extraPriceInput = $('#extra-price-input') || document.createElement('input');"
);
js = js.replace(
  "const addExtraBtn = $('#add-extra-btn');",
  "const addExtraBtn = $('#add-extra-btn') || document.createElement('button');"
);
js = js.replace(
  "const extraListEl = $('#extra-list');",
  "const extraListEl = $('#extra-list') || document.createElement('ul');"
);

// We also need to fix `voiceBtn.querySelector('.mic-icon').textContent = '🔴';` which will crash if `.mic-icon` doesn't exist (we changed it to `.mic-icon-svg`).
js = js.replace(/voiceBtn\.querySelector\('\.mic-icon'\)\.textContent = '🔴';/g, '');
js = js.replace(/voiceBtn\.querySelector\('\.mic-icon'\)\.textContent = '🎙️';/g, '');

fs.writeFileSync('app.js', js);
