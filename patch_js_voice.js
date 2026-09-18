const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

const voiceJs = `
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
        recognition.start();
        voiceBtn.classList.add('listening');
        voiceBtn.querySelector('.mic-icon').textContent = '🔴';
        showVoiceStatus('お話しください...');
        isListening = true;
      } catch (e) {
        console.error(e);
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
      showVoiceStatus('エラー: もう一度');
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
      // 全角数字を半角に
      text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      // 不要な文字を削除
      text = text.replace(/(円|えん|くらい|ぐらい|です|だね)/g, ' ');

      // 正規表現で「品名」と「金額」を抽出
      // パターン: (品名) (空白など) (数字)
      const match = text.match(/(.+?)[\\s、]+(\\d+)$/);
      
      let name = '';
      let price = null;

      if (match) {
        name = match[1].trim();
        price = parseInt(match[2], 10);
      } else {
        // 数字だけの入力かチェック
        const onlyNum = text.match(/^\\d+$/);
        if (onlyNum) {
          showVoiceStatus('品名も一緒に教えてね');
          return;
        }
        // 品名だけの場合
        name = text.trim();
      }

      if (!name) return;

      if (price !== null) {
        // --- 品名 + 金額 の場合 ---
        // 1. 買い物リスト（上）に同じ名前があるか探す
        const existingItem = shoppingItems.find(i => i.name === name);
        if (existingItem) {
          existingItem.price = price;
          existingItem.checked = true;
          showVoiceStatus(\`\${name}を\${price}円で記録！\`);
          renderShoppingList();
        } else {
          // 2. なければ「予定外の買い物（下）」に追加
          // 音声からの場合は、食品かもしれないのでとりあえずデフォルトの8%にしておく（後で手動変更可能）
          const taxRate = getTaxRate(name); 
          extraItems.push({ id: nextId++, name, price, taxRate });
          showVoiceStatus(\`\${name}を\${price}円で追加！\`);
          renderExtraList();
        }
      } else {
        // --- 品名だけ の場合 ---
        // 買い物リスト（上）に追加
        const taxRate = getTaxRate(name);
        shoppingItems.unshift({ id: nextId++, name, price: null, checked: false, taxRate });
        showVoiceStatus(\`\${name}をメモしました！\`);
        renderShoppingList();
      }
      
      updateBalance();
      saveState();
    }
  } else if (voiceBtn) {
    voiceBtn.style.display = 'none'; // 非対応ブラウザ
  }
`;

if (!js.includes('音声入力 (Voice Input)')) {
  js = js.replace('// ===== History =====', voiceJs + '\\n  // ===== History =====');
  fs.writeFileSync('app.js', js);
}
