/**
 * 買い物計算メモアプリ - メインロジック
 */
(() => {
  'use strict';

  // ===== State =====
  let budget = 0;
  let budgetSet = false;
  let shoppingItems = [];  // { id, name, price, checked, taxRate }
  let extraItems = [];     // { id, name, price, taxRate }
  let nextId = 1;
  let isTaxInclusive = false;
  let taxMemory = {};
  let receiptHistory = [];

  // ===== DOM Elements =====
  const $ = (sel) => document.querySelector(sel);
  const balanceAmountEl = $('#balance-amount');
  const historyBtn = $('#history-btn');
  const taxModeExc = $('#tax-mode-exc');
  const taxModeInc = $('#tax-mode-inc');
  
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
  const receiptDate = $('#receipt-date');
  const resultBudget = $('#result-budget');
  const resultTotal = $('#result-total');
  const resultBalance = $('#result-balance');
  const resultItemsDetail = $('#result-items-detail');
  const resultCloseBtn = $('#result-close-btn');
  const resultResetBtn = $('#result-reset-btn');

  const historyOverlay = $('#history-overlay');
  const historyList = $('#history-list');
  const historyCloseBtn = $('#history-close-btn');
  const historyEmpty = $('#history-empty');
  const historyClearAllBtn = $('#history-clear-all-btn');

  // ===== Tax Configuration =====
  function getTaxRate(name) {
    if (name && taxMemory[name]) return taxMemory[name];
    return 8; // デフォルトは食品の8%
  }

  taxModeExc.addEventListener('change', () => { isTaxInclusive = false; updateBalance(); saveState(); });
  taxModeInc.addEventListener('change', () => { isTaxInclusive = true; updateBalance(); saveState(); });

  // ===== Budget =====
  budgetSetBtn.addEventListener('click', () => setBudget());
  budgetInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); setBudget(); }
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
    if (isNaN(val) || val < 0) { budgetInput.focus(); return; }
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
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') { e.preventDefault(); addShoppingItem(); }
  });

  itemNameInput.addEventListener('input', () => toggleClearBtn());

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
  }

  function renderShoppingList() {
    shoppingListEl.innerHTML = '';

    if (shoppingItems.length === 0) {
      listToolbar.classList.add('hidden');
      shoppingListEl.innerHTML = '<li class="empty-placeholder">品目を追加してください</li>';
      updateToolbarState();
      return;
    }

    listToolbar.classList.remove('hidden');

    shoppingItems.forEach((item) => {
      const li = document.createElement('li');

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

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name' + (item.checked ? ' checked' : '');
      nameSpan.textContent = item.name;

      const taxBtn = document.createElement('button');
      taxBtn.className = `tax-badge tax-${item.taxRate}`;
      taxBtn.textContent = `${item.taxRate}%`;
      taxBtn.addEventListener('click', () => {
        item.taxRate = item.taxRate === 8 ? 10 : 8;
        taxBtn.className = `tax-badge tax-${item.taxRate}`;
        taxBtn.textContent = `${item.taxRate}%`;
        if (item.name) taxMemory[item.name] = item.taxRate;
        updateBalance();
        saveState();
      });

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
      li.appendChild(taxBtn);
      li.appendChild(priceInput);
      li.appendChild(delBtn);
      shoppingListEl.appendChild(li);
    });

    updateToolbarState();
  }

  // ===== Select All / Delete Checked =====
  selectAllCb.addEventListener('change', () => {
    const isChecked = selectAllCb.checked;
    shoppingItems.forEach(item => item.checked = isChecked);
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
    if (e.key === 'Enter') { e.preventDefault(); addExtraItem(); }
  });
  extraNameInput.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') { e.preventDefault(); extraPriceInput.focus(); }
  });

  function addExtraItem() {
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
  }

  function renderExtraList() {
    extraListEl.innerHTML = '';
    if (extraItems.length === 0) return;
    extraItems.forEach((item) => {
      const li = document.createElement('li');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = item.name;

      const taxBtn = document.createElement('button');
      taxBtn.className = `tax-badge tax-${item.taxRate}`;
      taxBtn.textContent = `${item.taxRate}%`;
      taxBtn.addEventListener('click', () => {
        item.taxRate = item.taxRate === 8 ? 10 : 8;
        taxBtn.className = `tax-badge tax-${item.taxRate}`;
        taxBtn.textContent = `${item.taxRate}%`;
        if (item.name && item.name !== 'その他') taxMemory[item.name] = item.taxRate;
        updateBalance();
        saveState();
      });

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
      li.appendChild(taxBtn);
      li.appendChild(priceSpan);
      li.appendChild(delBtn);
      extraListEl.appendChild(li);
    });
  }

  // ===== Balance Calculation =====
  function calculateWithTax(price, rate) {
    if (price === null) return 0;
    if (isTaxInclusive) return price;
    return Math.floor(price * (1 + rate / 100)); // 個別切り捨て
  }

  function calcTotal() {
    let total = 0;
    shoppingItems.forEach(item => total += calculateWithTax(item.price, item.taxRate));
    extraItems.forEach(item => total += calculateWithTax(item.price, item.taxRate));
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

  // ===== Complete & Receipt =====
  completeBtn.addEventListener('click', () => {
    showResult();
  });

  resultCloseBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
  });

  resultResetBtn.addEventListener('click', () => {
    if (confirm('履歴に保存して、すべてリセットして新しく始めますか？')) {
      saveReceiptToHistory();
      resetAll();
      resultOverlay.classList.add('hidden');
    }
  });

  resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) resultOverlay.classList.add('hidden');
  });

  function showResult(pastReceipt = null) {
    let currentBudget, currentTotal, currentRemaining, itemsList, dateStr;

    if (pastReceipt) {
      currentBudget = pastReceipt.budget;
      currentTotal = pastReceipt.total;
      currentRemaining = pastReceipt.remaining;
      itemsList = pastReceipt.items;
      dateStr = pastReceipt.date;
      resultResetBtn.classList.add('hidden'); // 履歴閲覧時はリセットボタン非表示
    } else {
      currentBudget = budget;
      currentTotal = calcTotal();
      currentRemaining = currentBudget - currentTotal;
      itemsList = [
        ...shoppingItems.filter(i => i.price !== null),
        ...extraItems
      ];
      dateStr = new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      receiptDate.dataset.rawDate = new Date().toISOString();
      resultResetBtn.classList.remove('hidden');
    }

    receiptDate.textContent = dateStr;
    resultBudget.textContent = formatYen(currentBudget);
    resultTotal.textContent = formatYen(currentTotal);
    resultBalance.textContent = formatYen(currentRemaining);

    if (currentRemaining < 0) {
      resultBalance.classList.add('over');
      resultBalance.classList.remove('under');
    } else {
      resultBalance.classList.remove('over');
      resultBalance.classList.add('under');
    }

    resultItemsDetail.innerHTML = '';

    if (itemsList.length === 0) {
      resultItemsDetail.innerHTML = '<div style="text-align:center;color:#999;">購入した品目はありません</div>';
    } else {
      itemsList.forEach((item) => {
        const calculatedPrice = pastReceipt ? item.price : calculateWithTax(item.price, item.taxRate);
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `<span class="detail-label">${escapeHtml(item.name)} <small>(${item.taxRate}%)</small></span><span>${formatYen(calculatedPrice)}</span>`;
        resultItemsDetail.appendChild(row);
      });
    }

    resultOverlay.classList.remove('hidden');
  }

  function saveReceiptToHistory() {
    const purchased = [...shoppingItems.filter(i => i.price !== null), ...extraItems];
    if (purchased.length === 0 && budget === 0) return; // 空の場合は保存しない

    const items = purchased.map(i => ({
      name: i.name,
      taxRate: i.taxRate,
      price: calculateWithTax(i.price, i.taxRate)
    }));

    const total = calcTotal();
    const receipt = {
      id: Date.now(),
      date: new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      budget,
      total,
      remaining: budget - total,
      items
    };

    receiptHistory.unshift(receipt);
    saveState();
  }

  
  // ===== 音声入力 (Voice Input) =====
  const voiceBtn = $('#voice-btn');
  const voiceStatus = $('#voice-status');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition && voiceBtn) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isListening = false;

    voiceBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
        return;
      }
      try {
        voiceBtn.classList.add('listening');
        voiceBtn.querySelector('.mic-icon').textContent = '🔴';
        showVoiceStatus('お話しください...');
        isListening = true;
        recognition.start();
      } catch (e) {
        console.error(e);
        showVoiceStatus('エラー: ' + e.message);
        voiceBtn.classList.remove('listening');
        voiceBtn.querySelector('.mic-icon').textContent = '🎙️';
        isListening = false;
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log('音声認識結果:', transcript);
      parseAndAddVoiceItem(transcript);
    };

    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.onend = () => {
      voiceBtn.classList.remove('listening');
      voiceBtn.querySelector('.mic-icon').textContent = '🎙️';
      isListening = false;
    };

    recognition.onerror = (event) => {
      console.error('音声認識エラー:', event.error);
      if (event.error === 'not-allowed') {
        showVoiceStatus('マイクの許可が必要です');
      } else {
        showVoiceStatus('エラー: もう一度');
      }
      voiceBtn.classList.remove('listening');
      voiceBtn.querySelector('.mic-icon').textContent = '🎙️';
      isListening = false;
    };

    function showVoiceStatus(text) {
      voiceStatus.textContent = text;
      voiceStatus.classList.add('show');
      setTimeout(() => {
        voiceStatus.classList.remove('show');
      }, 3000);
    }

    function parseAndAddVoiceItem(text) {
      text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      text = text.replace(/(円|えん|くらい|ぐらい|です|だね)/g, ' ');

      const match = text.match(/(.+?)[\s、]+(\d+)$/);
      
      let name = '';
      let price = null;

      if (match) {
        name = match[1].trim();
        price = parseInt(match[2], 10);
      } else {
        const onlyNum = text.match(/^\d+$/);
        if (onlyNum) {
          showVoiceStatus('品名も一緒に教えてね');
          return;
        }
        name = text.trim();
      }

      if (!name) return;

      if (price !== null) {
        const existingItem = shoppingItems.find(i => i.name === name);
        if (existingItem) {
          existingItem.price = price;
          existingItem.checked = true;
          showVoiceStatus(`${name}を${price}円で記録！`);
          renderShoppingList();
        } else {
          const taxRate = getTaxRate(name); 
          extraItems.push({ id: nextId++, name, price, taxRate });
          showVoiceStatus(`${name}を${price}円で追加！`);
          renderExtraList();
        }
      } else {
        const taxRate = getTaxRate(name);
        shoppingItems.unshift({ id: nextId++, name, price: null, checked: false, taxRate });
        showVoiceStatus(`${name}をメモしました！`);
        renderShoppingList();
      }
      
      updateBalance();
      saveState();
    }
  } else if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      showVoiceStatus('このブラウザは音声入力非対応です');
    });
  }
\n  // ===== History Modal =====
  historyBtn.addEventListener('click', () => {
    renderHistory();
    historyOverlay.classList.remove('hidden');
  });

  historyCloseBtn.addEventListener('click', () => {
    historyOverlay.classList.add('hidden');
  });

  historyOverlay.addEventListener('click', (e) => {
    if (e.target === historyOverlay) historyOverlay.classList.add('hidden');
  });

  function renderHistory() {
    historyList.innerHTML = '';
    if (receiptHistory.length === 0) {
      historyEmpty.classList.remove('hidden');
      if (historyClearAllBtn) historyClearAllBtn.classList.add('hidden');
    } else {
      historyEmpty.classList.add('hidden');
      if (historyClearAllBtn) historyClearAllBtn.classList.remove('hidden');
      receiptHistory.forEach(receipt => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'history-item-content';
        contentDiv.innerHTML = `
          <div>
            <div class="history-item-date">${receipt.date}</div>
            <div class="history-item-total">${formatYen(receipt.total)}</div>
          </div>
          <div class="history-item-arrow">〉</div>
        `;
        contentDiv.addEventListener('click', () => {
          historyOverlay.classList.add('hidden');
          showResult(receipt);
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'history-delete-btn';
        delBtn.innerHTML = '✕';
        delBtn.setAttribute('aria-label', '履歴を削除');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('このレシート履歴を削除しますか？')) {
            receiptHistory = receiptHistory.filter(r => r.id !== receipt.id);
            saveState();
            renderHistory();
          }
        });

        li.appendChild(contentDiv);
        li.appendChild(delBtn);
        historyList.appendChild(li);
      });
    }
  }

  if (historyClearAllBtn) {
    historyClearAllBtn.addEventListener('click', () => {
      if (receiptHistory.length === 0) return;
      if (confirm('すべてのレシート履歴を削除しますか？')) {
        receiptHistory = [];
        saveState();
        renderHistory();
      }
    });
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
    saveState(); // clearStateを使わず、設定や履歴を残すために上書き保存
  }

  // ===== Persistence (localStorage) =====
  function saveState() {
    try {
      const state = { 
        budget, budgetSet, shoppingItems, extraItems, 
        nextId, isTaxInclusive, taxMemory, receiptHistory 
      };
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
      isTaxInclusive = state.isTaxInclusive || false;
      taxMemory = state.taxMemory || {};
      receiptHistory = state.receiptHistory || [];

      // Restore missing taxRates for older saved data
      shoppingItems.forEach(i => i.taxRate = i.taxRate || 8);
      extraItems.forEach(i => i.taxRate = i.taxRate || 10);

      // UI Sync
      if (isTaxInclusive) taxModeInc.checked = true;
      else taxModeExc.checked = true;

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

  // ===== Utility =====
  function formatYen(amount) {
    if (amount < 0) return `-¥${Math.abs(amount).toLocaleString()}`;
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
