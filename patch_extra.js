const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const oldAddExtraItem = `  function addExtraItem() {
    const priceVal = parseInt(extraPriceInput.value, 10);
    if (isNaN(priceVal) || priceVal < 0) { extraPriceInput.focus(); return; }
    const name = extraNameInput.value.trim() || 'その他';
    // その他アイテムは日用品が多い可能性を考慮し、taxMemoryを優先しつつデフォルト10%
    const taxRate = taxMemory[name] ? taxMemory[name] : 10;
    const item = { id: nextId++, name, price: priceVal, taxRate };
    extraItems.push(item);
    extraNameInput.value = '';
    extraPriceInput.value = '';
    renderExtraList();
    updateBalance();
    saveState();
  }`;

const newAddExtraItem = `  function addExtraItem() {
    const priceVal = parseInt(extraPriceInput.value, 10);
    if (isNaN(priceVal) || priceVal < 0) { extraPriceInput.focus(); return; }
    const name = extraNameInput.value.trim() || 'その他';
    // その他アイテムは日用品が多い可能性を考慮し、taxMemoryを優先しつつデフォルト10%
    const taxRate = taxMemory[name] ? taxMemory[name] : 10;
    const item = { id: nextId++, name, price: priceVal, taxRate };
    extraItems.push(item);
    
    setTimeout(() => {
      extraNameInput.value = '';
      extraPriceInput.value = '';
    }, 10);
    
    renderExtraList();
    updateBalance();
    saveState();
  }`;

code = code.replace(oldAddExtraItem, newAddExtraItem);
fs.writeFileSync('app.js', code);
