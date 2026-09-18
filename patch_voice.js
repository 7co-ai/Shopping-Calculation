const fs = require('fs');

// 1. HTML Patch
let html = fs.readFileSync('index.html', 'utf8');
const voiceHtml = `
  <!-- ===== 音声入力ボタン ===== -->
  <button id="voice-btn" class="voice-fab" aria-label="音声入力">
    <span class="mic-icon">🎙️</span>
    <span id="voice-status" class="voice-status hidden">♪ ピコン</span>
  </button>
`;
if (!html.includes('id="voice-btn"')) {
  html = html.replace('  <script src="app.js"></script>', voiceHtml + '\n  <script src="app.js"></script>');
  fs.writeFileSync('index.html', html);
}

// 2. CSS Patch
let css = fs.readFileSync('style.css', 'utf8');
const voiceCss = `
/* ===== 音声入力ボタン ===== */
.voice-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.voice-fab:active {
  transform: scale(0.9);
}

.voice-fab.listening {
  background: linear-gradient(135deg, #f44336, #c62828);
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.5), 0 0 0 10px rgba(244, 67, 54, 0.2);
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
}

.voice-status {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(0,0,0,0.7);
  color: white;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.voice-status.show {
  opacity: 1;
  transform: translateY(0);
}
`;
if (!css.includes('.voice-fab')) {
  fs.writeFileSync('style.css', css + '\n' + voiceCss);
}

