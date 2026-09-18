const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

const parseFunctionMatch = js.match(/function parseAndAddVoiceItem\(text\) \{[\\s\\S]*?\}\\s+\\}/);
if (parseFunctionMatch) {
  const newParseFunction = `function parseAndAddVoiceItem(text) {
      text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      
      // 税率のキーワードをチェック
      let overrideTax = null;
      if (text.includes('10%') || text.includes('10パー') || text.includes('１０パー') || text.includes('じっぱー')) {
        overrideTax = 10;
        text = text.replace(/(10%|10パーセント|10パー|１０パー|じっぱー)/g, ' ');
      } else if (text.includes('8%') || text.includes('8パー') || text.includes('８パー') || text.includes('はっぱー')) {
        overrideTax = 8;
        text = text.replace(/(8%|8パーセント|8パー|８パー|はっぱー)/g, ' ');
      }

      text = text.replace(/(円|えん|くらい|ぐらい|です|だね)/g, '').trim();

      const match = text.match(/(.+?)(?:[\\s、]+|(?=\\d+))(\\d+)$/);
      
      let name = '';
      let price = null;

      if (match) {
        name = match[1].trim();
        price = parseInt(match[2], 10);
      } else {
        const onlyNum = text.match(/^\\d+$/);
        if (onlyNum) {
          showVoiceStatus('品名も教えてね');
          return;
        }
        name = text.trim();
      }

      if (!name) return;

      const taxRate = overrideTax !== null ? overrideTax : getTaxRate(name);
      if (overrideTax !== null) {
        taxMemory[name] = overrideTax; // 記憶させる
      }

      if (price !== null) {
        const existingItem = shoppingItems.find(i => i.name === name);
        if (existingItem) {
          existingItem.price = price;
          existingItem.checked = true;
          if (overrideTax !== null) existingItem.taxRate = overrideTax;
          showVoiceStatus(\`\${name}を\${price}円で記録！\`);
        } else {
          // B案: リストにないものも全て上の買い物リストに追加する
          shoppingItems.unshift({ id: nextId++, name, price: price, checked: true, taxRate });
          showVoiceStatus(\`\${name}を\${price}円で追加！\`);
        }
      } else {
        shoppingItems.unshift({ id: nextId++, name, price: null, checked: false, taxRate });
        showVoiceStatus(\`\${name}をメモ！\`);
      }
      
      renderShoppingList();
      updateBalance();
      saveState();
    }`;
  
  js = js.replace(/function parseAndAddVoiceItem\(text\) \{[\s\S]*?\}\s+(?=}\s+\n  \/\/ ===== History Modal =====)/, newParseFunction + '\n    ');
  fs.writeFileSync('app.js', js);
}
