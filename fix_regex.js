const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// Replace the buggy parsing logic
const oldLogic = `      text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      text = text.replace(/(円|えん|くらい|ぐらい|です|だね)/g, ' ');

      const match = text.match(/(.+?)[\\s、]+(\\d+)$/);`;

const newLogic = `      text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      text = text.replace(/(円|えん|くらい|ぐらい|です|だね)/g, '').trim();

      const match = text.match(/(.+?)[\\s、]+(\\d+)$/);`;

js = js.replace(oldLogic, newLogic);
fs.writeFileSync('app.js', js);
