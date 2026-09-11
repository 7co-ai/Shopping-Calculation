const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Add DOM element for historyClearAllBtn
code = code.replace(
  "const historyEmpty = $('#history-empty');",
  "const historyEmpty = $('#history-empty');\n  const historyClearAllBtn = $('#history-clear-all-btn');"
);

// 2. Fix the input clear issue (remove setTimeout)
code = code.replace(
  "    itemNameInput.value = '';\n    toggleClearBtn();\n    setTimeout(() => itemNameInput.focus(), 50);",
  "    itemNameInput.blur();\n    itemNameInput.value = '';\n    toggleClearBtn();\n    itemNameInput.focus();"
);

// 3. Add history item delete logic and render changes
const newRenderHistory = `
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
        contentDiv.innerHTML = \`
          <div>
            <div class="history-item-date">\${receipt.date}</div>
            <div class="history-item-total">\${formatYen(receipt.total)}</div>
          </div>
          <div class="history-item-arrow">〉</div>
        \`;
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
`;

code = code.replace(/function renderHistory\(\) \{[\s\S]*?\}(?=\n\n  \/\/ ===== Reset =====)/, newRenderHistory.trim());

fs.writeFileSync('app.js', code);
