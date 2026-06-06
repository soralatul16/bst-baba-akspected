/* BSt Baba - SEO, WhatsApp Share, Exam Countdown, Mobile Nav */

// ─── SEO META TAGS ───
(function() {
  const seoData = {
    'index.html': {title:'BSt Baba - AKSpected | CBSE Business Studies Class 11 & 12', desc:'Free CBSE Business Studies notes, flashcards, daily quizzes, mock tests by Aakassh Soral (AKS). Board exam preparation for Class 11 and 12.'},
    'class12-dashboard.html': {title:'Class 12 Business Studies | BSt Baba', desc:'CBSE Class 12 Business Studies chapter-wise notes, marks weightage, PYQs. All 12 chapters covered with practice questions.'},
    'class11-dashboard.html': {title:'Class 11 Business Studies | BSt Baba', desc:'CBSE Class 11 Business Studies foundation notes. 11 chapters covering business basics, finance, and trade.'},
    'flashcards.html': {title:'BM Flashcards | BSt Baba', desc:'Free CBSE Business Studies flashcards — definitions, distinctions, and case study scenarios. Three revision modes.'},
    'daily-quiz.html': {title:'Daily BM Quiz | BSt Baba', desc:'Take 5 Business Studies questions daily. Build streaks, climb the leaderboard. CBSE Class 12 board prep.'},
    'mock-test.html': {title:'Mock Test 80 Marks | BSt Baba', desc:'Full CBSE Business Studies mock test — 34 questions, 80 marks, 3-hour timer with auto-scoring.'},
    'crack-the-case.html': {title:'Crack the Case | BSt Baba', desc:'Interactive Business Studies case study game. Read scenarios, identify principles, level up.'},
    'compare.html': {title:'Comparison Tables | BSt Baba', desc:'Instant BM comparison tables — Fayol vs Taylor, Formal vs Informal, and 12 more. Board exam ready.'},
    'library.html': {title:'Question Library | BSt Baba', desc:'Browse AKSpected question sets. Filter by chapter, topic, type, and difficulty.'},
    'revision-planner.html': {title:'Revision Planner | BSt Baba', desc:'Personalized CBSE revision plan based on your exam date and weak chapters.'},
    'news.html': {title:'BM In the News | BSt Baba', desc:'Current business news mapped to CBSE Business Studies chapters.'},
    'about.html': {title:'About AKS | BSt Baba', desc:'Aakassh Soral — MBA, M.Com, B.Ed, LL.B. Subject Expert in Business Studies.'}
  };
  const page = location.pathname.split('/').pop() || 'index.html';
  const seo = seoData[page] || seoData['index.html'];
  const base = 'https://soralatul16.github.io/bst-baba-akspected/';

  function addMeta(name, content, prop) {
    const m = document.createElement('meta');
    if (prop) m.setAttribute('property', name);
    else m.setAttribute('name', name);
    m.content = content;
    document.head.appendChild(m);
  }
  addMeta('description', seo.desc);
  addMeta('keywords', 'CBSE Business Studies, Class 12, Class 11, BSt Baba, AKSpected, Aakassh Soral, board exam, notes, quiz, mock test, flashcards, PYQ, revision');
  addMeta('og:title', seo.title, true);
  addMeta('og:description', seo.desc, true);
  addMeta('og:url', base + page, true);
  addMeta('og:type', 'website', true);
  addMeta('og:site_name', 'BSt Baba - AKSpected', true);
  addMeta('twitter:card', 'summary');
  addMeta('twitter:title', seo.title);
  addMeta('twitter:description', seo.desc);
  addMeta('robots', 'index, follow');
  const link = document.createElement('link');
  link.rel = 'canonical';
  link.href = base + page;
  document.head.appendChild(link);
})();

// ─── WHATSAPP SHARE BUTTON ───
function injectWhatsAppShare() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const base = 'https://soralatul16.github.io/bst-baba-akspected/';
  const url = base + page;

  const messages = {
    'index.html': 'Check out BSt Baba - AKSpected! Free CBSE Business Studies notes, quizzes, and mock tests 📚',
    'daily-quiz.html': 'I just took the Daily Quiz on BSt Baba! Try it 📝🔥',
    'mock-test.html': 'Free CBSE Business Studies Mock Test — 80 marks, 3 hours! Try it on BSt Baba 📋',
    'crack-the-case.html': 'Can you Crack the Case? Interactive BM case study game on BSt Baba 🕵️',
    'compare.html': 'Instant comparison tables for BM — Fayol vs Taylor and more! BSt Baba 📊',
    'flashcards.html': 'Free BM flashcards — 3 revision modes! BSt Baba ⚡',
    'revision-planner.html': 'Get a personalized BM revision plan on BSt Baba! 📅'
  };

  const msg = messages[page] || 'Check out BSt Baba - AKSpected for CBSE Business Studies! 📚';
  const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(msg + '\n' + url);

  const btn = document.createElement('a');
  btn.href = waUrl;
  btn.target = '_blank';
  btn.style.cssText = 'position:fixed;bottom:90px;left:24px;width:48px;height:48px;border-radius:50%;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 4px 16px rgba(0,0,0,0.3);z-index:89;text-decoration:none;transition:transform 0.2s';
  btn.title = 'Share on WhatsApp';
  btn.textContent = '📤';
  btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';
  document.body.appendChild(btn);
}

// ─── EXAM COUNTDOWN ───
function injectExamCountdown() {
  if (location.pathname.split('/').pop() !== 'index.html' && location.pathname.split('/').pop() !== '') return;

  const examDate = new Date('2027-03-28');
  const now = new Date();
  const diff = examDate - now;
  if (diff < 0) return;

  const days = Math.ceil(diff / 86400000);

  const banner = document.createElement('div');
  banner.style.cssText = 'max-width:1080px;margin:20px auto 0;padding:0 clamp(16px,4vw,48px)';
  banner.innerHTML = `<div style="background:linear-gradient(135deg,rgba(34,211,238,0.08),rgba(251,191,36,0.06));border:1px solid rgba(34,211,238,0.15);border-radius:12px;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:1.5rem">📅</span>
      <div>
        <div style="font-size:0.95rem;font-weight:800;color:var(--accent)">${days} Days to Board Exam</div>
        <div style="font-size:0.72rem;color:var(--text-muted)">CBSE Class 12 Business Studies · March 2027</div>
      </div>
    </div>
    <a href="revision-planner.html" style="font-size:0.78rem;font-weight:700;color:var(--accent-gold);text-decoration:none">Plan Your Revision →</a>
  </div>`;

  const statsBar = document.querySelector('.stats-bar');
  if (statsBar) statsBar.parentNode.insertBefore(banner, statsBar.nextSibling);
}

// ─── MOBILE BOTTOM NAV ───
function injectMobileNav() {
  if (window.innerWidth > 768) return;

  const page = location.pathname.split('/').pop() || 'index.html';
  const items = [
    {icon:'🏠', label:'Home', href:'index.html'},
    {icon:'📝', label:'Quiz', href:'daily-quiz.html'},
    {icon:'📖', label:'Notes', href:'class12-dashboard.html'},
    {icon:'📊', label:'Progress', href:'progress.html'},
    {icon:'☰', label:'More', href:'#', onclick:'toggleMobileMenu()'}
  ];

  const nav = document.createElement('div');
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--bg-card);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:6px 0 env(safe-area-inset-bottom,8px);z-index:80';

  items.forEach(item => {
    const isActive = item.href === page;
    const a = document.createElement('a');
    a.href = item.href;
    if (item.onclick) { a.href = '#'; a.setAttribute('onclick', item.onclick + ';return false'); }
    a.style.cssText = 'text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:0.62rem;font-weight:600;color:' + (isActive ? 'var(--accent)' : 'var(--text-muted)') + ';min-width:50px';
    a.innerHTML = `<span style="font-size:1.2rem">${item.icon}</span>${item.label}`;
    nav.appendChild(a);
  });

  document.body.appendChild(nav);
  document.body.style.paddingBottom = '70px';

  // Hide floating buttons a bit higher on mobile
  const floats = document.querySelector('.floating-btns');
  if (floats) floats.style.bottom = '80px';
}

// ─── BACK & HOME BUTTONS ───
function injectNavButtons() {
  var page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html') return;

  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:calc(var(--nav-height, 60px) + 10px);left:12px;z-index:70;display:flex;gap:6px';

  var backBtn = document.createElement('button');
  backBtn.innerHTML = '←';
  backBtn.title = 'Go Back';
  backBtn.style.cssText = 'width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--bg-card);color:var(--text);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:all .2s';
  backBtn.onmouseover = function(){ this.style.borderColor='var(--accent)';this.style.color='var(--accent)'; };
  backBtn.onmouseout = function(){ this.style.borderColor='var(--border)';this.style.color='var(--text)'; };
  backBtn.onclick = function(){ window.history.back(); };

  var homeBtn = document.createElement('a');
  homeBtn.href = 'index.html';
  homeBtn.innerHTML = '⌂';
  homeBtn.title = 'Home';
  homeBtn.style.cssText = 'width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--bg-card);color:var(--text);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);text-decoration:none;transition:all .2s';
  homeBtn.onmouseover = function(){ this.style.borderColor='var(--accent)';this.style.color='var(--accent)'; };
  homeBtn.onmouseout = function(){ this.style.borderColor='var(--border)';this.style.color='var(--text)'; };

  bar.appendChild(backBtn);
  bar.appendChild(homeBtn);
  document.body.appendChild(bar);
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  injectWhatsAppShare();
  injectExamCountdown();
  injectMobileNav();
  injectNavButtons();
});
