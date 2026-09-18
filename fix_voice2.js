const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// Remove the old voice block
const startIndex = js.indexOf('// ===== 音声入力 (Voice Input) =====');
const endIndex = js.indexOf('// ===== History Modal =====');

if (startIndex !== -1 && endIndex !== -1) {
  js = js.substring(0, startIndex) + js.substring(endIndex);
}

const newVoiceJs = `
  // ===== 音声入力 (Voice Input) =====
  const voiceBtn = $('#voice-btn');
  const voiceStatus = $('#voice-status');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function showVoiceStatus(text) {
    if (!voiceStatus) return;
    voiceStatus.textContent = text;
    voiceStatus.classList.add('show');
    setTimeout(() => {
      voiceStatus.classList.remove('show');
    }, 3000);
  }
  
  if (voiceBtn) {
    let recognition = null;
    let isListening = false;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        parseAndAddVoiceItem(transcript);
      };

      recognition.onspeechend = () => recognition.stop();

      recognition.onend = () => {
        voiceBtn.classList.remove('listening');
        voiceBtn.querySelector('.mic-icon').textContent = '🎙️';
        isListening = false;
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          alert('マイクの使用が許可されていません。設定をご確認ください。');
        } else {
          showVoiceStatus('エラー: ' + event.error);
        }
        voiceBtn.classList.remove('listening');
        voiceBtn.querySelector('.mic-icon').textContent = '🎙️';
        isListening = false;
      };
    }

    voiceBtn.addEventListener('click', () => {
      if (!SpeechRecognition) {
        alert('【お知らせ】\\nホーム画面から開くアプリ版では、iPhoneの仕様により音声入力が使えない場合があります。\\nSafariなどのブラウザから開くと使える可能性があります！');
        return;
      }

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
        alert('マイクの起動に失敗しました。' + e.message);
        voiceBtn.classList.remove('listening');
        voiceBtn.querySelector('.mic-icon').textContent = '🎙️';
        isListening = false;
      }
    });

    function parseAndAddVoiceItem(text) {
      text = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      text = text.replace(/(円|えん|くらい|ぐらい|です|だね)/g, ' ');

      const match = text.match(/(.+?)[\\s、]+(\\d+)$/);
      
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

      if (price !== null) {
        const existingItem = shoppingItems.find(i => i.name === name);
        if (existingItem) {
          existingItem.price = price;
          existingItem.checked = true;
          showVoiceStatus(\`\${name}を\${price}円で記録！\`);
          renderShoppingList();
        } else {
          const taxRate = getTaxRate(name); 
          extraItems.push({ id: nextId++, name, price, taxRate });
          showVoiceStatus(\`\${name}を\${price}円で追加！\`);
          renderExtraList();
        }
      } else {
        const taxRate = getTaxRate(name);
        shoppingItems.unshift({ id: nextId++, name, price: null, checked: false, taxRate });
        showVoiceStatus(\`\${name}をメモ！\`);
        renderShoppingList();
      }
      
      updateBalance();
      saveState();
    }
  }

`;

js = js.replace('// ===== History Modal =====', newVoiceJs + '\\n  // ===== History Modal =====');
fs.writeFileSync('app.js', js);
