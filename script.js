// Faksz AI Frontend (tanpa dark mode) + LocalStorage history + typewriter streaming

const $ = sel => document.querySelector(sel);
const chatWindow = $('#chatWindow');
const chatForm = $('#chatForm');
const input = $('#userInput');
const sendBtn = $('#sendBtn');
const fab = $('#fab');
const clearBtn = $('#clearHistory');

const LS_KEY = 'faksz_ai_history_v1';

function saveHistory(messages) {
  localStorage.setItem(LS_KEY, JSON.stringify(messages));
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}
input.addEventListener('input', () => autoGrow(input));

function createAvatar(isBot) {
  const div = document.createElement('div');
  div.className = 'avatar ' + (isBot ? 'avatar-bot' : 'avatar-user');
  if (isBot) {
    div.innerHTML = `
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7C3AED"/>
          <stop offset="100%" stop-color="#22D3EE"/></linearGradient></defs>
        <circle cx="60" cy="60" r="56" fill="url(#g2)"/>
        <circle cx="60" cy="64" r="30" fill="#FFEAD5"/>
        <path d="M30 50 C45 25 75 25 90 50 L88 42 L78 46 L72 36 L62 44 L54 34 L45 46 L36 40 Z" fill="#222"/>
      </svg>`;
  } else {
    div.textContent = '🧑';
  }
  return div;
}

function renderMessage(role, text) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (role === 'assistant' ? 'bot' : 'user');

  const avatar = createAvatar(role === 'assistant');
  avatar.classList.add('avatar');
  wrap.appendChild(avatar);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  wrap.appendChild(bubble);

  chatWindow.appendChild(wrap);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function typewriterAppend(el, chunk, speed=10) {
  return new Promise(resolve => {
    let i = 0;
    function tick() {
      el.textContent += chunk[i++];
      chatWindow.scrollTop = chatWindow.scrollHeight;
      if (i < chunk.length) {
        setTimeout(tick, speed);
      } else resolve();
    }
    if (!chunk) return resolve();
    tick();
  });
}

// Load existing history
let history = loadHistory();
// Render existing
if (history.length === 0) {
  renderMessage('assistant', 'Hai! Aku Faksz — senpai anime. Ada yang bisa kubantu?');
} else {
  history.forEach(m => renderMessage(m.role, m.content));
}

clearBtn?.addEventListener('click', () => {
  if (confirm('Hapus semua riwayat?')) {
    history = [];
    saveHistory(history);
    chatWindow.innerHTML = '';
    renderMessage('assistant', 'Riwayat dibersihkan. Mulai obrolan baru ya!');
  }
});

fab.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  input.focus();
});

async function sendMessage(text) {
  // Push user
  history.push({ role: 'user', content: text });
  saveHistory(history);
  renderMessage('user', text);

  // Placeholder bot bubble for streaming
  const botBubble = renderMessage('assistant', '');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    });

    if (!res.ok) {
      throw new Error('Koneksi gagal: ' + res.status);
    }

    // Non-streaming API -> ambil JSON, lalu typewriter
    const data = await res.json();
    const reply = data.reply || 'Maaf, aku tidak yakin.';

    // Append with typewriter effect
    await typewriterAppend(botBubble, reply, 6);

    history.push({ role: 'assistant', content: reply });
    saveHistory(history);
  } catch (err) {
    botBubble.textContent = 'Error: ' + err.message;
  }
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  autoGrow(input);
  sendMessage(text);
});
   
