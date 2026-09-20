const fs = require('fs');

let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#4CAF50">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="買い物メモ">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <title>買い物計算メモ</title>
  <link rel="stylesheet" href="style.css">
</head>
<body data-theme="simple">
  <div id="app">
    <!-- ===== 固定ヘッダー：残高表示 ===== -->
    <header id="balance-bar">
      <div class="balance-label">のこり予算</div>
      <div id="balance-amount" class="balance-amount">¥0</div>
      <div class="header-actions">
        <!-- Theme Switcher -->
        <button id="theme-btn" class="header-icon-btn" aria-label="テーマ変更">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <button id="history-btn" class="header-icon-btn" aria-label="履歴">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </button>
      </div>
    </header>

    <main>
      <!-- ===== 予算設定エリア ===== -->
      <section id="budget-section" class="card">
        <div class="budget-header">
          <h2 class="title-with-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            今日の予算
          </h2>
          <div class="tax-toggle">
            <label class="tax-radio">
              <input type="radio" name="tax-mode" id="tax-mode-exc" value="exclusive" checked>
              <span class="tax-radio-label">税抜 <small>(+税)</small></span>
            </label>
            <label class="tax-radio">
              <input type="radio" name="tax-mode" id="tax-mode-inc" value="inclusive">
              <span class="tax-radio-label">税込</span>
            </label>
          </div>
        </div>
        <div class="budget-input-row">
          <div class="input-with-yen">
            <span class="yen-inside">¥</span>
            <input type="number" id="budget-input" inputmode="numeric" pattern="[0-9]*"
                   placeholder="例: 3000" min="0" step="1">
          </div>
          <button id="budget-set-btn" class="btn btn-primary">設定</button>
        </div>
        <div id="budget-display" class="budget-display hidden">
          <span>予算: <strong id="budget-value">¥0</strong></span>
          <button id="budget-edit-btn" class="btn btn-small btn-outline">変更</button>
        </div>
      </section>

      <!-- ===== 買い物リストエリア ===== -->
      <section id="list-section" class="card">
        <h2 class="title-with-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          買い物リスト
        </h2>
        <div class="add-item-row">
          <div class="input-with-clear">
            <input type="text" id="item-name-input" placeholder="品名を入力"
                   enterkeyhint="done">
            <button type="button" id="item-name-clear" class="input-clear-btn" aria-label="入力をクリア">✕</button>
          </div>
          <button id="add-item-btn" class="btn btn-primary">追加</button>
        </div>
        <div id="list-toolbar" class="list-toolbar hidden">
          <label class="select-all-label">
            <input type="checkbox" id="select-all-cb" class="item-checkbox">
            <span>すべて選択</span>
          </label>
          <button id="delete-checked-btn" class="btn btn-small btn-danger" disabled>
            <span>✕ 選択を削除</span>
          </button>
        </div>
        <ul id="shopping-list" class="shopping-list"></ul>
      </section>

      <!-- ===== 完了ボタン ===== -->
      <section class="card complete-section">
        <button id="complete-btn" class="btn btn-complete">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          買い物を完了する
        </button>
      </section>

      <!-- ===== レシート（結果）モーダル ===== -->
      <div id="result-overlay" class="overlay hidden">
        <div class="receipt-modal">
          <div class="receipt-header">
            <svg class="receipt-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h2>RECEIPT</h2>
            <div id="receipt-date" class="receipt-date"></div>
          </div>
          <div class="receipt-body">
            <div class="receipt-row">
              <span class="receipt-label">予算 (Budget)</span>
              <span id="result-budget" class="receipt-value">¥0</span>
            </div>
            <div class="receipt-divider"></div>
            <div id="result-items-detail" class="receipt-items-detail"></div>
            <div class="receipt-divider"></div>
            <div class="receipt-row receipt-total-row">
              <span class="receipt-label">合計 (Total)</span>
              <span id="result-total" class="receipt-total-value">¥0</span>
            </div>
            <div class="receipt-row receipt-balance-row">
              <span class="receipt-label">残高 (Balance)</span>
              <span id="result-balance" class="receipt-balance-value">¥0</span>
            </div>
          </div>
          <div class="receipt-actions">
            <button id="result-close-btn" class="btn btn-primary btn-wide">閉じる</button>
            <button id="result-reset-btn" class="btn btn-outline btn-wide">リセットして新しく始める</button>
          </div>
        </div>
      </div>

      <!-- ===== 履歴モーダル ===== -->
      <div id="history-overlay" class="overlay hidden">
        <div class="history-modal">
          <div class="history-header">
            <h2 class="title-with-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8v4l3 3"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              過去のレシート
            </h2>
            <div class="history-header-actions">
              <button id="history-clear-all-btn" class="icon-action-btn" aria-label="すべての履歴を削除" title="すべての履歴を削除">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button id="history-close-btn" class="icon-close-btn" aria-label="閉じる">✕</button>
            </div>
          </div>
          <ul id="history-list" class="history-list"></ul>
          <div id="history-empty" class="history-empty hidden">履歴はありません</div>
        </div>
      </div>
      
      <!-- ===== テーマ選択モーダル ===== -->
      <div id="theme-overlay" class="overlay hidden">
        <div class="history-modal" style="max-height: 50vh;">
          <div class="history-header">
            <h2 class="title-with-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              テーマ設定
            </h2>
            <div class="history-header-actions">
              <button id="theme-close-btn" class="icon-close-btn" aria-label="閉じる">✕</button>
            </div>
          </div>
          <div class="theme-options">
            <button class="theme-option-btn active" data-theme-val="simple">
              <div class="theme-color-circle" style="background: #4CAF50;"></div>
              <span>シンプル (Green)</span>
            </button>
            <button class="theme-option-btn" data-theme-val="sakura">
              <div class="theme-color-circle" style="background: #f472b6;"></div>
              <span>さくら (Pink)</span>
            </button>
            <button class="theme-option-btn" data-theme-val="ocean">
              <div class="theme-color-circle" style="background: #38bdf8;"></div>
              <span>オーシャン (Blue)</span>
            </button>
          </div>
        </div>
      </div>
      
    </main>
  </div>


  <!-- ===== 音声入力ボタン ===== -->
  <button id="voice-btn" class="voice-fab" aria-label="音声入力">
    <svg class="mic-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
    <span id="voice-status" class="voice-status hidden">♪ ピコン</span>
  </button>

  <script src="app.js"></script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
