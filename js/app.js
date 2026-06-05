/* ─── State ─── */
let activePhase = null;
let currentPromptText = '';
let currentFontLevel = 0; // -1 = small, 0 = normal, 1 = large

/* ─── Theme ─── */
function initTheme() {
  const saved = localStorage.getItem('erp-theme') || 'dark';
  applyTheme(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('erp-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
}

/* ─── Font size ─── */
function initFontSize() {
  const saved = parseInt(localStorage.getItem('erp-font') || '0', 10);
  currentFontLevel = isNaN(saved) ? 0 : Math.max(-1, Math.min(1, saved));
  applyFontSize();
}

function changeFontSize(delta) {
  currentFontLevel = Math.max(-1, Math.min(1, currentFontLevel + delta));
  localStorage.setItem('erp-font', currentFontLevel);
  applyFontSize();
}

function applyFontSize() {
  const levels = ['small', 'normal', 'large'];
  document.documentElement.setAttribute('data-font', levels[currentFontLevel + 1]);
  const decBtn = document.getElementById('font-dec');
  const incBtn = document.getElementById('font-inc');
  if (decBtn) decBtn.disabled = currentFontLevel <= -1;
  if (incBtn) incBtn.disabled = currentFontLevel >= 1;
}

/* ─── Timeline rendering ─── */
function renderTimeline() {
  const tl = document.getElementById('timeline');
  tl.innerHTML = '';
  PHASES.forEach((p) => {
    const el = document.createElement('div');
    el.className = 'phase';
    el.id = 'phase-' + p.id;
    el.innerHTML = `
      <div class="phase-card">
        <div class="phase-meta">
          <span class="phase-tag ${p.tagClass}">${p.tag}</span>
          <span class="phase-duration">${p.duration}</span>
        </div>
        <div class="phase-title">${p.title}</div>
        <div class="phase-desc">${p.desc}</div>
        <div class="topic-pills">
          ${p.topics.map(t => `<span class="topic-pill">${t}</span>`).join('')}
        </div>
      </div>
    `;
    el.addEventListener('click', () => openPhase(p.id));
    tl.appendChild(el);
  });
}

/* ─── Detail panel ─── */
function openPhase(id) {
  if (activePhase === id) {
    closePanel();
    return;
  }
  activePhase = id;
  const p = PHASES.find(x => x.id === id);

  document.querySelectorAll('.phase').forEach(el => el.classList.remove('active'));
  document.getElementById('phase-' + id).classList.add('active');
  document.getElementById('active-phase-label').textContent = p.duration;

  const weeksHTML = p.weeks.map(w => `
    <div class="week-card">
      <div class="week-label">${w.label}</div>
      <div class="week-name">${w.name}</div>
      <ul class="skill-list">
        ${w.skills.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const milestonesHTML = p.milestones.map(m => `
    <div class="milestone-item">
      <div class="milestone-dot" style="background:${m.color}; box-shadow: 0 0 6px ${m.color}44"></div>
      <span>${m.text}</span>
    </div>
  `).join('');

  const promptsHTML = p.prompts.map((pr, idx) => `
    <li onclick="openPromptDetail('${p.id}',${idx})">${pr}</li>
  `).join('');

  document.getElementById('detail-inner').innerHTML = `
    <div class="detail-header">
      <div>
        <div style="margin-bottom:0.4rem"><span class="phase-tag ${p.tagClass}">${p.tag}</span></div>
        <div class="detail-phase-title">${p.title}</div>
        <div class="detail-phase-sub">${p.duration} · ${p.desc}</div>
      </div>
      <button class="detail-close" onclick="closePanel()">✕ Đóng</button>
    </div>

    <div class="week-grid">${weeksHTML}</div>

    <div class="milestone-section">
      <div class="milestone-label">// milestones</div>
      <div class="milestone-list">${milestonesHTML}</div>
    </div>

    <div class="prompt-box">
      <div class="prompt-box-title">Prompt mẫu — click để xem giải thích sâu</div>
      <ul class="prompt-list">${promptsHTML}</ul>
    </div>
  `;

  document.getElementById('detail-panel').classList.add('open');
}

function closePanel() {
  activePhase = null;
  document.querySelectorAll('.phase').forEach(el => el.classList.remove('active'));
  document.getElementById('detail-panel').classList.remove('open');
  document.getElementById('active-phase-label').textContent = '—';
}

/* ─── Prompt detail modal ─── */
function openPromptDetail(phaseId, idx) {
  const phase  = PHASES.find(p => p.id === phaseId);
  const detail = PROMPT_DETAILS[phaseId + '_' + idx];
  if (!phase || !detail) return;

  currentPromptText = phase.prompts[idx];

  const tagEl = document.getElementById('pm-tag');
  tagEl.className = 'phase-tag ' + detail.tagClass;
  tagEl.textContent = detail.tag;
  document.getElementById('pm-title').textContent = detail.title;
  document.getElementById('pm-sub').textContent   = detail.subtitle;
  document.getElementById('pm-body').innerHTML    = detail.body;

  document.getElementById('prompt-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePromptModal() {
  document.getElementById('prompt-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function copyCurrentPrompt() {
  if (!currentPromptText) return;
  navigator.clipboard.writeText(currentPromptText).then(() => {
    const btn = document.getElementById('pm-copy-btn');
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = 'rgba(74,255,160,0.2)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 2000);
  });
}

/* ─── Event listeners ─── */
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('font-dec').addEventListener('click', () => changeFontSize(-1));
document.getElementById('font-inc').addEventListener('click', () => changeFontSize(1));

document.getElementById('prompt-modal').addEventListener('click', function(e) {
  if (e.target === this) closePromptModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closePromptModal();
});

/* ─── Init ─── */
initTheme();
initFontSize();
renderTimeline();
