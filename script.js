/* ================================
   AnimeBoy AI – Frontend Script
================================== */
const chatWindow = document.getElementById("chatWindow");
const chatForm   = document.getElementById("chatForm");
const userInput  = document.getElementById("userInput");
const sendBtn    = document.getElementById("sendBtn");
const themeToggle= document.getElementById("themeToggle");
const fab        = document.getElementById("fab");

// Theme toggle
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && prefersDark)) {
  document.documentElement.classList.add("dark");
  document.body.style.backgroundColor = "#0B1220";
}
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.textContent = isDark ? "🌙" : "☀️";
});

// Mobile FAB toggles scroll to bottom & focus
fab.addEventListener("click", () => {
  userInput.focus();
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

// Auto grow textarea height
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
});

// Submit with Enter (Shift+Enter for newline)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

const history = []; // {role:'user'|'model', content:'...'}

function renderMessage({ role, content, typing=false }) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${role}`;
  wrapper.innerHTML = `
    <div class="avatar ${role}"></div>
    <div class="bubble">${typing ? `<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>` : content}</div>
  `;
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return wrapper;
}

function updateTyping(node, text) {
  const bubble = node.querySelector(".bubble");
  bubble.textContent = text;
}

// Persona prompt (biar vibe anime cowok)
const SYSTEM_PROMPT =
  "Kamu adalah 'Faksz', senpai anime cowok yang ramah, santai, dan suportif. " +
  "Gaya bahasa ringan, sedikit humor, pakai emot yang wajar (misalnya: :) ✨). " +
  "Jawab singkat, jelas, dan beri contoh bila perlu. Hindari jawaban terlalu panjang.";

async function callGemini(messages) {
  // Panggil serverless function di /api/chat
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ messages, system: SYSTEM_PROMPT })
  });

  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.reply ?? "Maaf, aku belum ngerti nih :(";
}

// Initial greeting
renderMessage({ role:"bot", content:"Yo! Aku **Faksz**. Ada yang bisa kubantu? 🔥" })
  .querySelector(".bubble").innerHTML = "Yo! Aku <b>Faksz</b>. Ada yang bisa kubantu? 🔥";

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // render user
  renderMessage({ role:"user", content: text });
  history.push({ role:"user", content: text });
  userInput.value = "";
  userInput.style.height = "auto";

  // render typing
  const typingNode = renderMessage({ role:"bot", content:"", typing:true });

  try {
    const reply = await callGemini(history);
    updateTyping(typingNode, reply);
    history.push({ role:"model", content: reply });
  } catch (err) {
    console.error(err);
    updateTyping(typingNode, "Ups, server lagi error atau key-nya bermasalah. Coba lagi ya 🙏");
  } finally {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
