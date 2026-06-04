/* ═══════════════════════════════════════════
   BSt Baba - AKSpected | Components
   Login Gate, Chatbot, Feedback, Teacher Panel
   ═══════════════════════════════════════════ */

// ─── AUTH (localStorage now, Firebase later) ───
function isLoggedIn() { return !!localStorage.getItem('bstbaba_user'); }
function getUser() { return JSON.parse(localStorage.getItem('bstbaba_user') || 'null'); }
function getStudents() { return JSON.parse(localStorage.getItem('bstbaba_students') || '[]'); }

function registerUser(data) {
  localStorage.setItem('bstbaba_user', JSON.stringify(data));
  const students = getStudents();
  if (!students.find(s => s.email === data.email)) {
    students.push({...data, registered: new Date().toISOString(), quizzes: 0, score: 0});
    localStorage.setItem('bstbaba_students', JSON.stringify(students));
  }
}
function loginUser(email) {
  const students = getStudents();
  const found = students.find(s => s.email === email);
  if (found) { localStorage.setItem('bstbaba_user', JSON.stringify(found)); return true; }
  return false;
}
function logoutUser() { localStorage.removeItem('bstbaba_user'); location.reload(); }

// ─── INJECT FLOATING BUTTONS ───
function injectFloatingButtons() {
  const html = `
    <div class="floating-btns">
      <button class="float-btn ai-btn" onclick="toggleChatbot()" title="Ask Questions">
        🤖
        <span class="tooltip">BSt Baba AKSpected - Ask Questions</span>
      </button>
      <button class="float-btn feedback-btn" onclick="toggleFeedback()" title="Feedback">
        💬
        <span class="tooltip">Send Feedback</span>
      </button>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ─── CHATBOT ───
function injectChatbot() {
  const html = `
    <div class="chatbot-panel hidden" id="chatbotPanel">
      <div class="chatbot-header">
        <div>
          <h3>BSt Baba AKSpected</h3>
          <span>Ask Questions — Business Studies Only</span>
        </div>
        <button onclick="toggleChatbot()">✕</button>
      </div>
      <div class="chatbot-messages" id="chatMessages">
        <div class="chat-msg bot">Hi! I'm BSt Baba's AI assistant. Ask me anything about CBSE Business Studies — chapters, concepts, definitions, case studies. I'm here to help! 📚</div>
      </div>
      <div class="chatbot-input">
        <input type="text" id="chatInput" placeholder="Ask about Business Studies..." onkeydown="if(event.key==='Enter')sendChat()">
        <button onclick="sendChat()">Send</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function toggleChatbot() {
  const panel = document.getElementById('chatbotPanel');
  const fbPanel = document.getElementById('feedbackPanel');
  if (fbPanel) fbPanel.classList.add('hidden');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    document.getElementById('chatInput').focus();
  }
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  const messages = document.getElementById('chatMessages');
  messages.innerHTML += `<div class="chat-msg user">${escapeHtml(msg)}</div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Placeholder response — replace with Grok API call
  setTimeout(() => {
    messages.innerHTML += `<div class="chat-msg bot">Thanks for your question! The AI is being connected. Your teacher Aakassh Soral (AKS) will configure the Grok API soon. In the meantime, check the chapter notes for your answer! 📖</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 800);

  /* === GROK API INTEGRATION (uncomment and add API key) ===
  fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_GROK_API_KEY_HERE'
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [
        {role: 'system', content: 'You are BSt Baba, an expert CBSE Class 11 and 12 Business Studies teacher. Answer only Business Studies questions. Be concise, accurate, and exam-focused. Use examples from NCERT. If the question is not about Business Studies, politely decline.'},
        {role: 'user', content: msg}
      ],
      max_tokens: 500
    })
  })
  .then(r => r.json())
  .then(data => {
    const reply = data.choices[0].message.content;
    messages.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
    messages.scrollTop = messages.scrollHeight;
  })
  .catch(() => {
    messages.innerHTML += `<div class="chat-msg bot">Sorry, I couldn't process that. Please try again later.</div>`;
    messages.scrollTop = messages.scrollHeight;
  });
  */
}

// ─── FEEDBACK ───
function injectFeedback() {
  const html = `
    <div class="feedback-panel hidden" id="feedbackPanel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <h3>Send Feedback</h3>
        <button onclick="toggleFeedback()" style="background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer">✕</button>
      </div>
      <p class="fb-sub">Share your thoughts, suggestions, or report issues directly to AKS.</p>
      <input class="modal-input" type="text" id="fbName" placeholder="Your Name">
      <input class="modal-input" type="email" id="fbEmail" placeholder="Your Email">
      <textarea id="fbMessage" placeholder="Your feedback or message..."></textarea>
      <button class="modal-btn gold" style="margin-top:12px" onclick="submitFeedback()">Send to AKS →</button>
      <div id="fbStatus" style="font-size:0.78rem;margin-top:8px;color:var(--accent);display:none"></div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function toggleFeedback() {
  const panel = document.getElementById('feedbackPanel');
  const cbPanel = document.getElementById('chatbotPanel');
  if (cbPanel) cbPanel.classList.add('hidden');
  panel.classList.toggle('hidden');
}

function submitFeedback() {
  const name = document.getElementById('fbName').value.trim();
  const email = document.getElementById('fbEmail').value.trim();
  const message = document.getElementById('fbMessage').value.trim();
  if (!message) return;
  const status = document.getElementById('fbStatus');

  // Using mailto as fallback — replace with Formspree/Web3Forms or Firebase
  const subject = encodeURIComponent(`BSt Baba Feedback from ${name || 'Anonymous'}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
  window.open(`mailto:aakasshsoral@gmail.com?subject=${subject}&body=${body}`, '_blank');

  status.textContent = 'Opening email client... Thank you for your feedback!';
  status.style.display = 'block';
  setTimeout(() => { status.style.display = 'none'; }, 4000);
}

// ─── LOGIN/REGISTER MODAL ───
function injectAuthModal() {
  const html = `
    <div class="modal-overlay hidden" id="authModal">
      <div class="modal">
        <button class="modal-close" onclick="closeAuthModal()">✕</button>
        <div id="authRegister">
          <h2>Join BSt Baba</h2>
          <p class="modal-sub">Register to access all chapters, questions, and AKSpected sets.</p>
          <div class="modal-error" id="regError"></div>
          <input class="modal-input" type="text" id="regName" placeholder="Full Name *" required>
          <input class="modal-input" type="email" id="regEmail" placeholder="Email Address *" required>
          <input class="modal-input" type="tel" id="regPhone" placeholder="Phone Number *" required>
          <div class="modal-row">
            <select class="modal-input" id="regClass">
              <option value="">Class *</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
              <option value="Other">Other</option>
            </select>
            <input class="modal-input" type="text" id="regCity" placeholder="City *">
          </div>
          <input class="modal-input" type="text" id="regCountry" placeholder="Country" value="India">
          <button class="modal-btn" onclick="handleRegister()">Register & Access Content →</button>
          <div class="modal-switch">Already registered? <a onclick="showLogin()">Login here</a></div>
        </div>
        <div id="authLogin" style="display:none">
          <h2>Welcome Back</h2>
          <p class="modal-sub">Login with your registered email.</p>
          <div class="modal-error" id="loginError"></div>
          <input class="modal-input" type="email" id="loginEmail" placeholder="Email Address *">
          <button class="modal-btn" onclick="handleLogin()">Login →</button>
          <div class="modal-switch">New here? <a onclick="showRegister()">Register now</a></div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function showAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
  showRegister();
}
function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}
function showRegister() {
  document.getElementById('authRegister').style.display = 'block';
  document.getElementById('authLogin').style.display = 'none';
}
function showLogin() {
  document.getElementById('authRegister').style.display = 'none';
  document.getElementById('authLogin').style.display = 'block';
}

function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const cls = document.getElementById('regClass').value;
  const city = document.getElementById('regCity').value.trim();
  const country = document.getElementById('regCountry').value.trim();
  const err = document.getElementById('regError');

  if (!name || !email || !phone || !cls || !city) {
    err.textContent = 'Please fill all required fields.';
    err.style.display = 'block';
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    err.textContent = 'Please enter a valid email address.';
    err.style.display = 'block';
    return;
  }

  registerUser({name, email, phone, class: cls, city, country});
  closeAuthModal();
  if (typeof unlockContent === 'function') unlockContent();
  location.reload();
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const err = document.getElementById('loginError');
  if (!email) { err.textContent = 'Please enter your email.'; err.style.display = 'block'; return; }
  if (loginUser(email)) {
    closeAuthModal();
    location.reload();
  } else {
    err.textContent = 'Email not found. Please register first.';
    err.style.display = 'block';
  }
}

// ─── CONTENT GATING ───
function gateContent() {
  if (isLoggedIn()) return;
  const sections = document.querySelectorAll('.section');
  if (sections.length <= 1) return;
  // Lock all sections after the first one
  for (let i = 1; i < sections.length; i++) {
    sections[i].classList.add('content-locked');
    sections[i].style.maxHeight = '300px';
    sections[i].style.overflow = 'hidden';
  }
  // Add lock prompt after first locked section
  const firstLocked = sections[1];
  if (firstLocked) {
    const prompt = document.createElement('div');
    prompt.className = 'lock-prompt';
    prompt.innerHTML = `
      <h3>🔒 Register to Access Full Content</h3>
      <p>Sign up for free to unlock all chapters, questions, flashcards, and AKSpected practice sets.</p>
      <button class="modal-btn" style="max-width:280px;margin:0 auto;display:block" onclick="showAuthModal()">Register for Free →</button>`;
    firstLocked.parentNode.insertBefore(prompt, firstLocked.nextSibling);
  }
}

// ─── USER BAR (logged-in state) ───
function injectUserBar() {
  if (!isLoggedIn()) return;
  const user = getUser();
  const nav = document.querySelector('nav');
  if (!nav) return;
  const bookBtn = nav.querySelector('.btn-book');
  if (bookBtn) {
    const userBadge = document.createElement('span');
    userBadge.style.cssText = 'font-size:0.75rem;color:var(--accent);font-weight:600;margin-right:4px;cursor:pointer';
    userBadge.textContent = `Hi, ${user.name.split(' ')[0]}`;
    userBadge.title = 'Click to logout';
    userBadge.onclick = () => { if(confirm('Logout?')) logoutUser(); };
    bookBtn.parentNode.insertBefore(userBadge, bookBtn);
  }
}

// ─── TEACHER PANEL ───
function injectTeacherPanel() {
  const students = getStudents();
  const html = `
    <div class="teacher-panel hidden" id="teacherPanel">
      <div class="tp-header">
        <div style="display:flex;align-items:center">
          <h2>🎓 BSt Baba — Teacher Panel</h2>
          <span class="tp-badge">AKS Admin</span>
        </div>
        <button class="tp-close" onclick="closeTeacherPanel()">✕ Close Panel</button>
      </div>
      <div class="tp-body">
        <!-- Stats -->
        <div class="tp-grid">
          <div class="tp-stat-card">
            <div class="tp-stat-num" id="tpStudentCount">${students.length}</div>
            <div class="tp-stat-label">Registered Students</div>
          </div>
          <div class="tp-stat-card">
            <div class="tp-stat-num" style="color:var(--accent-gold)">0</div>
            <div class="tp-stat-label">Quizzes Attempted</div>
          </div>
          <div class="tp-stat-card">
            <div class="tp-stat-num">0</div>
            <div class="tp-stat-label">Feedback Messages</div>
          </div>
        </div>

        <!-- Student List -->
        <div class="tp-section">
          <h3>👥 Registered Students</h3>
          <div style="overflow-x:auto">
            <table class="tp-table" id="tpStudentTable">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Class</th><th>City</th><th>Registered</th><th>Actions</th></tr>
              </thead>
              <tbody id="tpStudentBody">
                ${students.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px">No students registered yet. Students will appear here after they sign up.</td></tr>' :
                students.map(s => `<tr>
                  <td><strong>${escapeHtml(s.name)}</strong></td>
                  <td>${escapeHtml(s.email)}</td>
                  <td>${escapeHtml(s.phone)}</td>
                  <td>${s.class || '-'}</td>
                  <td>${escapeHtml(s.city || '-')}</td>
                  <td>${s.registered ? new Date(s.registered).toLocaleDateString() : '-'}</td>
                  <td>
                    <button class="tp-action-btn wa" onclick="window.open('https://wa.me/${s.phone.replace(/[^0-9]/g,'')}','_blank')">WhatsApp</button>
                    <button class="tp-action-btn email" onclick="window.open('mailto:${s.email}','_blank')">Email</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Question Generator -->
        <div class="tp-section">
          <h3>⚡ AI Question Generator <span style="font-size:0.68rem;color:var(--accent-gold);font-weight:700;background:rgba(251,191,36,0.1);padding:2px 8px;border-radius:4px">AKSpected</span></h3>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px">Generate custom question papers using AI. Select options and generate.</p>
          <div class="tp-qgen-options">
            <select id="qgenType">
              <option value="full">Full Paper (80 marks)</option>
              <option value="chapter">Chapter-wise</option>
              <option value="topic">Topic-wise</option>
              <option value="mcq">MCQs Only</option>
              <option value="case">Case Studies Only</option>
              <option value="assertion">Assertion-Reason Only</option>
            </select>
            <select id="qgenChapter">
              <option value="all">All Chapters</option>
              <option value="1">Ch 1: Nature of Management</option>
              <option value="2">Ch 2: Principles of Management</option>
              <option value="3">Ch 3: Business Environment</option>
              <option value="4">Ch 4: Planning</option>
              <option value="5">Ch 5: Organising</option>
              <option value="6">Ch 6: Staffing</option>
              <option value="7">Ch 7: Directing</option>
              <option value="8">Ch 8: Controlling</option>
              <option value="9">Ch 9: Financial Management</option>
              <option value="10">Ch 10: Financial Markets</option>
              <option value="11">Ch 11: Marketing</option>
              <option value="12">Ch 12: Consumer Protection</option>
            </select>
            <input type="number" id="qgenCount" placeholder="No. of Qs" value="10" min="1" max="50" style="width:90px">
          </div>
          <button class="modal-btn" style="max-width:250px" onclick="generateQuestions()">🤖 Generate with AI →</button>
          <div id="qgenOutput" style="margin-top:16px;font-size:0.83rem;color:var(--text-muted)"></div>
        </div>

        <!-- Broadcast -->
        <div class="tp-section">
          <h3>📢 Broadcast Message</h3>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px">Send a message to all registered students via WhatsApp or Email.</p>
          <textarea class="tp-broadcast" id="broadcastMsg" placeholder="Type your message here..."></textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="modal-btn" style="max-width:200px;background:#25D366" onclick="broadcastWhatsApp()">💬 WhatsApp All</button>
            <button class="modal-btn" style="max-width:200px" onclick="broadcastEmail()">✉ Email All</button>
          </div>
        </div>

        <!-- Analytics Placeholder -->
        <div class="tp-section">
          <h3>📊 Student Analytics</h3>
          <p style="font-size:0.82rem;color:var(--text-muted)">Detailed analytics will be available once Firebase is connected. This will show: individual quiz scores, chapter-wise performance, time spent, progress tracking, and consolidated class analytics.</p>
          <div style="margin-top:14px;padding:20px;background:var(--bg);border-radius:8px;text-align:center">
            <span style="font-size:2rem">📈</span>
            <p style="font-size:0.82rem;color:var(--text-muted);margin-top:8px">Connect Firebase to unlock analytics</p>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// Teacher panel password gate
let teacherPanelUnlocked = false;
function openTeacherPanel() {
  if (teacherPanelUnlocked) {
    document.getElementById('teacherPanel').classList.remove('hidden');
    return;
  }
  const pwd = prompt('Enter Teacher Panel Password:');
  if (pwd === 'aks1234') {
    teacherPanelUnlocked = true;
    document.getElementById('teacherPanel').classList.remove('hidden');
  } else if (pwd !== null) {
    alert('Incorrect password.');
  }
}
function closeTeacherPanel() {
  document.getElementById('teacherPanel').classList.add('hidden');
}

// Question generator placeholder
function generateQuestions() {
  const type = document.getElementById('qgenType').value;
  const ch = document.getElementById('qgenChapter').value;
  const count = document.getElementById('qgenCount').value;
  const output = document.getElementById('qgenOutput');
  output.innerHTML = '<div style="padding:16px;background:var(--accent-light);border-radius:8px">⏳ <strong>AI is being connected.</strong><br><br>To activate this feature, add your Grok API key in <code>js/components.js</code> in the <code>generateQuestions()</code> function.<br><br>Configuration: Type: <strong>' + type + '</strong> | Chapter: <strong>' + (ch === 'all' ? 'All' : 'Ch ' + ch) + '</strong> | Questions: <strong>' + count + '</strong></div>';
}

// Broadcast
function broadcastWhatsApp() {
  const msg = document.getElementById('broadcastMsg').value.trim();
  if (!msg) { alert('Please type a message first.'); return; }
  const students = getStudents();
  if (students.length === 0) { alert('No students registered yet.'); return; }
  const encoded = encodeURIComponent(msg);
  students.forEach(s => {
    const phone = s.phone.replace(/[^0-9]/g, '');
    if (phone) window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  });
}
function broadcastEmail() {
  const msg = document.getElementById('broadcastMsg').value.trim();
  if (!msg) { alert('Please type a message first.'); return; }
  const students = getStudents();
  const emails = students.map(s => s.email).filter(Boolean).join(',');
  if (!emails) { alert('No student emails found.'); return; }
  window.open(`mailto:${emails}?subject=${encodeURIComponent('BSt Baba - AKSpected Update')}&body=${encodeURIComponent(msg)}`, '_blank');
}

// ─── KEY LISTENER (B = Teacher Panel) ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'b' || e.key === 'B') {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    openTeacherPanel();
  }
});

// ─── UTILITY ───
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── INIT ALL COMPONENTS ───
document.addEventListener('DOMContentLoaded', () => {
  injectFloatingButtons();
  injectChatbot();
  injectFeedback();
  injectAuthModal();
  injectTeacherPanel();
  injectUserBar();
  if (!isLoggedIn()) gateContent();
});
