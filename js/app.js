/* ═══════════════════════════════════════════
   SORAL BUSINESS STUDIES — Shared JavaScript
   ═══════════════════════════════════════════ */

// Theme — dark is default
function initTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.body.setAttribute('data-theme', 'light');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = '🌓';
  }
}
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('themeBtn');
  if (body.getAttribute('data-theme') === 'light') {
    body.removeAttribute('data-theme');
    if (btn) btn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    body.setAttribute('data-theme', 'light');
    if (btn) btn.textContent = '🌓';
    localStorage.setItem('theme', 'light');
  }
}

// Mobile menu
function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('open');
}

// Counter animation
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = target >= 100 ? '+' : '';
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current + suffix;
    }, 30);
  });
}

// Tabs
function switchTab(btn, tabId) {
  const container = btn.closest('.tabs').parentElement;
  container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  container.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const target = container.querySelector('#tab-' + tabId);
  if (target) target.classList.add('active');
}

// Answer toggle
function toggleAnswer(btn) {
  const answer = btn.nextElementSibling;
  if (!answer) return;
  answer.classList.toggle('visible');
  btn.textContent = answer.classList.contains('visible') ? 'Hide Answer ▲' : 'Show Answer ▼';
}

// Question filter
function filterQ(btn, marks) {
  btn.closest('.question-filter').querySelectorAll('.q-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const container = btn.closest('.question-filter').parentElement;
  container.querySelectorAll('.question-item').forEach(q => {
    q.style.display = (marks === 'all' || q.dataset.marks === marks) ? 'block' : 'none';
  });
}

// URL params
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// Daily quiz streak
function getStreak() {
  const data = JSON.parse(localStorage.getItem('quiz_streak') || '{"count":0,"lastDate":""}');
  const today = new Date().toDateString();
  if (data.lastDate === today) return data.count;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (data.lastDate === yesterday) return data.count;
  return 0;
}
function updateStreak() {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem('quiz_streak') || '{"count":0,"lastDate":""}');
  if (data.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    data.count = (data.lastDate === yesterday) ? data.count + 1 : 1;
    data.lastDate = today;
    localStorage.setItem('quiz_streak', JSON.stringify(data));
  }
  return data.count;
}

// Nav HTML generator
function getNav(activePage) {
  const pages = {
    'home': {href: 'index.html', label: 'Home'},
    'class11': {href: 'class11-dashboard.html', label: 'Class 11'},
    'class12': {href: 'class12-dashboard.html', label: 'Class 12'},
    'tools': {href: 'flashcards.html', label: 'Tools'},
    'about': {href: 'about.html', label: 'About'}
  };
  let links = '';
  for (const [key, p] of Object.entries(pages)) {
    const cls = key === activePage ? ' class="active"' : '';
    links += `<a href="${p.href}"${cls}>${p.label}</a>`;
  }
  return `
    <nav>
      <a href="index.html" class="nav-logo"><span>📊</span> Soral Business Studies</a>
      <div class="nav-links">
        ${links}
        <button class="theme-toggle" onclick="toggleTheme()" id="themeBtn">🌓</button>
        <a href="#" class="btn-book">Book a Class</a>
      </div>
      <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
    </nav>`;
}

function getFooter() {
  return `
    <footer>
      <p>© 2026 Soral Business Studies</p>
      <p style="margin-top:6px">Built by <a href="https://soralatul16.github.io/atul-soral-physicism/" target="_blank">Atul Soral</a></p>
    </footer>`;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  // Counter animation observer
  const statsBar = document.querySelector('.stats-bar');
  if (statsBar) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { animateCounters(); obs.disconnect(); }});
    }, {threshold: 0.5});
    obs.observe(statsBar);
  }
  // Streak display
  const streakEl = document.querySelector('.streak');
  if (streakEl) {
    const s = getStreak();
    streakEl.textContent = `🔥 Streak: ${s} day${s !== 1 ? 's' : ''}`;
  }
});
