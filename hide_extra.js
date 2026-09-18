const fs = require('fs');

// 1. HTML: Add hidden class or style to extra-section
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<section id="extra-section" class="card">', '<section id="extra-section" class="card" style="display: none;">');
fs.writeFileSync('index.html', html);

