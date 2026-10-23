const chat = document.querySelector('#chat');
const count = document.querySelector('#count');
const button = document.querySelector('#summarize');
const result = document.querySelector('#result');
const summary = document.querySelector('#summary');
const errorBox = document.querySelector('#error');
const sample = `Mina: Anyone free to review the launch checklist today?\nRafi: I can do it after lunch, around 2.\nJo: I already checked the signup flow. The confirmation email still needs a final look.\nMina: Thanks Jo. Rafi, please focus on the mobile screenshots and the email copy.\nRafi: Got it. I will share notes before 4 pm.\nJo: The launch is still Friday morning, right?\nMina: Yes, 10 am. I will post the final link in this chat.\nRafi: Also, I can bring snacks for the demo.\nMina: Lovely, no need for everyone to join the prep call. I will send a short update afterward.`;

chat.addEventListener('input', () => { count.textContent = `${chat.value.length.toLocaleString()} characters`; });
document.querySelector('#sample').addEventListener('click', () => { chat.value = sample; chat.dispatchEvent(new Event('input')); chat.focus(); });

function renderMarkdown(text) {
  const escaped = text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let html = '';
  let inList = false;
  for (const line of escaped.split('\n')) {
    if (line.startsWith('## ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h2>${line.slice(3)}</h2>`; }
    else if (/^[-*] /.test(line)) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${line.slice(2)}</li>`; }
    else if (line.trim()) { if (inList) { html += '</ul>'; inList = false; } html += `<p>${line}</p>`; }
  }
  if (inList) html += '</ul>';
  return html;
}

button.addEventListener('click', async () => {
  errorBox.classList.add('hidden');
  result.classList.add('hidden');
  button.disabled = true;
  document.querySelector('.button-label').textContent = 'Taking the slow route…';
  try {
    const response = await fetch('/api/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat: chat.value, model: document.querySelector('#model').value.trim() }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something got in the way.');
    summary.innerHTML = renderMarkdown(data.summary);
    document.querySelector('#result-meta').textContent = `Made locally with ${data.model}${data.elapsedMs ? ` · ${Math.max(1, Math.round(data.elapsedMs / 1000))}s` : ''} · Your chat was sent only to Ollama on this device.`;
    result.classList.remove('hidden');
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('hidden');
  } finally {
    button.disabled = false;
    document.querySelector('.button-label').textContent = 'Make it easy';
  }
});

document.querySelector('#copy').addEventListener('click', async (event) => {
  await navigator.clipboard.writeText(summary.innerText);
  event.currentTarget.innerHTML = 'Copied <span>✓</span>';
  setTimeout(() => { event.currentTarget.innerHTML = 'Copy recap <span>⧉</span>'; }, 1400);
});
