/* ═══════════════════════════════════════════
   BSt Baba - AKSpected | Components
   Login Gate, Chatbot, Feedback, Teacher Panel
   Firebase Auth + Firestore Integration
   ═══════════════════════════════════════════ */

// ─── AUTH (Firebase + localStorage cache) ───
let currentUser = null;
let currentUserData = null;

// ─── AUTH STATE (Firebase is the source of truth, localStorage fallback) ───
function isLoggedIn() {
  if (typeof auth !== 'undefined' && auth.currentUser) return true;
  return !!localStorage.getItem('bstbaba_firebase_uid');
}
function getUser() {
  return currentUserData || JSON.parse(localStorage.getItem('bstbaba_user') || 'null');
}

// Listen for auth state changes
let authReady = false;
if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    authReady = true;
    if (user) {
      localStorage.setItem('bstbaba_firebase_uid', user.uid);
      try {
        const doc = await db.collection('bstbaba_users').doc(user.uid).get();
        if (doc.exists) {
          currentUserData = doc.data();
          localStorage.setItem('bstbaba_user', JSON.stringify(currentUserData));
        }
      } catch(e) {}
      document.querySelectorAll('.content-locked').forEach(el => {
        el.classList.remove('content-locked');
        el.style.maxHeight = '';
        el.style.overflow = '';
      });
      document.querySelectorAll('.lock-prompt').forEach(el => el.remove());
      injectUserBar();
    } else {
      currentUser = null;
      currentUserData = null;
      localStorage.removeItem('bstbaba_user');
      localStorage.removeItem('bstbaba_firebase_uid');
      gateContent();
    }
  });
}

async function registerUser(name, email, password, phone, cls, city, country) {
  if (typeof auth === 'undefined') {
    return {success: false, message: 'Firebase not loaded. Please try on the live site.'};
  }
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.sendEmailVerification();
    const userData = {
      uid: cred.user.uid,
      name, email, phone,
      class: cls, city, country,
      registered: new Date().toISOString(),
      quizzes: 0, score: 0, verified: false
    };
    await db.collection('bstbaba_users').doc(cred.user.uid).set(userData);
    localStorage.setItem('bstbaba_user', JSON.stringify(userData));
    return {success: true, message: 'Registration successful! Check your email to verify your account.'};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

async function loginUser(email, password) {
  if (typeof auth === 'undefined') {
    return {success: false, message: 'Firebase not loaded. Please try on the live site.'};
  }
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const doc = await db.collection('bstbaba_users').doc(cred.user.uid).get();
    if (doc.exists) {
      currentUserData = doc.data();
      localStorage.setItem('bstbaba_user', JSON.stringify(currentUserData));
    }
    if (cred.user.emailVerified) {
      await db.collection('bstbaba_users').doc(cred.user.uid).update({verified: true});
    }
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function logoutUser() {
  auth.signOut();
  localStorage.removeItem('bstbaba_user');
  currentUser = null;
  currentUserData = null;
  location.reload();
}

async function getStudents() {
  try {
    const snapshot = await db.collection('bstbaba_users').orderBy('registered', 'desc').get();
    return snapshot.docs.map(doc => doc.data());
  } catch(e) {
    return JSON.parse(localStorage.getItem('bstbaba_students') || '[]');
  }
}

// ─── API KEY (Firestore-backed, cached in localStorage) ───
// Supports both Groq (gsk_) and xAI (xai-) keys
async function getGrokKey() {
  try {
    const doc = await db.collection('bstbaba_config').doc('grok').get();
    if (doc.exists && doc.data().apiKey) {
      localStorage.setItem('bstbaba_grok_key', doc.data().apiKey);
      return doc.data().apiKey;
    }
  } catch(e) {
    console.log('Firestore key fetch failed:', e.message);
  }
  const cached = localStorage.getItem('bstbaba_grok_key');
  if (cached) return cached;
  return null;
}

function getApiConfig(apiKey) {
  if (apiKey.startsWith('gsk_')) {
    return { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' };
  }
  return { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-4.3' };
}

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

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  const messages = document.getElementById('chatMessages');
  messages.innerHTML += `<div class="chat-msg user">${escapeHtml(msg)}</div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  const apiKey = await getGrokKey();
  if (!apiKey) {
    messages.innerHTML += `<div class="chat-msg bot">AI is not configured. The API key was not found in the cloud storage. Teacher (AKS) needs to open the Teacher Panel and save the API key again.</div>`;
      messages.scrollTop = messages.scrollHeight;
    return;
  }

  messages.innerHTML += `<div class="chat-msg bot" id="typingIndicator" style="opacity:0.6">Thinking...</div>`;
  messages.scrollTop = messages.scrollHeight;

  const config = getApiConfig(apiKey);
  fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {role: 'system', content: 'You are BSt Baba, an expert CBSE Class 11 and 12 Business Studies teacher created by Aakassh Soral (AKS). Answer only Business Studies questions. Be concise, accurate, and exam-focused. Use examples from NCERT. Format answers with bullet points where helpful. If the question is not about Business Studies, politely decline and redirect to the subject.'},
        {role: 'user', content: msg}
      ]
    })
  })
  .then(r => r.json())
  .then(data => {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
    if (data.error) {
      messages.innerHTML += `<div class="chat-msg bot">Error: ${data.error.message || JSON.stringify(data.error)}</div>`;
    } else {
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      messages.innerHTML += `<div class="chat-msg bot">${reply.replace(/\n/g, '<br>')}</div>`;
    }
    messages.scrollTop = messages.scrollHeight;
  })
  .catch(() => {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
    messages.innerHTML += `<div class="chat-msg bot">Sorry, something went wrong. Please try again later.</div>`;
    messages.scrollTop = messages.scrollHeight;
  });
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

  db.collection('bstbaba_feedback').add({
    name: name || 'Anonymous',
    email: email || '',
    message,
    timestamp: new Date().toISOString(),
    read: false
  }).then(() => {
    status.textContent = 'Feedback sent successfully! Thank you.';
    status.style.display = 'block';
    document.getElementById('fbMessage').value = '';
    setTimeout(() => { status.style.display = 'none'; }, 4000);
  }).catch(() => {
    const subject = encodeURIComponent('BSt Baba Feedback from ' + (name || 'Anonymous'));
    const body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);
    window.open('mailto:aakasshsoral@gmail.com?subject=' + subject + '&body=' + body, '_blank');
    status.textContent = 'Opening email client as fallback...';
    status.style.display = 'block';
  });
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
          <input class="modal-input" type="password" id="regPassword" placeholder="Create Password (min 6 chars) *" required>
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
          <button class="modal-btn" id="regBtn" onclick="handleRegister()">Register & Access Content →</button>
          <div class="modal-switch">Already registered? <a onclick="showLogin()">Login here</a></div>
        </div>
        <div id="authLogin" style="display:none">
          <h2>Welcome Back</h2>
          <p class="modal-sub">Login with your registered email and password.</p>
          <div class="modal-error" id="loginError"></div>
          <input class="modal-input" type="email" id="loginEmail" placeholder="Email Address *">
          <input class="modal-input" type="password" id="loginPassword" placeholder="Password *">
          <button class="modal-btn" id="loginBtn" onclick="handleLogin()">Login →</button>
          <div class="modal-switch">New here? <a onclick="showRegister()">Register now</a></div>
          <div class="modal-switch" style="margin-top:6px"><a onclick="handleForgotPassword()">Forgot password?</a></div>
        </div>
        <div id="authVerify" style="display:none;text-align:center;padding:20px 0">
          <div style="font-size:2.5rem;margin-bottom:12px">📧</div>
          <h2>Verify Your Email</h2>
          <p class="modal-sub">We've sent a verification link to your email. Click the link to verify, then come back and login.</p>
          <button class="modal-btn" onclick="showLogin()">Go to Login →</button>
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

async function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const phone = document.getElementById('regPhone').value.trim();
  const cls = document.getElementById('regClass').value;
  const city = document.getElementById('regCity').value.trim();
  const country = document.getElementById('regCountry').value.trim();
  const err = document.getElementById('regError');
  const btn = document.getElementById('regBtn');

  if (!name || !email || !password || !phone || !cls || !city) {
    err.textContent = 'Please fill all required fields.';
    err.style.display = 'block'; return;
  }
  if (password.length < 6) {
    err.textContent = 'Password must be at least 6 characters.';
    err.style.display = 'block'; return;
  }

  btn.textContent = 'Creating account...';
  btn.disabled = true;
  err.style.display = 'none';

  const result = await registerUser(name, email, password, phone, cls, city, country);
  if (result.success) {
    document.getElementById('authRegister').style.display = 'none';
    document.getElementById('authVerify').style.display = 'block';
  } else {
    err.textContent = result.message;
    err.style.display = 'block';
    btn.textContent = 'Register & Access Content →';
    btn.disabled = false;
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    err.textContent = 'Please enter email and password.';
    err.style.display = 'block'; return;
  }

  btn.textContent = 'Logging in...';
  btn.disabled = true;
  err.style.display = 'none';

  const result = await loginUser(email, password);
  if (result.success) {
    closeAuthModal();
    location.reload();
  } else {
    err.textContent = result.message;
    err.style.display = 'block';
    btn.textContent = 'Login →';
    btn.disabled = false;
  }
}

async function handleForgotPassword() {
  const email = document.getElementById('loginEmail').value.trim();
  const err = document.getElementById('loginError');
  if (!email) {
    err.textContent = 'Enter your email above, then click Forgot Password.';
    err.style.display = 'block'; return;
  }
  try {
    await auth.sendPasswordResetEmail(email);
    err.textContent = 'Password reset email sent! Check your inbox.';
    err.style.color = 'var(--accent)';
    err.style.display = 'block';
  } catch(e) {
    err.textContent = e.message;
    err.style.display = 'block';
  }
}

// ─── CONTENT GATING ───
function gateContent() {
  if (document.querySelector('.lock-prompt')) return;
  if (typeof auth !== 'undefined' && auth.currentUser) return;
  if (localStorage.getItem('bstbaba_firebase_uid')) return;

  // Gate everything after hero/first section on ALL pages
  const allSections = document.querySelectorAll('.section, .chapter-body');
  const heroExists = document.querySelector('.hero, .page-hero');

  if (allSections.length === 0) return;

  const startIndex = heroExists ? 0 : 0;
  let gated = false;

  for (let i = startIndex; i < allSections.length; i++) {
    if (i === 0 && document.querySelector('.hero')) continue;
    allSections[i].classList.add('content-locked');
    allSections[i].style.maxHeight = '250px';
    allSections[i].style.overflow = 'hidden';
    if (!gated) {
      const prompt = document.createElement('div');
      prompt.className = 'lock-prompt';
      prompt.innerHTML = `
        <h3>🔒 Register or Login to Access Full Content</h3>
        <p>Sign up for free to unlock all chapters, questions, flashcards, and AKSpected practice sets.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="modal-btn" style="max-width:220px" onclick="showAuthModal(); showRegister()">Register for Free →</button>
          <button class="modal-btn gold" style="max-width:220px" onclick="showAuthModal(); showLogin()">Already Registered? Login →</button>
        </div>`;
      allSections[i].parentNode.insertBefore(prompt, allSections[i].nextSibling);
      gated = true;
    }
  }

  // Also gate flashcard container, chapter body etc.
  const extraGates = document.querySelectorAll('.flashcard-container, .chapter-main, #pyqList');
  extraGates.forEach(el => {
    if (!gated) return;
    el.classList.add('content-locked');
    el.style.maxHeight = '200px';
    el.style.overflow = 'hidden';
  });
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
            <div class="tp-stat-num" id="tpStudentCount">-</div>
            <div class="tp-stat-label">Registered Students</div>
          </div>
          <div class="tp-stat-card">
            <div class="tp-stat-num" id="tpVerifiedCount" style="color:var(--accent-gold)">-</div>
            <div class="tp-stat-label">Email Verified</div>
          </div>
          <div class="tp-stat-card">
            <div class="tp-stat-num" id="tpFeedbackCount">-</div>
            <div class="tp-stat-label">Feedback Messages</div>
          </div>
        </div>

        <!-- API Key Config -->
        <div class="tp-section">
          <h3>🔑 AI Configuration</h3>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px">Enter your Groq (gsk_) or xAI (xai-) API key. Stored in the cloud — works on all devices.</p>
          <div style="display:flex;gap:8px">
            <input class="modal-input" type="password" id="grokKeyInput" placeholder="Paste your gsk_... or xai-... key" style="margin:0;flex:1" value="${localStorage.getItem('bstbaba_grok_key') || ''}">
            <button class="modal-btn" style="max-width:120px;margin:0" onclick="saveGrokKey()">Save Key</button>
          </div>
          <div id="grokKeyStatus" style="font-size:0.78rem;margin-top:6px;display:none"></div>
          ${localStorage.getItem('bstbaba_grok_key') ? '<p style="font-size:0.75rem;color:var(--accent);margin-top:6px">✓ API key is saved and active</p>' : ''}
        </div>

        <!-- Student List -->
        <div class="tp-section">
          <h3>👥 Registered Students</h3>
          <div style="overflow-x:auto">
            <table class="tp-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Class</th><th>City</th><th>Verified</th><th>Registered</th><th>Actions</th></tr>
              </thead>
              <tbody id="tpStudentBody">
                <tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:20px">Loading students from Firebase...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Feedback Messages -->
        <div class="tp-section">
          <h3>💬 Feedback Messages</h3>
          <div id="tpFeedbackList" style="font-size:0.83rem;color:var(--text-muted)">Loading feedback...</div>
        </div>

        <!-- Question Generator (Multi-Select) -->
        <div class="tp-section">
          <h3>⚡ AI Question Generator <span style="font-size:0.68rem;color:var(--accent-gold);font-weight:700;background:rgba(251,191,36,0.1);padding:2px 8px;border-radius:4px">AKSpected</span></h3>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px">Generate custom question papers. Select multiple types, chapters, topics, and difficulty.</p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin-bottom:14px">
            <div>
              <label style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Question Types (multi)</label>
              <select id="qgenType" multiple size="5" style="width:100%;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.8rem">
                <option value="full">Full Paper (80 marks)</option>
                <option value="mcq" selected>MCQs</option>
                <option value="short">Short Answer (3 marks)</option>
                <option value="distinguish">Distinguish Between (4 marks)</option>
                <option value="case">Case Studies (5 marks)</option>
                <option value="long">Long Answer (6 marks)</option>
                <option value="assertion">Assertion-Reason</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Chapters (multi)</label>
              <select id="qgenChapter" multiple size="5" style="width:100%;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.8rem">
                <option value="1">Ch 1: Nature of Management</option>
                <option value="2" selected>Ch 2: Principles of Management</option>
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
            </div>
            <div>
              <label style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Topics (auto-populated)</label>
              <select id="qgenTopics" multiple size="5" style="width:100%;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.8rem" onchange="updateTopicSelection()">
                <option value="">Select chapters first</option>
              </select>
            </div>
          </div>

          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
            <div>
              <label style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Difficulty</label>
              <select id="qgenDifficulty" style="padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.8rem">
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">No. of Questions</label>
              <input type="number" id="qgenCount" value="10" min="1" max="50" style="width:80px;padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.8rem">
            </div>
            <div>
              <label style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Set Title</label>
              <input type="text" id="qgenTitle" placeholder="e.g. Ch 2 MCQ Practice" style="width:200px;padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.8rem">
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="modal-btn" style="max-width:250px" onclick="generateQuestions()">🤖 Generate with AI →</button>
            <button class="modal-btn gold" style="max-width:250px;background:var(--accent-gold)" id="saveToLibBtn" onclick="saveToLibrary()" disabled>📚 Save to Library</button>
          </div>
          <div id="qgenOutput" style="margin-top:16px;font-size:0.83rem;color:var(--text-muted)"></div>
        </div>

        <!-- LIBRARY PANEL -->
        <div class="tp-section">
          <h3>📚 Question Library <span style="font-size:0.68rem;color:var(--accent);font-weight:700;background:var(--accent-light);padding:2px 8px;border-radius:4px">Manager</span></h3>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px">All saved question sets. Edit, delete, or view. Students see these in the <a href="library.html" style="color:var(--accent)">Library page</a>.</p>
          <div id="tpLibraryList" style="max-height:400px;overflow-y:auto">Loading library...</div>
          <button class="modal-btn" style="max-width:200px;margin-top:12px" onclick="window.open('library.html','_blank')">Open Full Library →</button>
        </div>

        <!-- Broadcast -->
        <div class="tp-section">
          <h3>📢 Broadcast Message</h3>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px">Send a message to all registered students.</p>
          <textarea class="tp-broadcast" id="broadcastMsg" placeholder="Type your message here..."></textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="modal-btn" style="max-width:200px;background:#25D366" onclick="broadcastWhatsApp()">💬 WhatsApp All</button>
            <button class="modal-btn" style="max-width:200px" onclick="broadcastEmail()">✉ Email All</button>
          </div>
        </div>

        <!-- Analytics -->
        <div class="tp-section">
          <h3>📊 Student Analytics</h3>
          <div id="tpAnalytics" style="font-size:0.82rem;color:var(--text-muted)">
            <p>Basic stats are shown above. For detailed analytics (quiz scores, chapter-wise performance, time tracking), integrate Firebase Analytics in the console:</p>
            <p style="margin-top:8px"><a href="https://console.firebase.google.com" target="_blank" style="color:var(--accent)">Open Firebase Console →</a></p>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// Load students into teacher panel from Firestore
async function loadTeacherData() {
  try {
    const students = await getStudents();
    const tbody = document.getElementById('tpStudentBody');
    const countEl = document.getElementById('tpStudentCount');
    const verifiedEl = document.getElementById('tpVerifiedCount');

    if (countEl) countEl.textContent = students.length;
    const verified = students.filter(s => s.verified).length;
    if (verifiedEl) verifiedEl.textContent = verified;

    if (tbody) {
      if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:20px">No students registered yet.</td></tr>';
      } else {
        tbody.innerHTML = students.map(s => `<tr>
          <td><strong>${escapeHtml(s.name || '')}</strong></td>
          <td>${escapeHtml(s.email || '')}</td>
          <td>${escapeHtml(s.phone || '')}</td>
          <td>${s.class || '-'}</td>
          <td>${escapeHtml(s.city || '-')}</td>
          <td>${s.verified ? '<span style="color:var(--accent)">✓ Yes</span>' : '<span style="color:var(--accent-gold)">Pending</span>'}</td>
          <td>${s.registered ? new Date(s.registered).toLocaleDateString() : '-'}</td>
          <td>
            <button class="tp-action-btn wa" onclick="window.open('https://wa.me/${(s.phone||'').replace(/[^0-9]/g,'')}','_blank')">WA</button>
            <button class="tp-action-btn email" onclick="window.open('mailto:${s.email}','_blank')">Mail</button>
          </td>
        </tr>`).join('');
      }
    }

    // Load feedback
    const fbSnap = await db.collection('bstbaba_feedback').orderBy('timestamp', 'desc').limit(20).get();
    const fbList = document.getElementById('tpFeedbackList');
    const fbCountEl = document.getElementById('tpFeedbackCount');
    if (fbCountEl) fbCountEl.textContent = fbSnap.size;

    if (fbList) {
      if (fbSnap.empty) {
        fbList.innerHTML = '<p>No feedback yet.</p>';
      } else {
        fbList.innerHTML = fbSnap.docs.map(doc => {
          const f = doc.data();
          return `<div style="padding:12px;background:var(--bg);border-radius:8px;margin-bottom:8px;border:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <strong>${escapeHtml(f.name || 'Anonymous')}</strong>
              <span style="font-size:0.7rem;color:var(--text-muted)">${f.timestamp ? new Date(f.timestamp).toLocaleDateString() : ''}</span>
            </div>
            <p style="margin-bottom:4px">${escapeHtml(f.message)}</p>
            <span style="font-size:0.72rem;color:var(--text-muted)">${escapeHtml(f.email || '')}</span>
          </div>`;
        }).join('');
      }
    }
  } catch(e) {
    console.error('Error loading teacher data:', e);
  }

  // Load library panel and setup topic auto-populate
  loadLibraryPanel();
  setupTopicAutoPopulate();
}

// Teacher panel password gate
let teacherPanelUnlocked = !!localStorage.getItem('bstbaba_tp_unlocked');
function openTeacherPanel() {
  if (teacherPanelUnlocked) {
    document.getElementById('teacherPanel').classList.remove('hidden');
    localStorage.setItem('bstbaba_tp_open', 'true');
    loadTeacherData();
    return;
  }
  const pwd = prompt('Enter Teacher Panel Password:');
  if (pwd === 'aks1234') {
    teacherPanelUnlocked = true;
    localStorage.setItem('bstbaba_tp_unlocked', 'true');
    localStorage.setItem('bstbaba_tp_open', 'true');
    document.getElementById('teacherPanel').classList.remove('hidden');
    loadTeacherData();
  } else if (pwd !== null) {
    alert('Incorrect password.');
  }
}
function closeTeacherPanel() {
  document.getElementById('teacherPanel').classList.add('hidden');
  localStorage.removeItem('bstbaba_tp_open');
}

// Save Grok API Key
async function saveGrokKey() {
  const key = document.getElementById('grokKeyInput').value.trim();
  const status = document.getElementById('grokKeyStatus');
  if (!key || (!key.startsWith('xai-') && !key.startsWith('gsk_'))) {
    status.textContent = '✕ Invalid key. Should start with gsk_ (Groq) or xai- (xAI)';
    status.style.color = '#f87171';
    status.style.display = 'block';
    return;
  }

  status.textContent = 'Saving to cloud...';
  status.style.color = 'var(--text-muted)';
  status.style.display = 'block';

  localStorage.setItem('bstbaba_grok_key', key);

  try {
    await db.collection('bstbaba_config').doc('grok').set({
      apiKey: key,
      updated: new Date().toISOString()
    });
    status.textContent = '✓ API key saved to cloud! Works on all devices now.';
    status.style.color = 'var(--accent)';
  } catch(e) {
    status.textContent = '✕ Cloud save failed: ' + e.message + '. Key saved locally only.';
    status.style.color = '#f87171';
    console.error('Firestore save error:', e);
  }
  status.style.display = 'block';
}

// Question generator — multi-select
let lastGeneratedContent = '';
let lastGenConfig = {};

async function generateQuestions() {
  const apiKey = await getGrokKey();
  const types = Array.from(document.getElementById('qgenType').selectedOptions).map(o => o.value);
  const chapters = Array.from(document.getElementById('qgenChapter').selectedOptions).map(o => o.value);
  const topics = Array.from(document.getElementById('qgenTopics').selectedOptions).map(o => o.value).filter(Boolean);
  const difficulty = document.getElementById('qgenDifficulty').value;
  const count = document.getElementById('qgenCount').value;
  const title = document.getElementById('qgenTitle').value.trim();
  const output = document.getElementById('qgenOutput');

  if (!apiKey) {
    output.innerHTML = '<div style="padding:16px;background:var(--accent-gold-light);border-radius:8px">⚠️ API key not set. Go to AI Configuration above.</div>';
    return;
  }
  if (chapters.length === 0) {
    output.innerHTML = '<div style="padding:16px;background:var(--accent-gold-light);border-radius:8px">⚠️ Select at least one chapter.</div>';
    return;
  }

  const typeLabels = {full:'full 80-mark board paper',mcq:'MCQ questions',short:'short answer (3 marks)',distinguish:'distinguish between (4 marks)',case:'case study (5 marks)',long:'long answer (6 marks)',assertion:'assertion-reason questions'};
  const typeStr = types.map(t => typeLabels[t] || t).join(', ');
  const chStr = chapters.map(c => 'Chapter ' + c).join(', ');
  const topicStr = topics.length > 0 ? ' Topics: ' + topics.join(', ') + '.' : '';
  const diffStr = difficulty !== 'mixed' ? ' Difficulty: ' + difficulty + '.' : '';

  output.innerHTML = '<div style="padding:16px;background:var(--accent-light);border-radius:8px">⏳ Generating questions... This may take 10-20 seconds.</div>';

  const prompt = `Generate ${count} questions for CBSE Class 12 Business Studies. Types: ${typeStr}. Chapters: ${chStr}.${topicStr}${diffStr} Follow exact CBSE board exam pattern 2026-27. Include marks for each question. For MCQs include 4 options and mark correct answer. For case studies create realistic scenarios. For assertion-reason use standard A/R format. Number all questions clearly.`;

  const config = getApiConfig(apiKey);
  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey},
      body: JSON.stringify({
        model: config.model,
        messages: [
          {role: 'system', content: 'You are an expert CBSE Class 12 Business Studies question paper setter. Generate questions matching the CBSE board pattern for 2026-27. Be accurate with NCERT content. Include marks allocation.'},
          {role: 'user', content: prompt}
        ]
      })
    });
    const data = await res.json();
    if (data.error) {
      output.innerHTML = '<div style="padding:16px;background:rgba(248,113,113,0.1);border-radius:8px;color:#f87171">Error: ' + (data.error.message || JSON.stringify(data.error)) + '</div>';
      return;
    }
    lastGeneratedContent = data.choices?.[0]?.message?.content || '';
    lastGenConfig = {types, chapters, topics, difficulty, count: parseInt(count), title: title || 'Question Set ' + new Date().toLocaleDateString()};

    output.innerHTML = '<div style="padding:16px;background:var(--bg);border-radius:8px;border:1px solid var(--border);white-space:pre-wrap;font-size:0.83rem;line-height:1.7;max-height:500px;overflow-y:auto">' + lastGeneratedContent.replace(/\n/g, '<br>') + '</div>';

    document.getElementById('saveToLibBtn').disabled = false;
  } catch(e) {
    output.innerHTML = '<div style="padding:16px;background:rgba(248,113,113,0.1);border-radius:8px;color:#f87171">Failed: ' + e.message + '</div>';
  }
}

// Save generated set to Firestore library
async function saveToLibrary() {
  if (!lastGeneratedContent) { alert('Generate questions first.'); return; }
  const btn = document.getElementById('saveToLibBtn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    await db.collection('bstbaba_question_sets').add({
      title: lastGenConfig.title,
      content: lastGeneratedContent,
      type: lastGenConfig.types.join(', '),
      chapters: lastGenConfig.chapters,
      topics: lastGenConfig.topics || [],
      difficulty: lastGenConfig.difficulty,
      questionCount: lastGenConfig.count,
      created: new Date().toISOString(),
      createdBy: 'AKS'
    });
    btn.textContent = '✓ Saved to Library!';
    btn.style.background = 'var(--accent)';
    loadLibraryPanel();
    setTimeout(() => {
      btn.textContent = '📚 Save to Library';
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  } catch(e) {
    alert('Save failed: ' + e.message);
    btn.textContent = '📚 Save to Library';
    btn.disabled = false;
  }
}

// Load library list in teacher panel
async function loadLibraryPanel() {
  const container = document.getElementById('tpLibraryList');
  if (!container) return;
  try {
    const snap = await db.collection('bstbaba_question_sets').orderBy('created', 'desc').limit(20).get();
    if (snap.empty) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">No question sets saved yet. Generate and save your first set above.</p>';
      return;
    }
    container.innerHTML = snap.docs.map(doc => {
      const s = doc.data();
      return '<div style="padding:12px;background:var(--bg);border-radius:8px;margin-bottom:8px;border:1px solid var(--border)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<strong style="font-size:0.85rem">' + escapeHtml(s.title || 'Untitled') + '</strong>' +
          '<span style="font-size:0.68rem;color:var(--text-muted)">' + (s.created ? new Date(s.created).toLocaleDateString() : '') + '</span>' +
        '</div>' +
        '<div style="font-size:0.72rem;color:var(--text-muted)">' + (s.type || '') + ' | ' + (s.chapters || []).map(c => 'Ch ' + c).join(', ') + ' | ' + (s.questionCount || '?') + ' Qs | ' + (s.difficulty || 'mixed') + '</div>' +
        '<div style="display:flex;gap:4px;margin-top:6px">' +
          '<button style="font-size:0.7rem;padding:3px 8px;border-radius:4px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);cursor:pointer" onclick="editSet(\'' + doc.id + '\')">Edit</button>' +
          '<button style="font-size:0.7rem;padding:3px 8px;border-radius:4px;border:1px solid rgba(248,113,113,0.3);background:var(--bg-card);color:#f87171;cursor:pointer" onclick="deleteSetTP(\'' + doc.id + '\')">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    container.innerHTML = '<p style="color:var(--text-muted)">Could not load library.</p>';
  }
}

async function deleteSetTP(id) {
  if (!confirm('Delete this question set?')) return;
  await db.collection('bstbaba_question_sets').doc(id).delete();
  loadLibraryPanel();
}

// Auto-populate topics when chapters are selected
function setupTopicAutoPopulate() {
  const chSelect = document.getElementById('qgenChapter');
  if (!chSelect) return;
  chSelect.addEventListener('change', async () => {
    const selected = Array.from(chSelect.selectedOptions).map(o => o.value);
    const topicSelect = document.getElementById('qgenTopics');
    topicSelect.innerHTML = '';
    try {
      const res = await fetch('content/topics.json');
      const data = await res.json();
      selected.forEach(ch => {
        if (data[ch]) {
          data[ch].topics.forEach(t => {
            topicSelect.innerHTML += '<option value="' + t + '">Ch' + ch + ': ' + t + '</option>';
          });
        }
      });
      if (topicSelect.options.length === 0) {
        topicSelect.innerHTML = '<option value="">Select chapters first</option>';
      }
    } catch(e) {}
  });
}

// Copy generated questions
function copyQuestions() {
  const output = document.getElementById('qgenOutput');
  const text = output.querySelector('div').textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('Questions copied to clipboard!');
  });
}

// Broadcast
async function broadcastWhatsApp() {
  const msg = document.getElementById('broadcastMsg').value.trim();
  if (!msg) { alert('Please type a message first.'); return; }
  const students = await getStudents();
  if (students.length === 0) { alert('No students registered yet.'); return; }
  const encoded = encodeURIComponent(msg);
  students.forEach(s => {
    const phone = (s.phone || '').replace(/[^0-9]/g, '');
    if (phone) window.open('https://wa.me/' + phone + '?text=' + encoded, '_blank');
  });
}
async function broadcastEmail() {
  const msg = document.getElementById('broadcastMsg').value.trim();
  if (!msg) { alert('Please type a message first.'); return; }
  const students = await getStudents();
  const emails = students.map(s => s.email).filter(Boolean).join(',');
  if (!emails) { alert('No student emails found.'); return; }
  window.open('mailto:' + emails + '?subject=' + encodeURIComponent('BSt Baba - AKSpected Update') + '&body=' + encodeURIComponent(msg), '_blank');
}

// ─── KEY LISTENER (B = Teacher Panel) + Hidden button for mobile/iPad ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'b' || e.key === 'B') {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    openTeacherPanel();
  }
});

// Hidden teacher panel trigger — tap footer brand 5 times
let footerTapCount = 0;
let footerTapTimer = null;
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('footer-brand')) {
    footerTapCount++;
    clearTimeout(footerTapTimer);
    footerTapTimer = setTimeout(() => { footerTapCount = 0; }, 2000);
    if (footerTapCount >= 5) {
      footerTapCount = 0;
      openTeacherPanel();
    }
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
  gateContent();
  // Auto-reopen teacher panel if it was open before refresh
  if (localStorage.getItem('bstbaba_tp_open') && localStorage.getItem('bstbaba_tp_unlocked')) {
    document.getElementById('teacherPanel').classList.remove('hidden');
    loadTeacherData();
  }
});
