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
  
  const extraNameInput = $('#extra-name-input') || document.createElement('input');
  const extraPriceInput = $('#extra-price-input') || document.createElement('input');
  const addExtraBtn = $('#add-extra-btn') || document.createElement('button');
  const extraListEl = $('#extra-list') || document.createElement('ul');
  
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

  // 音声コマンド用のキーワード（「完了」「レシート」等でレシート画面を表示）
  const VOICE_COMPLETE_KEYWORDS = ['完了', 'かんりょう', 'レシート', 'れしーと', '買い物完了', 'かいものかんりょう'];

  function isVoiceCommand(text) {
    const normalized = text.toLowerCase().replace(/\s/g, '');
    return VOICE_COMPLETE_KEYWORDS.some(kw => normalized.includes(kw));
  }

  // 音声入力の解析処理（parseAndAddVoiceItem）の受け皿。
  // マイクボタンの準備ができたときに、下の音声入力の部分で中身が入る
  let parseVoiceText = null;

  // 「品名 + 数字 + 円」の形か調べる（例：ひじき250円）。品名の部分が空（250円だけ）なら false
  function looksLikeNameWithPrice(text) {
    return /[^\s0-9０-９円][^]*?[0-9０-９]+\s*(円|えん)/.test(text);
  }

  function addShoppingItem() {
    const name = itemNameInput.value.trim();
    if (!name) { itemNameInput.focus(); return; }

    // 音声コマンドチェック：「完了」「レシート」等ならレシート画面を表示
    if (isVoiceCommand(name)) {
      setTimeout(() => {
        itemNameInput.value = '';
        toggleClearBtn();
      }, 10);
      showResult();
      return;
    }

    // キーボードの音声入力などで「ひじき250円」のように金額つきで入ったときは、
    // マイクボタンと同じ解析（品名と金額に分ける処理）で追加する
    if (parseVoiceText && looksLikeNameWithPrice(name)) {
      // 「ひじきを250円」の「を」が品名に残らないよう、数字の直前の「を」だけ取り除く
      const spoken = name.replace(/を\s*(?=[0-9０-９])/g, ' ');
      setTimeout(() => {
        itemNameInput.value = '';
        toggleClearBtn();
        itemNameInput.focus();
      }, 10);
      parseVoiceText(spoken);
      return;
    }

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
  let voiceStatusTimer = null;

  function showVoiceStatus(text) {
    if (!voiceStatus) return;
    voiceStatus.classList.remove('hidden');
    voiceStatus.textContent = text;
    voiceStatus.classList.add('show');
    if (voiceStatusTimer) clearTimeout(voiceStatusTimer);
    voiceStatusTimer = setTimeout(() => {
      voiceStatus.classList.remove('show');
    }, 3000);
  }
  
  // 音声入力の動きを記録するための「フック」。通常は何もしない。
  // 確認用表示（下の DEBUG ブロック）がある場合だけ、中身が差し替わる。
  let voiceLog = () => {};
  let voiceAttach = () => {};

  // DEBUG-START 音声入力の確認用表示（iPhoneの不具合調査用。調査後はこのブロックごと削除できます）
  // 画面の中に小さなログを出すだけで、外部への送信は一切しません。
  // 表示のしかた：画面上部の「のこり予算」を3秒以内に5回タップ（またはURLに ?debug=1）
  (() => {
    const BUILD = 'v20';
    const STORAGE_KEY = 'voiceDebug';
    const MAX_LINES = 40;
    const lines = [];
    let panel = null;
    let logBody = null;
    let recCounter = 0;

    function isEnabled() {
      try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    function setEnabled(on) {
      try { localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
      render();
    }

    function ensurePanel() {
      if (panel) return;
      panel = document.createElement('div');
      panel.style.cssText = 'position:fixed;left:0;bottom:0;right:90px;max-height:35vh;overflow:hidden;' +
        'background:rgba(0,0,0,0.78);color:#9f9;font:10px/1.35 monospace;padding:4px 6px;' +
        'z-index:9999;pointer-events:none;white-space:pre-wrap;word-break:break-all;';

      const head = document.createElement('div');
      head.textContent = '音声デバッグ ' + BUILD +
        ' / SR:' + (SpeechRecognition ? 'あり' : 'なし') +
        ' / standalone:' + (navigator.standalone ? 'はい' : 'いいえ') + ' ';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '閉じる';
      closeBtn.style.cssText = 'pointer-events:auto;font-size:10px;padding:1px 6px;';
      closeBtn.addEventListener('click', () => setEnabled(false));
      head.appendChild(closeBtn);

      logBody = document.createElement('div');
      panel.appendChild(head);
      panel.appendChild(logBody);
      document.body.appendChild(panel);
    }

    function render() {
      if (!isEnabled()) {
        if (panel) panel.style.display = 'none';
        return;
      }
      ensurePanel();
      panel.style.display = 'block';
      // 新しいログが下に来るので、最後の数行だけ表示する
      logBody.textContent = lines.slice(-14).join('\n');
    }

    voiceLog = (msg) => {
      lines.push((performance.now() / 1000).toFixed(2) + 's ' + msg);
      if (lines.length > MAX_LINES) lines.shift();
      render();
    };

    // 認識インスタンスの全イベントを記録する（番号 #n は何個目の認識か）
    voiceAttach = (rec) => {
      const id = ++recCounter;
      ['start', 'audiostart', 'soundstart', 'speechstart', 'speechend',
       'soundend', 'audioend', 'end', 'nomatch'].forEach((name) => {
        rec.addEventListener(name, () => voiceLog('#' + id + ' ' + name));
      });
      rec.addEventListener('result', (e) => {
        const last = e.results[e.results.length - 1];
        voiceLog('#' + id + ' result final=' + last.isFinal + ' "' + last[0].transcript + '"');
      });
      rec.addEventListener('error', (e) => {
        voiceLog('#' + id + ' error ' + e.error + (e.message ? ' (' + e.message + ')' : ''));
      });
      voiceLog('#' + id + ' 作成');
    };

    // URLの ?debug=1 / ?debug=0 で表示を切り替える
    try {
      const flag = new URLSearchParams(location.search).get('debug');
      if (flag === '1') setEnabled(true);
      if (flag === '0') setEnabled(false);
    } catch (e) { /* ignore */ }

    // ホーム画面のアプリでは URL を変えられないので、「のこり予算」の5回タップでも切り替えられる
    const label = document.querySelector('.balance-label');
    if (label) {
      let taps = 0;
      let tapTimer = null;
      label.addEventListener('click', () => {
        taps += 1;
        if (tapTimer) clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { taps = 0; }, 3000);
        if (taps >= 5) {
          taps = 0;
          setEnabled(!isEnabled());
        }
      });
    }

    render();
  })();
  // DEBUG-END

  if (voiceBtn) {
    const START_TIMEOUT_MS = 2000;  // 開始（onstart）が来るまで待つ時間
    const END_TIMEOUT_MS = 1500;    // 終了（onend）が来るまで待つ時間
    const RETRY_DELAY_MS = 300;     // 再試行までの間隔
    const MAX_START_ATTEMPTS = 2;   // 最初の1回 + 再試行1回

    // 終了（onend）が確認できるまで保持する。入っている間は次の認識を始めない
    let recognition = null;
    let isListening = false;        // ボタンが赤い状態
    let pendingAttempt = 0;         // 前の認識が終わったら始める予約（0なら予約なし）
    let endTimer = null;
    let retryTimer = null;

    function setListeningUI(on) {
      isListening = on;
      voiceBtn.classList.toggle('listening', on);
    }

    // 前の認識の終了が確認できたので、予約があれば少し待ってから次を始める
    function releaseRecognition(rec) {
      if (recognition !== rec) return;
      recognition = null;
      if (endTimer) {
        clearTimeout(endTimer);
        endTimer = null;
      }
      voiceLog('解放 (予約=' + pendingAttempt + ')');
      if (pendingAttempt) {
        const attempt = pendingAttempt;
        pendingAttempt = 0;
        retryTimer = setTimeout(() => {
          retryTimer = null;
          startRecognition(attempt);
        }, RETRY_DELAY_MS);
      }
    }

    // onend が来ない場合の安全策：一定時間たったら abort() して強制的に解放する
    function armEndTimer(rec) {
      if (endTimer) clearTimeout(endTimer);
      endTimer = setTimeout(() => {
        endTimer = null;
        if (recognition !== rec) return;
        voiceLog('onendが来ないので強制解放');
        try { rec.abort(); } catch (e) { /* ignore */ }
        releaseRecognition(rec);
      }, END_TIMEOUT_MS);
    }

    function startRecognition(attempt) {
      voiceLog('開始 試行' + attempt);
      const rec = new SpeechRecognition();
      recognition = rec;
      rec.lang = 'ja-JP';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      voiceAttach(rec);

      let started = false;    // onstart が来たか
      let committed = false;  // 結果を画面に反映済みか
      let settled = false;    // 失敗・エラーの後始末が済んだか
      let latest = '';
      let startTimer = null;

      function commit() {
        if (committed || settled) return;
        const text = latest.trim();
        if (!text) return;
        committed = true;
        setListeningUI(false);
        // abort() はせず、認識が自然に終わる（onend）のを待つ。来なければ安全タイマーで解放
        armEndTimer(rec);
        parseAndAddVoiceItem(text);
      }

      // 開始できなかったとき：中断して、1回だけ作り直して再試行する。それでもだめなら失敗を表示
      function failStart(reason) {
        // ユーザーが中止した後（isListening が false）は再試行しない
        if (settled || committed || !isListening) return;
        settled = true;
        if (startTimer) {
          clearTimeout(startTimer);
          startTimer = null;
        }
        voiceLog('開始失敗: ' + reason + ' (試行' + attempt + ')');
        if (attempt < MAX_START_ATTEMPTS) {
          pendingAttempt = attempt + 1;
        } else {
          setListeningUI(false);
          showVoiceStatus('開始できませんでした。もう一度タップしてください');
        }
        try { rec.abort(); } catch (e) { /* ignore */ }
        armEndTimer(rec);
      }

      rec.onstart = () => {
        if (recognition !== rec || settled) return;
        started = true;
        if (startTimer) {
          clearTimeout(startTimer);
          startTimer = null;
        }
        showVoiceStatus('🎤 お話しください...');
      };

      rec.onresult = (event) => {
        if (recognition !== rec || committed || settled) return;
        let transcript = '';
        let isFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) transcript += res[0].transcript;
          if (res && res.isFinal) isFinal = true;
        }
        transcript = transcript.trim();
        if (!transcript) return;
        latest = transcript;

        if (isFinal) {
          commit();
        } else {
          showVoiceStatus('🎤 ' + latest + '...');
        }
      };

      rec.onerror = (event) => {
        // 古い認識（すでに解放済み）のイベントや、反映済みの後のエラーは無視する
        if (recognition !== rec || settled) return;
        if (startTimer) {
          clearTimeout(startTimer);
          startTimer = null;
        }
        if (committed) return;
        if (latest) {
          commit();
          return;
        }
        settled = true;
        if (event.error === 'not-allowed') {
          alert('マイクの使用が許可されていません。設定をご確認ください。');
        } else if (event.error === 'no-speech') {
          showVoiceStatus('音声が聞き取れませんでした');
        } else if (event.error !== 'aborted') {
          showVoiceStatus('エラー: ' + event.error);
        }
        setListeningUI(false);
        pendingAttempt = 0;
        armEndTimer(rec);
      };

      rec.onend = () => {
        if (recognition !== rec) return;
        if (startTimer) {
          clearTimeout(startTimer);
          startTimer = null;
        }
        if (!committed && !settled && latest) {
          commit();
        } else if (!started && !committed && !settled && isListening) {
          // 一度も開始しないまま終わった
          failStart('開始前にonend');
        }
        if (!pendingAttempt) setListeningUI(false);
        releaseRecognition(rec);
      };

      try {
        setListeningUI(true);
        showVoiceStatus('🎤 準備中...');
        rec.start();
        startTimer = setTimeout(() => {
          startTimer = null;
          if (recognition === rec && !started) failStart('onstartが来ない');
        }, START_TIMEOUT_MS);
      } catch (e) {
        voiceLog('start()が例外: ' + e.message);
        alert('マイクの起動に失敗しました。' + e.message);
        settled = true;
        setListeningUI(false);
        releaseRecognition(rec);
      }
    }

    voiceBtn.addEventListener('click', () => {
      voiceLog('タップ listening=' + isListening + ' 保持中=' + !!recognition);
      if (!SpeechRecognition) {
        alert('【お知らせ】\nホーム画面から開くアプリ版では、iPhoneの仕様により音声入力が使えない場合があります。\nSafariなどのブラウザから開くと使える可能性があります！');
        return;
      }

      // 聞き取り中（準備中・再試行待ちを含む）のタップは中止
      if (isListening) {
        pendingAttempt = 0;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        const rec = recognition;
        setListeningUI(false);
        showVoiceStatus('停止しました');
        if (rec) {
          try { rec.abort(); } catch (e) { /* ignore */ }
          armEndTimer(rec);
        }
        return;
      }

      // 前の認識がまだ終わっていないときは、終わるのを待ってから始める
      if (recognition) {
        setListeningUI(true);
        showVoiceStatus('🎤 準備中...');
        pendingAttempt = 1;
        return;
      }

      startRecognition(1);
    });

    // 品名欄に金額つきで入った文字も、同じ解析で追加できるようにする
    parseVoiceText = parseAndAddVoiceItem;

    function parseAndAddVoiceItem(text) {
      // 「完了」「レシート」などの音声コマンドならレシート画面を表示
      if (isVoiceCommand(text)) {
        showVoiceStatus('レシートを表示します🧾');
        showResult();
        return;
      }

      text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      
      let overrideTax = null;
      if (text.includes('10%') || text.includes('10パー') || text.includes('１０パー') || text.includes('じっぱー')) {
        overrideTax = 10;
        text = text.replace(/(10%|10パーセント|10パー|１０パー|じっぱー)/g, ' ');
      } else if (text.includes('8%') || text.includes('8パー') || text.includes('８パー') || text.includes('はっぱー')) {
        overrideTax = 8;
        text = text.replace(/(8%|8パーセント|8パー|８パー|はっぱー)/g, ' ');
      }

      text = text.replace(/(円|えん|くらい|ぐらい|です|だね)/g, '').trim();

      const match = text.match(/(.+?)(?:[\s、]+|(?=\d+))(\d+)$/);
      
      let name = '';
      let price = null;

      if (match) {
        name = match[1].trim();
        price = parseInt(match[2], 10);
      } else {
        const onlyNum = text.match(/^\d+$/);
        if (onlyNum) {
          showVoiceStatus('品名も教えてね');
          return;
        }
        name = text.trim();
      }

      if (!name) return;

      const taxRate = overrideTax !== null ? overrideTax : getTaxRate(name);
      if (overrideTax !== null) {
        taxMemory[name] = overrideTax;
      }

      if (price !== null) {
        const existingItem = shoppingItems.find(i => i.name === name);
        if (existingItem) {
          existingItem.price = price;
          existingItem.checked = true;
          if (overrideTax !== null) existingItem.taxRate = overrideTax;
          showVoiceStatus(`${name}を${price}円で記録！`);
        } else {
          shoppingItems.unshift({ id: nextId++, name, price: price, checked: true, taxRate });
          showVoiceStatus(`${name}を${price}円で追加！`);
        }
      } else {
        shoppingItems.unshift({ id: nextId++, name, price: null, checked: false, taxRate });
        showVoiceStatus(`${name}をメモ！`);
      }
      
      renderShoppingList();
      updateBalance();
      saveState();
    }  }


  
  // ===== Theme =====
  const themeBtn = $('#theme-btn');
  const themeOverlay = $('#theme-overlay');
  const themeCloseBtn = $('#theme-close-btn');
  const themeOptions = document.querySelectorAll('.theme-option-btn');
  
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeOptions.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
    });
  }

  themeBtn.addEventListener('click', () => {
    themeOverlay.classList.remove('hidden');
  });

  themeCloseBtn.addEventListener('click', () => {
    themeOverlay.classList.add('hidden');
  });

  themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-val');
      applyTheme(theme);
      state.theme = theme;
      saveState();
    });
  });

  // ===== History Modal =====
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
      const state = { theme: document.body.getAttribute("data-theme") || "simple", 
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
      extraItems = []; // Forced wipe of legacy extra items
      nextId = state.nextId || 1;
      isTaxInclusive = state.isTaxInclusive || false;
      if(state.theme) applyTheme(state.theme);
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
      navigator.serviceWorker.register('sw.js')
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {});
    });
  }

  // ===== Init =====
  loadState();
  renderShoppingList();
  updateBalance();
})();
