/**
 * 買い物計算メモアプリ - メインロジック
 */
(() => {
  'use strict';

  // ===== State =====
  let budget = 0;
  let budgetSet = false;
  let shoppingItems = [];  // { id, name, price, checked }
  let extraItems = [];     // { id, name, price }
  let nextId = 1;

  // ===== DOM Elements =====
  const $ = (sel) => document.querySelector(sel);
  const balanceAmountEl = $('#balance-amount');
  const budgetInput = $('#budget-input');
  const budgetSetBtn = $('#budget-set-btn');
  const budgetDisplay = $('#budget-display');
  const budgetValue = $('#budget-value');
  const budgetEditBtn = $('#budget-edit-btn');
  const budgetInputRow = $('.budget-input-row');
  const itemNameInput = $('#item-name-input');
  const itemNameClearBtn = $('#item-name-clear');
  const addItemBtn = $('#add-item-btn');
  const shoppingListEl = $('#shopping-list');
  const listToolbar = $('#list-toolbar');
  const selectAllCb = $('#select-all-cb');
  const deleteCheckedBtn = $('#delete-checked-btn');
  const extraNameInput = $('#extra-name-input');
  const extraPriceInput = $('#extra-price-input');
  const addExtraBtn = $('#add-extra-btn');
  const extraListEl = $('#extra-list');
  const completeBtn = $('#complete-btn');
  const resultOverlay = $('#result-overlay');
  const resultBudget = $('#result-budget');
  const resultTotal = $('#result-total');
  const resultBalance = $('#result-balance');
  const resultItemsDetail = $('#result-items-detail');
  const resultCloseBtn = $('#result-close-btn');
  const resultResetBtn = $('#result-reset-btn');

  // ===== Budget =====
  budgetSetBtn.addEventListener('click', () => {
    setBudget();
  });

  budgetInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setBudget();
    }
  });

  budgetEditBtn.addEventListener('click', () => {
    budgetSet = false;
    budgetDisplay.classList.add('hidden');
    budgetInputRow.classList.remove('hidden');
    budgetInput.value = budget || '';
    budgetInput.focus();
  });

  function setBudget() {
    const val = parseInt(budgetInput.value, 10);
    if (isNaN(val) || val < 0) {
      budgetInput.focus();
      return;
    }
    budget = val;
    budgetSet = true;
    budgetValue.textContent = formatYen(budget);
    budgetInputRow.classList.add('hidden');
    budgetDisplay.classList.remove('hidden');
    budgetInput.blur();
    updateBalance();
    saveState();
  }

  // ===== Shopping List =====
  addItemBtn.addEventListener('click', () => addShoppingItem());
  itemNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addShoppingItem();
    }
  });

  // Clear button: show/hide based on input content
  itemNameInput.addEventListener('input', () => {
    toggleClearBtn();
  });

  itemNameClearBtn.addEventListener('click', () => {
    itemNameInput.value = '';
    toggleClearBtn();
    itemNameInput.focus();
  });

  function toggleClearBtn() {
    if (itemNameInput.value.length > 0) {
      itemNameClearBtn.classList.add('visible');
    } else {
      itemNameClearBtn.classList.remove('visible');
    }
  }

  function addShoppingItem() {
    const name = itemNameInput.value.trim();
    if (!name) {
      itemNameInput.focus();
      return;
    }
    const item = { id: nextId++, name, price: null, checked: false };
    shoppingItems.unshift(item);
    // Auto-clear: blur first (dismiss keyboard briefly), then clear & refocus
    itemNameInput.blur();
    itemNameInput.value = '';
    toggleClearBtn();
    // Small delay so mobile keyboard re-opens cleanly
    setTimeout(() => itemNameInput.focus(), 50);
    renderShoppingList();
    saveState();
  }

  function renderShoppingList() {
    shoppingListEl.innerHTML = '';

    // Show/hide toolbar
    if (shoppingItems.length === 0) {
      listToolbar.classList.add('hidden');
      shoppingListEl.innerHTML = '<li class="empty-placeholder">品目を追加してください</li>';
      updateToolbarState();
      return;
    }

    listToolbar.classList.remove('hidden');

    shoppingItems.forEach((item) => {
      const li = document.createElement('li');

      // Checkbox
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'item-checkbox';
      cb.checked = item.checked;
      cb.setAttribute('aria-label', `${item.name} を選択`);
      cb.addEventListener('change', () => {
        item.checked = cb.checked;
        nameSpan.classList.toggle('checked', item.checked);
        updateToolbarState();
        updateBalance();
        saveState();
      });

      // Name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name' + (item.checked ? ' checked' : '');
      nameSpan.textContent = item.name;

      // Price input
      const priceInput = document.createElement('input');
      priceInput.type = 'number';
      priceInput.inputMode = 'numeric';
      priceInput.pattern = '[0-9]*';
      priceInput.className = 'item-price-input' + (item.price !== null ? ' has-value' : '');
      priceInput.placeholder = '¥';
      priceInput.min = '0';
      priceInput.step = '1';
      if (item.price !== null) priceInput.value = item.price;
      priceInput.setAttribute('aria-label', `${item.name} の金額`);

      priceInput.addEventListener('input', () => {
        const val = priceInput.value.trim();
        if (val === '') {
          item.price = null;
          priceInput.classList.remove('has-value');
        } else {
          item.price = parseInt(val, 10) || 0;
          priceInput.classList.add('has-value');
        }
        updateBalance();
        saveState();
      });

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'item-delete-btn';
      delBtn.innerHTML = '✕';
      delBtn.setAttribute('aria-label', `${item.name} を削除`);
      delBtn.addEventListener('click', () => {
        shoppingItems = shoppingItems.filter(i => i.id !== item.id);
        renderShoppingList();
        updateBalance();
        saveState();
      });

      li.appendChild(cb);
      li.appendChild(nameSpan);
      li.appendChild(priceInput);
      li.appendChild(delBtn);
      shoppingListEl.appendChild(li);
    });

    updateToolbarState();
  }

  // ===== Select All / Delete Checked =====
  selectAllCb.addEventListener('change', () => {
    const isChecked = selectAllCb.checked;
    shoppingItems.forEach((item) => {
      item.checked = isChecked;
    });
    renderShoppingList();
    updateBalance();
    saveState();
  });

  deleteCheckedBtn.addEventListener('click', () => {
    const checkedCount = shoppingItems.filter(i => i.checked).length;
    if (checkedCount === 0) return;
    if (confirm(`選択した ${checkedCount} 件を削除しますか？`)) {
      shoppingItems = shoppingItems.filter(i => !i.checked);
      renderShoppingList();
      updateBalance();
      saveState();
    }
  });

  function updateToolbarState() {
    if (shoppingItems.length === 0) {
      selectAllCb.checked = false;
      selectAllCb.indeterminate = false;
      deleteCheckedBtn.disabled = true;
      return;
    }
    const checkedCount = shoppingItems.filter(i => i.checked).length;
    selectAllCb.checked = checkedCount === shoppingItems.length;
    selectAllCb.indeterminate = checkedCount > 0 && checkedCount < shoppingItems.length;
    deleteCheckedBtn.disabled = checkedCount === 0;
  }

  // ===== Extra Items =====
  addExtraBtn.addEventListener('click', () => addExtraItem());
  extraPriceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExtraItem();
    }
  });
  extraNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      extraPriceInput.focus();
    }
  });

  function addExtraItem() {
    const priceVal = parseInt(extraPriceInput.value, 10);
    if (isNaN(priceVal) || priceVal < 0) {
      extraPriceInput.focus();
      return;
    }
    const name = extraNameInput.value.trim() || 'その他';
    const item = { id: nextId++, name, price: priceVal };
    extraItems.push(item);
    extraNameInput.value = '';
    extraPriceInput.value = '';
    renderExtraList();
    updateBalance();
    saveState();
  }

  function renderExtraList() {
    extraListEl.innerHTML = '';
    if (extraItems.length === 0) return;
    extraItems.forEach((item) => {
      const li = document.createElement('li');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = item.name;

      const priceSpan = document.createElement('span');
      priceSpan.className = 'extra-price';
      priceSpan.textContent = formatYen(item.price);

      const delBtn = document.createElement('button');
      delBtn.className = 'item-delete-btn';
      delBtn.innerHTML = '✕';
      delBtn.setAttribute('aria-label', `${item.name} を削除`);
      delBtn.addEventListener('click', () => {
        extraItems = extraItems.filter(i => i.id !== item.id);
        renderExtraList();
        updateBalance();
        saveState();
      });

      li.appendChild(nameSpan);
      li.appendChild(priceSpan);
      li.appendChild(delBtn);
      extraListEl.appendChild(li);
    });
  }

  // ===== Balance Calculation =====
  function calcTotal() {
    let total = 0;
    // Shopping items: count all items with a price entered (no checkbox needed)
    shoppingItems.forEach((item) => {
      if (item.price !== null) {
        total += item.price;
      }
    });
    // Extra items: always counted
    extraItems.forEach((item) => {
      total += item.price;
    });
    return total;
  }

  function updateBalance() {
    const total = calcTotal();
    const remaining = budget - total;
    balanceAmountEl.textContent = formatYen(remaining);

    if (remaining < 0) {
      balanceAmountEl.classList.add('over-budget');
    } else {
      balanceAmountEl.classList.remove('over-budget');
    }
  }

  // ===== Complete =====
  completeBtn.addEventListener('click', () => {
    showResult();
  });

  resultCloseBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
  });

  resultResetBtn.addEventListener('click', () => {
    if (confirm('すべてリセットして新しく始めますか？')) {
      resetAll();
      resultOverlay.classList.add('hidden');
    }
  });

  resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) {
      resultOverlay.classList.add('hidden');
    }
  });

  function showResult() {
    const total = calcTotal();
    const remaining = budget - total;

    resultBudget.textContent = formatYen(budget);
    resultTotal.textContent = formatYen(total);
    resultBalance.textContent = formatYen(remaining);

    if (remaining < 0) {
      resultBalance.classList.add('over');
      resultBalance.classList.remove('under');
    } else {
      resultBalance.classList.remove('over');
      resultBalance.classList.add('under');
    }

    // Build detail list
    resultItemsDetail.innerHTML = '';
    const purchasedItems = shoppingItems.filter(i => i.price !== null);
    const allDetailItems = [
      ...purchasedItems.map(i => ({ name: i.name, price: i.price })),
      ...extraItems.map(i => ({ name: i.name, price: i.price }))
    ];

    if (allDetailItems.length === 0) {
      resultItemsDetail.innerHTML = '<div style="text-align:center;color:#999;">購入した品目はありません</div>';
    } else {
      allDetailItems.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `<span class="detail-label">${escapeHtml(item.name)}</span><span>${formatYen(item.price)}</span>`;
        resultItemsDetail.appendChild(row);
      });
    }

    resultOverlay.classList.remove('hidden');
  }

  // ===== Reset =====
  function resetAll() {
    budget = 0;
    budgetSet = false;
    shoppingItems = [];
    extraItems = [];
    nextId = 1;
    budgetInput.value = '';
    budgetDisplay.classList.add('hidden');
    budgetInputRow.classList.remove('hidden');
    renderShoppingList();
    renderExtraList();
    updateBalance();
    clearState();
  }

  // ===== Persistence (localStorage) =====
  function saveState() {
    try {
      const state = { budget, budgetSet, shoppingItems, extraItems, nextId };
      localStorage.setItem('shopping-calc-state', JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('shopping-calc-state');
      if (!raw) return;
      const state = JSON.parse(raw);
      budget = state.budget || 0;
      budgetSet = state.budgetSet || false;
      shoppingItems = state.shoppingItems || [];
      extraItems = state.extraItems || [];
      nextId = state.nextId || 1;

      if (budgetSet) {
        budgetValue.textContent = formatYen(budget);
        budgetInputRow.classList.add('hidden');
        budgetDisplay.classList.remove('hidden');
      }

      renderShoppingList();
      renderExtraList();
      updateBalance();
    } catch (e) { /* ignore */ }
  }

  function clearState() {
    try {
      localStorage.removeItem('shopping-calc-state');
    } catch (e) { /* ignore */ }
  }

  // ===== Utility =====
  function formatYen(amount) {
    if (amount < 0) {
      return `-¥${Math.abs(amount).toLocaleString()}`;
    }
    return `¥${amount.toLocaleString()}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Service Worker Registration =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // ===== Init =====
  loadState();
  renderShoppingList();
  updateBalance();
})();
