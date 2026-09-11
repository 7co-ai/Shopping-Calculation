const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const oldKeydown = `itemNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addShoppingItem(); }
  });`;

const newKeydown = `itemNameInput.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') { e.preventDefault(); addShoppingItem(); }
  });`;

code = code.replace(oldKeydown, newKeydown);

const oldExtraKeydown = `extraNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); extraPriceInput.focus(); }
  });`;

const newExtraKeydown = `extraNameInput.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') { e.preventDefault(); extraPriceInput.focus(); }
  });`;

code = code.replace(oldExtraKeydown, newExtraKeydown);


const oldAddShoppingItem = `  function addShoppingItem() {
    const name = itemNameInput.value.trim();
    if (!name) { itemNameInput.focus(); return; }
    const taxRate = getTaxRate(name);
    const item = { id: nextId++, name, price: null, checked: false, taxRate };
    shoppingItems.unshift(item);
    
    itemNameInput.blur();
    itemNameInput.blur();
    itemNameInput.value = '';
    toggleClearBtn();
    itemNameInput.focus();
    renderShoppingList();
    saveState();
  }`;

const newAddShoppingItem = `  function addShoppingItem() {
    const name = itemNameInput.value.trim();
    if (!name) { itemNameInput.focus(); return; }
    const taxRate = getTaxRate(name);
    const item = { id: nextId++, name, price: null, checked: false, taxRate };
    shoppingItems.unshift(item);
    
    setTimeout(() => {
      itemNameInput.value = '';
      toggleClearBtn();
      itemNameInput.focus();
    }, 10);
    
    renderShoppingList();
    saveState();
  }`;

code = code.replace(oldAddShoppingItem, newAddShoppingItem);

fs.writeFileSync('app.js', code);
