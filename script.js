/* ═══════════════════════════════════════════════════════════════
   ARBEE'S BAKERY SHOP — INVENTORY SYSTEM
   Full Application Script
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   SECURITY CONFIG
───────────────────────────────────────────────────────────────*/
const SEC = {
  MAX_ATTEMPTS: 5,       // max failed logins before lockout
  LOCKOUT_MS:   300000,  // 5-minute lockout in milliseconds
  SESSION_MS:   3600000, // 1-hour auto-logout
  OTP_EXPIRY_MS: 300000, // 5-minute OTP expiry
  OTP_RESEND_MS: 60000,  // 60-second cooldown before resend allowed
};

/* ─────────────────────────────────────────────────────────────
   EMAILJS CONFIG
   ▸ Sign up free at https://www.emailjs.com
   ▸ Create a service (Gmail), add a template, then paste IDs below
───────────────────────────────────────────────────────────────*/
const EMAILJS_CFG = {
  publicKey:   'YOUR_EMAILJS_PUBLIC_KEY',   // ← Account > API Keys
  serviceId:   'YOUR_SERVICE_ID',           // ← Email Services
  templateId:  'YOUR_TEMPLATE_ID',          // ← Email Templates
};

/* ─────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────────*/
let APP = {
  currentUser:      null,
  pendingUser:      null,   // set after credentials pass, cleared after OTP
  rememberMe:       false,
  currentModule:    'dashboard',
  sessionTimer:     null,
  otpCountdownTimer: null,
  sidebarCollapsed: false,
  notifications:    [],
  theme: localStorage.getItem('arbees_theme') || 'light',
};

/* ─────────────────────────────────────────────────────────────
   LOCAL STORAGE HELPERS
───────────────────────────────────────────────────────────────*/
const store = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  del: (key)      => localStorage.removeItem(key),
};

/* ─────────────────────────────────────────────────────────────
   SEED DEFAULT USERS (first run)
───────────────────────────────────────────────────────────────*/
function seedUsers() {
  if (!store.get('arbees_users')) {
    store.set('arbees_users', [
      {
        id: 'u1',
        firstName: 'Admin',
        lastName:  'Arbee',
        username:  'admin',
        email:     'admin@arbees.com',
        password:  btoa('Admin@123'),   // base64 encode (demo only)
        role:      'admin',
        createdAt: new Date().toISOString(),
        avatar:    'A',
      }
    ]);
  }
}

/* ─────────────────────────────────────────────────────────────
   SEED SAMPLE DATA
───────────────────────────────────────────────────────────────*/
function seedData() {
  if (!store.get('arbees_categories')) {
    store.set('arbees_categories', [
      { id:'c1', name:'Bread',      icon:'🍞', color:'#c8702a', count:8  },
      { id:'c2', name:'Pastries',   icon:'🥐', color:'#f5c842', count:12 },
      { id:'c3', name:'Cakes',      icon:'🎂', color:'#e8913e', count:6  },
      { id:'c4', name:'Cookies',    icon:'🍪', color:'#9e5520', count:10 },
      { id:'c5', name:'Drinks',     icon:'☕', color:'#3b82f6', count:5  },
      { id:'c6', name:'Sandwiches', icon:'🥪', color:'#22c55e', count:7  },
    ]);
  }

  if (!store.get('arbees_products')) {
    store.set('arbees_products', [
      { id:'p1', name:'Sourdough Bread',  category:'Bread',      price:120, stock:45, unit:'loaf',  emoji:'🍞', supplier:'s1', status:'active' },
      { id:'p2', name:'Croissant',        category:'Pastries',   price:55,  stock:30, unit:'pc',    emoji:'🥐', supplier:'s2', status:'active' },
      { id:'p3', name:'Chocolate Cake',   category:'Cakes',      price:850, stock:8,  unit:'whole', emoji:'🎂', supplier:'s1', status:'active' },
      { id:'p4', name:'Choco Chip Cookie',category:'Cookies',    price:35,  stock:120,unit:'pc',    emoji:'🍪', supplier:'s2', status:'active' },
      { id:'p5', name:'Iced Latte',       category:'Drinks',     price:95,  stock:50, unit:'cup',   emoji:'☕', supplier:'s3', status:'active' },
      { id:'p6', name:'Club Sandwich',    category:'Sandwiches', price:150, stock:20, unit:'pc',    emoji:'🥪', supplier:'s1', status:'active' },
      { id:'p7', name:'Cinnamon Roll',    category:'Pastries',   price:75,  stock:6,  unit:'pc',    emoji:'🌀', supplier:'s2', status:'active' },
      { id:'p8', name:'Pandesal',         category:'Bread',      price:8,   stock:200,unit:'pc',    emoji:'🍞', supplier:'s1', status:'active' },
      { id:'p9', name:'Blueberry Muffin', category:'Pastries',   price:65,  stock:3,  unit:'pc',    emoji:'🧁', supplier:'s2', status:'low'    },
    ]);
  }

  if (!store.get('arbees_suppliers')) {
    store.set('arbees_suppliers', [
      { id:'s1', name:'Golden Grains Supply',  type:'Flour & Grains', contact:'09171234567', email:'golden@grains.ph',  address:'Quezon City', status:'active',   products:4 },
      { id:'s2', name:'Sweet Treats Co.',      type:'Baking Supplies',contact:'09281234567', email:'sweet@treats.ph',   address:'Makati City', status:'active',   products:4 },
      { id:'s3', name:'Brewed Blends Inc.',    type:'Beverages',      contact:'09391234567', email:'brewed@blends.ph',  address:'Pasig City',  status:'active',   products:1 },
      { id:'s4', name:'Dairy Fresh Farms',     type:'Dairy & Eggs',   contact:'09401234567', email:'dairy@fresh.ph',    address:'Laguna',      status:'inactive', products:0 },
    ]);
  }

  if (!store.get('arbees_activity')) {
    const now = Date.now();
    store.set('arbees_activity', [
      { type:'success', text:'Restocked <strong>Pandesal</strong> — +200 pcs',          time: now - 300000  },
      { type:'warning', text:'Low stock alert: <strong>Blueberry Muffin</strong> (3 left)', time: now - 900000  },
      { type:'info',    text:'New supplier <strong>Brewed Blends Inc.</strong> added',   time: now - 1800000 },
      { type:'success', text:'New product <strong>Iced Latte</strong> added',            time: now - 3600000 },
      { type:'info',    text:'<strong>admin</strong> updated inventory settings',         time: now - 7200000 },
    ]);
  }

  if (!store.get('arbees_sales')) {
    store.set('arbees_sales', [120,185,140,220,175,260,310]);
  }
}

/* ─────────────────────────────────────────────────────────────
   AUTH — TAB SWITCHER
───────────────────────────────────────────────────────────────*/
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`${tab}-form`).classList.add('active');
  clearAlerts();
}

/* ─────────────────────────────────────────────────────────────
   AUTH — PASSWORD VISIBILITY
───────────────────────────────────────────────────────────────*/
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

/* ─────────────────────────────────────────────────────────────
   AUTH — PASSWORD STRENGTH
───────────────────────────────────────────────────────────────*/
function checkPasswordStrength(pw) {
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!fill || !label) return;

  let score = 0;
  if (pw.length >= 8)               score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))      score++;
  if (pw.length >= 12)              score++;

  const levels = [
    { pct:'0%',   color:'#ef4444', text:'' },
    { pct:'25%',  color:'#ef4444', text:'Weak' },
    { pct:'50%',  color:'#f59e0b', text:'Fair' },
    { pct:'75%',  color:'#3b82f6', text:'Good' },
    { pct:'90%',  color:'#22c55e', text:'Strong' },
    { pct:'100%', color:'#16a34a', text:'Very Strong' },
  ];

  const lvl = levels[Math.min(score, 5)];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
}

/* ─────────────────────────────────────────────────────────────
   AUTH — USERNAME AVAILABILITY CHECK
───────────────────────────────────────────────────────────────*/
function checkUsernameAvailability(val) {
  const hint = document.getElementById('username-hint');
  if (!hint || val.length < 3) { hint.textContent = ''; return; }
  const users = store.get('arbees_users', []);
  const taken = users.some(u => u.username.toLowerCase() === val.toLowerCase());
  hint.textContent = taken ? '✗ Username already taken' : '✓ Username available';
  hint.className   = 'field-hint ' + (taken ? 'taken' : 'available');
}

/* ─────────────────────────────────────────────────────────────
   AUTH — LOCKOUT SYSTEM
───────────────────────────────────────────────────────────────*/
function getLockout(username) {
  return store.get(`arbees_lock_${username}`, { attempts: 0, lockedUntil: null });
}
function setLockout(username, data) {
  store.set(`arbees_lock_${username}`, data);
}
function isLockedOut(username) {
  const lock = getLockout(username);
  if (lock.lockedUntil && Date.now() < lock.lockedUntil) return true;
  if (lock.lockedUntil && Date.now() >= lock.lockedUntil) {
    setLockout(username, { attempts: 0, lockedUntil: null }); // auto-reset
  }
  return false;
}
function recordFailedAttempt(username) {
  const lock = getLockout(username);
  lock.attempts++;
  if (lock.attempts >= SEC.MAX_ATTEMPTS) {
    lock.lockedUntil = Date.now() + SEC.LOCKOUT_MS;
  }
  setLockout(username, lock);
  return lock;
}
function resetLockout(username) {
  setLockout(username, { attempts: 0, lockedUntil: null });
}

/* ─────────────────────────────────────────────────────────────
   AUTH — LOGIN
───────────────────────────────────────────────────────────────*/
function handleLogin(e) {
  e.preventDefault();
  clearAlerts();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('remember-me').checked;
  const btn      = document.getElementById('login-btn');

  if (!username || !password) {
    showAlert('login-alert', 'error', 'Please fill in all fields.');
    return;
  }

  // Lockout check
  if (isLockedOut(username)) {
    const lock = getLockout(username);
    const mins = Math.ceil((lock.lockedUntil - Date.now()) / 60000);
    showLockoutBanner(`Account locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
    return;
  }

  setButtonLoading(btn, true);

  // Simulate async authentication (200ms delay for UX)
  setTimeout(() => {
    const users = store.get('arbees_users', []);
    const user  = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || atob(user.password) !== password) {
      const lock = recordFailedAttempt(username);
      const remaining = SEC.MAX_ATTEMPTS - lock.attempts;

      if (lock.lockedUntil) {
        showAlert('login-alert', 'error', 'Too many failed attempts. Account locked for 5 minutes.');
        showLockoutBanner('Account temporarily locked due to multiple failed attempts.');
        shakeForm('login-form');
      } else {
        showAlert('login-alert', 'error', `Invalid username or password.${remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : ''}`);
        updateAttemptIndicator(lock.attempts);
        shakeForm('login-form');
      }

      setButtonLoading(btn, false);
      return;
    }

    // ── CREDENTIALS VALID → Proceed to OTP ──
    resetLockout(username);

    // Store pending user (not fully logged in yet — OTP pending)
    APP.pendingUser  = { ...user };
    APP.rememberMe   = remember;
    delete APP.pendingUser.password;

    setButtonLoading(btn, false);

    // Trigger OTP flow
    initiateOTP(user);

  }, 200);
}

/* ─────────────────────────────────────────────────────────────
   AUTH — REGISTER
───────────────────────────────────────────────────────────────*/
function handleRegister(e) {
  e.preventDefault();
  clearAlerts();

  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const username  = document.getElementById('reg-username').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const role      = document.getElementById('reg-role').value;
  const password  = document.getElementById('reg-password').value;
  const confirm   = document.getElementById('reg-confirm').value;
  const agree     = document.getElementById('agree-terms').checked;
  const btn       = document.getElementById('register-btn');

  // Validations
  if (!firstName || !lastName || !username || !email || !role || !password || !confirm) {
    showAlert('register-alert', 'error', 'Please fill in all required fields.');
    return;
  }
  if (!agree) {
    showAlert('register-alert', 'warning', 'You must agree to the Terms & Conditions.');
    return;
  }
  if (username.length < 3) {
    showAlert('register-alert', 'error', 'Username must be at least 3 characters.');
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showAlert('register-alert', 'error', 'Username can only contain letters, numbers, and underscores.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert('register-alert', 'error', 'Please enter a valid email address.');
    return;
  }
  if (password.length < 8) {
    showAlert('register-alert', 'error', 'Password must be at least 8 characters.');
    return;
  }
  if (password !== confirm) {
    showAlert('register-alert', 'error', 'Passwords do not match.');
    shakeForm('register-form');
    return;
  }

  const users = store.get('arbees_users', []);
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    showAlert('register-alert', 'error', 'Username is already taken. Please choose another.');
    return;
  }
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    showAlert('register-alert', 'error', 'An account with this email already exists.');
    return;
  }

  setButtonLoading(btn, true);

  setTimeout(() => {
    const newUser = {
      id:        'u' + Date.now(),
      firstName,
      lastName,
      username,
      email,
      password:  btoa(password),
      role,
      createdAt: new Date().toISOString(),
      avatar:    firstName.charAt(0).toUpperCase(),
    };

    users.push(newUser);
    store.set('arbees_users', users);
    logActivity('success', `New user <strong>${firstName} ${lastName}</strong> registered`);

    setButtonLoading(btn, false);
    showAlert('register-alert', 'success', `Account created successfully! You can now log in, ${firstName}. 🎉`);

    // Pre-fill login form with new username and switch tab
    setTimeout(() => {
      document.getElementById('login-username').value = username;
      switchTab('login');
      showToast('Account created! Please log in.', 'success');
    }, 1500);

  }, 300);
}

/* ─────────────────────────────────────────────────────────────
   AUTH — HELPERS
───────────────────────────────────────────────────────────────*/
function showAlert(id, type, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert-box ${type}`;
  el.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
  el.classList.remove('hidden');
}

function clearAlerts() {
  document.querySelectorAll('.alert-box').forEach(el => el.classList.add('hidden'));
  document.getElementById('login-lockout-banner')?.classList.add('hidden');
  document.getElementById('attempt-indicator').textContent = '';
}

function showLockoutBanner(msg) {
  const banner = document.getElementById('login-lockout-banner');
  const span   = document.getElementById('lockout-message');
  if (!banner || !span) return;
  span.textContent = msg;
  banner.classList.remove('hidden');
}

function updateAttemptIndicator(count) {
  const el = document.getElementById('attempt-indicator');
  if (!el) return;
  if (count > 0) {
    const dots = Array.from({ length: SEC.MAX_ATTEMPTS }, (_, i) =>
      `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 2px;background:${i < count ? '#ef4444' : '#e4e4e7'}"></span>`
    ).join('');
    el.innerHTML = `Login attempts: ${dots}`;
  } else {
    el.textContent = '';
  }
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.querySelector('.btn-text')?.classList.toggle('hidden', loading);
  btn.querySelector('.btn-loader')?.classList.toggle('hidden', !loading);
}

function shakeForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.style.animation = 'none';
  void form.offsetWidth;
  form.style.animation = 'shake .5s';
  setTimeout(() => { form.style.animation = ''; }, 500);
}

function showForgotModal() {
  openModal(`
    <h3><i class="fas fa-key" style="color:var(--primary)"></i> Reset Password</h3>
    <p>Enter your username or email to reset your password.</p>
    <div class="modal-form">
      <div class="form-group">
        <label>Username or Email</label>
        <input type="text" id="forgot-input" placeholder="Enter username or email" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="processForgotPassword()">
          <i class="fas fa-paper-plane"></i> Send Reset
        </button>
      </div>
    </div>
  `);
}

function processForgotPassword() {
  const val   = document.getElementById('forgot-input')?.value.trim();
  if (!val) return;
  const users = store.get('arbees_users', []);
  const user  = users.find(u => u.username === val || u.email === val);
  closeModal();
  if (user) {
    showToast(`Password reset link sent to ${user.email} (demo)`, 'info');
  } else {
    showToast('No account found with that username/email.', 'error');
  }
}

function showTerms() {
  openModal(`
    <h3>Terms & Conditions</h3>
    <p>Last updated: ${new Date().toLocaleDateString()}</p>
    <div class="modal-form" style="max-height:320px;overflow-y:auto;color:var(--gray-600);font-size:.84rem;line-height:1.7;padding-top:0">
      <p><strong>1. Acceptance</strong><br/>By registering, you agree to use this system only for Arbee's Bakery Shop inventory management purposes.</p>
      <p><strong>2. Account Security</strong><br/>You are responsible for maintaining the confidentiality of your login credentials. Report unauthorized access immediately.</p>
      <p><strong>3. Data Usage</strong><br/>All data entered into this system is owned by Arbee's Bakery Shop and must not be shared externally.</p>
      <p><strong>4. Acceptable Use</strong><br/>You may not misuse this system, attempt to bypass security measures, or interfere with other users' access.</p>
      <p><strong>5. Privacy</strong><br/>Your account information is stored securely and will not be disclosed to third parties without your consent.</p>
    </div>
    <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">I Understand</button></div>
  `);
}

/* ─────────────────────────────────────────────────────────────
   SESSION MANAGEMENT
───────────────────────────────────────────────────────────────*/
function checkSession() {
  const session = store.get('arbees_session');
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    store.del('arbees_session');
    return false;
  }
  const users = store.get('arbees_users', []);
  const user  = users.find(u => u.id === session.userId);
  if (!user) { store.del('arbees_session'); return false; }
  APP.currentUser = { ...user };
  delete APP.currentUser.password;
  return true;
}

function startSessionTimer() {
  clearInterval(APP.sessionTimer);
  APP.sessionTimer = setInterval(() => {
    const session = store.get('arbees_session');
    if (!session || Date.now() > session.expiresAt) {
      clearInterval(APP.sessionTimer);
      showToast('Session expired. Please log in again.', 'warning');
      setTimeout(logout, 1500);
    }
    // Warn 5 minutes before expiry
    if (session && session.expiresAt - Date.now() < 300000) {
      addNotification('warn', 'Your session expires in less than 5 minutes.');
    }
  }, 60000);
}

/* ─────────────────────────────────────────────────────────────
   APP LAUNCH / LOGOUT
───────────────────────────────────────────────────────────────*/
function launchApp() {
  // Hide auth, show app
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('particles-bg').style.opacity = '0.4';

  // Set user info in UI
  const u = APP.currentUser;
  const initial = (u.firstName || u.username).charAt(0).toUpperCase();
  document.getElementById('sidebar-avatar').textContent    = initial;
  document.getElementById('sidebar-name').textContent      = `${u.firstName} ${u.lastName}`;
  document.getElementById('sidebar-role').textContent      = capitalize(u.role);
  document.getElementById('topbar-avatar-letter').textContent = initial;

  // Apply theme
  applyTheme(APP.theme);

  // Start session timer
  startSessionTimer();

  // Setup notifications
  APP.notifications = [];
  checkLowStockNotifications();

  // Load dashboard by default
  loadModule('dashboard', document.querySelector('[data-module="dashboard"]'));
}

function logout() {
  clearInterval(APP.sessionTimer);
  store.del('arbees_session');
  APP.currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('particles-bg').style.opacity = '1';
  // Reset login form
  document.getElementById('login-username').value = store.get('arbees_remember') || '';
  document.getElementById('login-password').value = '';
  clearAlerts();
  switchTab('login');
}

function confirmLogout() {
  showConfirm(
    'Log Out',
    'Are you sure you want to log out of Arbee\'s Bakery IMS?',
    logout
  );
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR TOGGLE
───────────────────────────────────────────────────────────────*/
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main    = document.getElementById('main-content');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
  } else {
    APP.sidebarCollapsed = !APP.sidebarCollapsed;
    sidebar.classList.toggle('collapsed', APP.sidebarCollapsed);
    main.classList.toggle('expanded', APP.sidebarCollapsed);
  }
}

/* ─────────────────────────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────────────────────────────*/
function checkLowStockNotifications() {
  const products = store.get('arbees_products', []);
  products.filter(p => p.stock <= 5).forEach(p => {
    addNotification('warn', `Low stock: <strong>${p.name}</strong> — only ${p.stock} left`);
  });
  updateNotifBadge();
}

function addNotification(type, msg) {
  APP.notifications.unshift({ type, msg, time: Date.now() });
  if (APP.notifications.length > 20) APP.notifications.pop();
  updateNotifBadge();
}

function updateNotifBadge() {
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = APP.notifications.length ? '' : 'none';
  // Update inventory badge
  const products  = store.get('arbees_products', []);
  const lowCount  = products.filter(p => p.stock <= 5).length;
  const badge     = document.getElementById('low-stock-badge');
  if (badge) { badge.textContent = lowCount; badge.style.display = lowCount ? '' : 'none'; }
}

function toggleNotif() {
  const panel = document.getElementById('notif-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderNotifPanel();
}

function renderNotifPanel() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!APP.notifications.length) {
    list.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash"></i><br/>No notifications</div>`;
    return;
  }
  list.innerHTML = APP.notifications.map(n => `
    <div class="notif-item">
      <div class="notif-icon ${n.type}">
        <i class="fas fa-${n.type === 'warn' ? 'exclamation-triangle' : n.type === 'ok' ? 'check' : 'info-circle'}"></i>
      </div>
      <div>
        <div style="line-height:1.4">${n.msg}</div>
        <div style="font-size:.7rem;color:var(--gray-300);margin-top:2px">${timeAgo(n.time)}</div>
      </div>
    </div>
  `).join('');
}

function clearNotifs() {
  APP.notifications = [];
  updateNotifBadge();
  renderNotifPanel();
}

// Close notif panel when clicking outside
document.addEventListener('click', e => {
  const panel = document.getElementById('notif-panel');
  if (panel && !panel.contains(e.target) && !e.target.closest('.topbar-icon-btn')) {
    panel.classList.add('hidden');
  }
});

/* ─────────────────────────────────────────────────────────────
   MODULE LOADER
───────────────────────────────────────────────────────────────*/
function loadModule(name, navEl) {
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  APP.currentModule = name;
  document.getElementById('breadcrumb-title').textContent = capitalize(name);
  document.title = `${capitalize(name)} — Arbee's Bakery IMS`;

  const container = document.getElementById('module-container');
  container.style.opacity = '0';
  container.style.transform = 'translateY(10px)';

  // Close notification panel
  document.getElementById('notif-panel')?.classList.add('hidden');

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('mobile-open');

  setTimeout(() => {
    const modules = { dashboard, products, inventory, categories, suppliers, profile, settings };
    container.innerHTML = (modules[name] || (() => `<div class="empty-state"><i class="fas fa-hammer"></i><h3>${capitalize(name)}</h3><p>Module coming soon.</p></div>`))();
    container.style.transition = 'opacity .3s, transform .3s';
    container.style.opacity    = '1';
    container.style.transform  = 'translateY(0)';
    afterModuleLoad(name);
  }, 100);
}

function afterModuleLoad(name) {
  if (name === 'dashboard')  renderDashboardCharts();
  if (name === 'settings')   initSettings();
  updateNotifBadge();
}

/* ─────────────────────────────────────────────────────────────
   MODULE: DASHBOARD
───────────────────────────────────────────────────────────────*/
function dashboard() {
  const products   = store.get('arbees_products', []);
  const suppliers  = store.get('arbees_suppliers', []);
  const categories = store.get('arbees_categories', []);
  const activity   = store.get('arbees_activity', []);
  const totalVal   = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStock   = products.filter(p => p.stock <= 5).length;

  return `
  <div class="page-header">
    <div class="page-title">
      <h2>Dashboard</h2>
      <p>Welcome back, ${APP.currentUser.firstName}! Here's what's happening today.</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-secondary btn-sm"><i class="fas fa-download"></i> Export</button>
      <button class="btn btn-primary btn-sm" onclick="loadModule('inventory', document.querySelector('[data-module=inventory]'))">
        <i class="fas fa-boxes"></i> View Inventory
      </button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card animate-in delay-1">
      <div class="stat-icon orange"><i class="fas fa-birthday-cake"></i></div>
      <div class="stat-info">
        <div class="stat-value">${products.length}</div>
        <div class="stat-label">Total Products</div>
        <div class="stat-trend up"><i class="fas fa-arrow-up"></i> Active items</div>
      </div>
    </div>
    <div class="stat-card animate-in delay-2">
      <div class="stat-icon yellow"><i class="fas fa-peso-sign"></i></div>
      <div class="stat-info">
        <div class="stat-value">₱${formatNum(totalVal)}</div>
        <div class="stat-label">Inventory Value</div>
        <div class="stat-trend up"><i class="fas fa-arrow-up"></i> Total stock value</div>
      </div>
    </div>
    <div class="stat-card animate-in delay-3">
      <div class="stat-icon ${lowStock > 0 ? 'red' : 'green'}"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="stat-info">
        <div class="stat-value">${lowStock}</div>
        <div class="stat-label">Low Stock Alerts</div>
        <div class="stat-trend ${lowStock > 0 ? 'down' : 'up'}">
          <i class="fas fa-arrow-${lowStock > 0 ? 'down' : 'up'}"></i>
          ${lowStock > 0 ? 'Needs restocking' : 'All good'}
        </div>
      </div>
    </div>
    <div class="stat-card animate-in delay-4">
      <div class="stat-icon blue"><i class="fas fa-truck"></i></div>
      <div class="stat-info">
        <div class="stat-value">${suppliers.filter(s => s.status === 'active').length}</div>
        <div class="stat-label">Active Suppliers</div>
        <div class="stat-trend up"><i class="fas fa-circle"></i> Active partnerships</div>
      </div>
    </div>
    <div class="stat-card animate-in delay-5">
      <div class="stat-icon purple"><i class="fas fa-tags"></i></div>
      <div class="stat-info">
        <div class="stat-value">${categories.length}</div>
        <div class="stat-label">Categories</div>
        <div class="stat-trend up"><i class="fas fa-layer-group"></i> Product categories</div>
      </div>
    </div>
  </div>

  <div class="dash-grid">
    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-chart-bar"></i> Weekly Sales (units)</span>
        <span style="font-size:.75rem;color:var(--gray-400)">Last 7 days</span>
      </div>
      <div class="card-body">
        <div class="chart-bars" id="sales-chart"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-clock"></i> Recent Activity</span>
      </div>
      <div class="card-body" style="padding:0 20px">
        <div class="activity-list">
          ${activity.slice(0,5).map(a => `
            <div class="activity-item">
              <div class="activity-dot" style="background:${a.type==='success'?'var(--success)':a.type==='warning'?'var(--warning)':'var(--info)'}"></div>
              <div class="activity-text">${a.text}</div>
              <div class="activity-time">${timeAgo(a.time)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- Low stock table -->
  ${lowStock > 0 ? `
  <div class="card" style="margin-top:18px">
    <div class="card-header">
      <span class="card-title"><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Low Stock Products</span>
      <button class="btn btn-danger btn-sm" onclick="loadModule('inventory', document.querySelector('[data-module=inventory]'))">
        <i class="fas fa-arrow-right"></i> Manage
      </button>
    </div>
    <div class="card-body" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead>
          <tbody>
            ${products.filter(p => p.stock <= 5).map(p => `
              <tr>
                <td>${p.emoji} <strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>${p.stock} ${p.unit}s</td>
                <td><span class="badge badge-danger">Critical</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  ` : ''}
  `;
}

function renderDashboardCharts() {
  const chartEl = document.getElementById('sales-chart');
  if (!chartEl) return;
  const sales = store.get('arbees_sales', [120,185,140,220,175,260,310]);
  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const max   = Math.max(...sales);

  chartEl.innerHTML = sales.map((v, i) => `
    <div class="chart-bar-group">
      <div class="chart-bar" style="height:${(v/max)*130}px" data-value="${v}" title="${days[i]}: ${v} units"></div>
      <span class="chart-bar-label">${days[i]}</span>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────────────────────
   MODULE: PRODUCTS
───────────────────────────────────────────────────────────────*/
function products() {
  const prods = store.get('arbees_products', []);
  const cats  = store.get('arbees_categories', []);

  return `
  <div class="page-header">
    <div class="page-title">
      <h2>Products</h2>
      <p>${prods.length} products in your bakery</p>
    </div>
    <button class="btn btn-primary" onclick="openAddProductModal()">
      <i class="fas fa-plus"></i> Add Product
    </button>
  </div>

  <div class="table-toolbar">
    <div class="search-input-wrap">
      <i class="fas fa-search"></i>
      <input type="text" placeholder="Search products…" oninput="filterTable('products-tbody', this.value, [0,1,2])" />
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <select class="btn btn-secondary btn-sm" onchange="filterProductsByCategory(this.value)" style="cursor:pointer">
        <option value="">All Categories</option>
        ${cats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('')}
      </select>
      <button class="btn btn-secondary btn-sm" onclick="toggleProductView('grid')" id="view-grid-btn"><i class="fas fa-th"></i></button>
      <button class="btn btn-secondary btn-sm" onclick="toggleProductView('list')" id="view-list-btn"><i class="fas fa-list"></i></button>
    </div>
  </div>

  <!-- Grid View -->
  <div id="products-grid" class="content-grid">
    ${prods.map(p => `
      <div class="product-card" data-category="${p.category}">
        <div class="product-card-img">${p.emoji}</div>
        <div class="product-card-body">
          <div class="product-card-name">${p.name}</div>
          <div class="product-card-cat">${p.category}</div>
          <div class="product-card-footer">
            <span class="product-price">₱${p.price.toFixed(2)}</span>
            <span class="badge ${p.stock <= 5 ? 'badge-danger' : p.stock <= 20 ? 'badge-warning' : 'badge-success'}">
              ${p.stock} ${p.unit}s
            </span>
          </div>
          <div style="display:flex;gap:6px;margin-top:10px">
            <button class="btn btn-primary btn-sm" style="flex:1" onclick="openEditProductModal('${p.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProduct('${p.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>

  <!-- List View (hidden by default) -->
  <div id="products-list" class="hidden">
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Supplier</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody id="products-tbody">
            ${prods.map(p => `
              <tr data-category="${p.category}">
                <td>${p.emoji} <strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>₱${p.price.toFixed(2)}</td>
                <td>
                  <div class="stock-bar-wrap">
                    <div class="stock-bar"><div class="stock-fill ${stockClass(p.stock)}" style="width:${Math.min(p.stock,100)}%"></div></div>
                    <span class="stock-qty">${p.stock}</span>
                  </div>
                </td>
                <td>${getSupplierName(p.supplier)}</td>
                <td><span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-gray'}">${capitalize(p.status)}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-primary btn-sm btn-icon" onclick="openEditProductModal('${p.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProduct('${p.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;
}

function toggleProductView(view) {
  document.getElementById('products-grid').classList.toggle('hidden', view === 'list');
  document.getElementById('products-list').classList.toggle('hidden', view === 'grid');
  document.getElementById('view-grid-btn').classList.toggle('btn-primary', view === 'grid');
  document.getElementById('view-list-btn').classList.toggle('btn-primary', view === 'list');
  document.getElementById('view-grid-btn').classList.toggle('btn-secondary', view !== 'grid');
  document.getElementById('view-list-btn').classList.toggle('btn-secondary', view !== 'list');
}

function filterProductsByCategory(cat) {
  document.querySelectorAll('[data-category]').forEach(el => {
    el.style.display = (!cat || el.dataset.category === cat) ? '' : 'none';
  });
}

function openAddProductModal() {
  const cats  = store.get('arbees_categories', []);
  const sups  = store.get('arbees_suppliers', []);
  openModal(`
    <h3><i class="fas fa-plus" style="color:var(--primary)"></i> Add New Product</h3>
    <p>Fill in the details for your new bakery product.</p>
    <div class="modal-form">
      <div class="form-group"><label>Product Name *</label><input type="text" id="m-name" placeholder="e.g. Ube Bread" /></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Price (₱) *</label><input type="number" id="m-price" placeholder="0.00" min="0" step="0.01" /></div>
        <div class="form-group"><label>Stock *</label><input type="number" id="m-stock" placeholder="0" min="0" /></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Unit</label>
          <select id="m-unit"><option>pc</option><option>loaf</option><option>whole</option><option>cup</option><option>box</option><option>kg</option></select>
        </div>
        <div class="form-group"><label>Emoji Icon</label><input type="text" id="m-emoji" placeholder="🍞" maxlength="2" /></div>
      </div>
      <div class="form-group"><label>Category</label>
        <select id="m-cat">
          ${cats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Supplier</label>
        <select id="m-sup">
          ${sups.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveNewProduct()"><i class="fas fa-save"></i> Save Product</button>
      </div>
    </div>
  `);
}

function saveNewProduct() {
  const name  = document.getElementById('m-name')?.value.trim();
  const price = parseFloat(document.getElementById('m-price')?.value);
  const stock = parseInt(document.getElementById('m-stock')?.value);
  const unit  = document.getElementById('m-unit')?.value;
  const emoji = document.getElementById('m-emoji')?.value || '🍰';
  const cat   = document.getElementById('m-cat')?.value;
  const sup   = document.getElementById('m-sup')?.value;

  if (!name || isNaN(price) || isNaN(stock)) {
    showToast('Please fill in all required fields.', 'error'); return;
  }

  const prods = store.get('arbees_products', []);
  prods.push({ id:'p'+Date.now(), name, price, stock, unit, emoji, category:cat, supplier:sup, status:'active' });
  store.set('arbees_products', prods);
  logActivity('success', `New product <strong>${name}</strong> added`);
  addNotification('ok', `Product <strong>${name}</strong> added`);
  closeModal();
  loadModule('products', document.querySelector('[data-module="products"]'));
  showToast(`Product "${name}" added successfully!`, 'success');
}

function openEditProductModal(id) {
  const prods = store.get('arbees_products', []);
  const p = prods.find(x => x.id === id);
  if (!p) return;
  const cats = store.get('arbees_categories', []);
  const sups = store.get('arbees_suppliers', []);
  openModal(`
    <h3><i class="fas fa-edit" style="color:var(--primary)"></i> Edit Product</h3>
    <p>Update the details for <strong>${p.name}</strong>.</p>
    <div class="modal-form">
      <div class="form-group"><label>Product Name</label><input type="text" id="m-name" value="${p.name}" /></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Price (₱)</label><input type="number" id="m-price" value="${p.price}" min="0" step="0.01" /></div>
        <div class="form-group"><label>Stock</label><input type="number" id="m-stock" value="${p.stock}" min="0" /></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Unit</label>
          <select id="m-unit">
            ${['pc','loaf','whole','cup','box','kg'].map(u => `<option ${u===p.unit?'selected':''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Emoji</label><input type="text" id="m-emoji" value="${p.emoji}" maxlength="2" /></div>
      </div>
      <div class="form-group"><label>Category</label>
        <select id="m-cat">
          ${cats.map(c => `<option value="${c.name}" ${c.name===p.category?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Supplier</label>
        <select id="m-sup">
          ${sups.map(s => `<option value="${s.id}" ${s.id===p.supplier?'selected':''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="m-status">
          <option value="active" ${p.status==='active'?'selected':''}>Active</option>
          <option value="inactive" ${p.status==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="updateProduct('${id}')"><i class="fas fa-save"></i> Update</button>
      </div>
    </div>
  `);
}

function updateProduct(id) {
  const prods = store.get('arbees_products', []);
  const idx   = prods.findIndex(p => p.id === id);
  if (idx === -1) return;
  prods[idx] = {
    ...prods[idx],
    name:     document.getElementById('m-name').value.trim(),
    price:    parseFloat(document.getElementById('m-price').value),
    stock:    parseInt(document.getElementById('m-stock').value),
    unit:     document.getElementById('m-unit').value,
    emoji:    document.getElementById('m-emoji').value || prods[idx].emoji,
    category: document.getElementById('m-cat').value,
    supplier: document.getElementById('m-sup').value,
    status:   document.getElementById('m-status').value,
  };
  store.set('arbees_products', prods);
  logActivity('info', `Product <strong>${prods[idx].name}</strong> updated`);
  closeModal();
  loadModule('products', document.querySelector('[data-module="products"]'));
  showToast('Product updated successfully!', 'success');
}

function deleteProduct(id) {
  const prods = store.get('arbees_products', []);
  const p = prods.find(x => x.id === id);
  showConfirm('Delete Product', `Are you sure you want to delete <strong>${p?.name}</strong>? This cannot be undone.`, () => {
    store.set('arbees_products', prods.filter(x => x.id !== id));
    logActivity('info', `Product <strong>${p?.name}</strong> deleted`);
    loadModule('products', document.querySelector('[data-module="products"]'));
    showToast('Product deleted.', 'warning');
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: INVENTORY
───────────────────────────────────────────────────────────────*/
function inventory() {
  const prods = store.get('arbees_products', []);
  const totalItems = prods.reduce((s, p) => s + p.stock, 0);
  const lowCount   = prods.filter(p => p.stock <= 5).length;
  const outCount   = prods.filter(p => p.stock === 0).length;

  return `
  <div class="page-header">
    <div class="page-title">
      <h2>Inventory</h2>
      <p>Track and manage stock levels</p>
    </div>
    <button class="btn btn-primary" onclick="openRestockModal()">
      <i class="fas fa-plus"></i> Restock
    </button>
  </div>

  <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat-card animate-in delay-1">
      <div class="stat-icon green"><i class="fas fa-cubes"></i></div>
      <div class="stat-info"><div class="stat-value">${totalItems}</div><div class="stat-label">Total Items in Stock</div></div>
    </div>
    <div class="stat-card animate-in delay-2">
      <div class="stat-icon ${lowCount > 0 ? 'red' : 'green'}"><i class="fas fa-exclamation-circle"></i></div>
      <div class="stat-info"><div class="stat-value">${lowCount}</div><div class="stat-label">Low Stock (≤5 units)</div></div>
    </div>
    <div class="stat-card animate-in delay-3">
      <div class="stat-icon red"><i class="fas fa-times-circle"></i></div>
      <div class="stat-info"><div class="stat-value">${outCount}</div><div class="stat-label">Out of Stock</div></div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title"><i class="fas fa-boxes"></i> Stock Levels</span>
      <div class="search-input-wrap" style="max-width:220px">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search…" oninput="filterTable('inv-tbody', this.value, [0,1])" />
      </div>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr><th>Product</th><th>Category</th><th>Stock Level</th><th>Unit</th><th>Price</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody id="inv-tbody">
          ${prods.map(p => `
            <tr>
              <td>${p.emoji} <strong>${p.name}</strong></td>
              <td>${p.category}</td>
              <td>
                <div class="stock-bar-wrap">
                  <div class="stock-bar" style="min-width:100px">
                    <div class="stock-fill ${stockClass(p.stock)}" style="width:${Math.min((p.stock/200)*100,100)}%"></div>
                  </div>
                  <span class="stock-qty">${p.stock}</span>
                </div>
              </td>
              <td>${p.unit}</td>
              <td>₱${p.price.toFixed(2)}</td>
              <td>
                <span class="badge ${p.stock === 0 ? 'badge-danger' : p.stock <= 5 ? 'badge-warning' : p.stock <= 20 ? 'badge-info' : 'badge-success'}">
                  ${p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? 'Critical' : p.stock <= 20 ? 'Low' : 'Good'}
                </span>
              </td>
              <td>
                <button class="btn btn-primary btn-sm" onclick="openAdjustModal('${p.id}')">
                  <i class="fas fa-sliders-h"></i> Adjust
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

function openAdjustModal(id) {
  const prods = store.get('arbees_products', []);
  const p = prods.find(x => x.id === id);
  if (!p) return;
  openModal(`
    <h3><i class="fas fa-sliders-h" style="color:var(--primary)"></i> Adjust Stock</h3>
    <p>Updating stock for <strong>${p.emoji} ${p.name}</strong> — Current: <strong>${p.stock} ${p.unit}s</strong></p>
    <div class="modal-form">
      <div class="form-group">
        <label>Adjustment Type</label>
        <select id="adj-type">
          <option value="add">➕ Add Stock</option>
          <option value="remove">➖ Remove Stock</option>
          <option value="set">🔁 Set Exact Quantity</option>
        </select>
      </div>
      <div class="form-group">
        <label>Quantity</label>
        <input type="number" id="adj-qty" placeholder="0" min="0" value="1" />
      </div>
      <div class="form-group">
        <label>Reason / Note</label>
        <textarea id="adj-note" placeholder="e.g. Delivery received, damaged goods, inventory count…"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="adjustStock('${id}')"><i class="fas fa-check"></i> Apply</button>
      </div>
    </div>
  `);
}

function adjustStock(id) {
  const type = document.getElementById('adj-type')?.value;
  const qty  = parseInt(document.getElementById('adj-qty')?.value);
  const note = document.getElementById('adj-note')?.value;
  if (isNaN(qty) || qty < 0) { showToast('Please enter a valid quantity.', 'error'); return; }

  const prods = store.get('arbees_products', []);
  const idx   = prods.findIndex(p => p.id === id);
  if (idx === -1) return;

  let newStock = prods[idx].stock;
  if (type === 'add')    newStock += qty;
  if (type === 'remove') newStock = Math.max(0, newStock - qty);
  if (type === 'set')    newStock = qty;

  prods[idx].stock = newStock;
  store.set('arbees_products', prods);
  logActivity('success', `Stock adjusted for <strong>${prods[idx].name}</strong> → ${newStock} ${prods[idx].unit}s${note ? ` (${note})` : ''}`);
  addNotification('ok', `Stock updated: <strong>${prods[idx].name}</strong> now at ${newStock} units`);
  closeModal();
  loadModule('inventory', document.querySelector('[data-module="inventory"]'));
  showToast(`Stock updated to ${newStock} ${prods[idx].unit}s`, 'success');
}

function openRestockModal() {
  const prods = store.get('arbees_products', []).filter(p => p.stock <= 20);
  openModal(`
    <h3><i class="fas fa-truck" style="color:var(--primary)"></i> Restock Items</h3>
    <p>Select a product to restock quickly.</p>
    <div class="modal-form">
      <div class="form-group"><label>Product</label>
        <select id="rs-prod">
          ${prods.map(p => `<option value="${p.id}">${p.emoji} ${p.name} (${p.stock} left)</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Quantity to Add</label>
        <input type="number" id="rs-qty" value="50" min="1" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="quickRestock()"><i class="fas fa-plus"></i> Restock</button>
      </div>
    </div>
  `);
}

function quickRestock() {
  const id  = document.getElementById('rs-prod')?.value;
  const qty = parseInt(document.getElementById('rs-qty')?.value);
  if (!id || isNaN(qty) || qty < 1) { showToast('Invalid input.', 'error'); return; }
  const prods = store.get('arbees_products', []);
  const idx   = prods.findIndex(p => p.id === id);
  if (idx === -1) return;
  prods[idx].stock += qty;
  store.set('arbees_products', prods);
  logActivity('success', `Restocked <strong>${prods[idx].name}</strong> +${qty} units`);
  closeModal();
  loadModule('inventory', document.querySelector('[data-module="inventory"]'));
  showToast(`Restocked ${prods[idx].name} by ${qty} units`, 'success');
}

/* ─────────────────────────────────────────────────────────────
   MODULE: CATEGORIES
───────────────────────────────────────────────────────────────*/
function categories() {
  const cats = store.get('arbees_categories', []);

  return `
  <div class="page-header">
    <div class="page-title">
      <h2>Categories</h2>
      <p>${cats.length} product categories</p>
    </div>
    <button class="btn btn-primary" onclick="openAddCategoryModal()">
      <i class="fas fa-plus"></i> Add Category
    </button>
  </div>

  <div class="content-grid">
    ${cats.map(c => `
      <div class="category-card">
        <span class="category-icon">${c.icon}</span>
        <div class="category-name">${c.name}</div>
        <div class="category-count">${c.count} products</div>
        <div style="display:flex;gap:6px;margin-top:12px;justify-content:center">
          <button class="btn btn-primary btn-sm" onclick="openEditCategoryModal('${c.id}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('')}
  </div>
  `;
}

function openAddCategoryModal() {
  openModal(`
    <h3><i class="fas fa-plus" style="color:var(--primary)"></i> Add Category</h3>
    <p>Create a new product category for your bakery.</p>
    <div class="modal-form">
      <div class="form-group"><label>Category Name *</label><input type="text" id="cat-name" placeholder="e.g. Donuts" /></div>
      <div class="form-group"><label>Icon (Emoji)</label><input type="text" id="cat-icon" placeholder="🍩" maxlength="2" /></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveNewCategory()"><i class="fas fa-save"></i> Save</button>
      </div>
    </div>
  `);
}

function saveNewCategory() {
  const name = document.getElementById('cat-name')?.value.trim();
  const icon = document.getElementById('cat-icon')?.value || '🏷️';
  if (!name) { showToast('Category name is required.', 'error'); return; }
  const cats = store.get('arbees_categories', []);
  cats.push({ id:'c'+Date.now(), name, icon, color:'#c8702a', count:0 });
  store.set('arbees_categories', cats);
  closeModal();
  loadModule('categories', document.querySelector('[data-module="categories"]'));
  showToast(`Category "${name}" added!`, 'success');
}

function openEditCategoryModal(id) {
  const cats = store.get('arbees_categories', []);
  const c = cats.find(x => x.id === id);
  if (!c) return;
  openModal(`
    <h3><i class="fas fa-edit" style="color:var(--primary)"></i> Edit Category</h3>
    <div class="modal-form">
      <div class="form-group"><label>Category Name</label><input type="text" id="cat-name" value="${c.name}" /></div>
      <div class="form-group"><label>Icon (Emoji)</label><input type="text" id="cat-icon" value="${c.icon}" maxlength="2" /></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="updateCategory('${id}')"><i class="fas fa-save"></i> Update</button>
      </div>
    </div>
  `);
}

function updateCategory(id) {
  const cats = store.get('arbees_categories', []);
  const idx  = cats.findIndex(c => c.id === id);
  if (idx === -1) return;
  cats[idx].name = document.getElementById('cat-name').value.trim() || cats[idx].name;
  cats[idx].icon = document.getElementById('cat-icon').value || cats[idx].icon;
  store.set('arbees_categories', cats);
  closeModal();
  loadModule('categories', document.querySelector('[data-module="categories"]'));
  showToast('Category updated!', 'success');
}

function deleteCategory(id) {
  const cats = store.get('arbees_categories', []);
  const c = cats.find(x => x.id === id);
  showConfirm('Delete Category', `Delete the <strong>${c?.name}</strong> category? Products in this category will be unaffected.`, () => {
    store.set('arbees_categories', cats.filter(x => x.id !== id));
    loadModule('categories', document.querySelector('[data-module="categories"]'));
    showToast('Category deleted.', 'warning');
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: SUPPLIERS
───────────────────────────────────────────────────────────────*/
function suppliers() {
  const sups = store.get('arbees_suppliers', []);

  return `
  <div class="page-header">
    <div class="page-title">
      <h2>Suppliers</h2>
      <p>${sups.length} suppliers registered</p>
    </div>
    <button class="btn btn-primary" onclick="openAddSupplierModal()">
      <i class="fas fa-plus"></i> Add Supplier
    </button>
  </div>

  <div class="table-toolbar">
    <div class="search-input-wrap">
      <i class="fas fa-search"></i>
      <input type="text" placeholder="Search suppliers…" oninput="filterSuppliers(this.value)" />
    </div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-secondary btn-sm" onclick="filterSuppliersByStatus('')">All</button>
      <button class="btn btn-success btn-sm" onclick="filterSuppliersByStatus('active')">Active</button>
      <button class="btn btn-secondary btn-sm" onclick="filterSuppliersByStatus('inactive')">Inactive</button>
    </div>
  </div>

  <div class="content-grid" id="suppliers-grid">
    ${sups.map(s => `
      <div class="supplier-card" data-status="${s.status}">
        <div class="supplier-header">
          <div class="supplier-icon"><i class="fas fa-truck"></i></div>
          <div>
            <div class="supplier-name">${s.name}</div>
            <div class="supplier-type">${s.type}</div>
          </div>
        </div>
        <div class="supplier-detail"><i class="fas fa-phone"></i>${s.contact}</div>
        <div class="supplier-detail"><i class="fas fa-envelope"></i>${s.email}</div>
        <div class="supplier-detail"><i class="fas fa-map-marker-alt"></i>${s.address}</div>
        <div class="supplier-footer">
          <span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-gray'}">${capitalize(s.status)}</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-primary btn-sm btn-icon" onclick="openEditSupplierModal('${s.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteSupplier('${s.id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
  `;
}

function filterSuppliers(val) {
  document.querySelectorAll('.supplier-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(val.toLowerCase()) ? '' : 'none';
  });
}

function filterSuppliersByStatus(status) {
  document.querySelectorAll('.supplier-card').forEach(card => {
    card.style.display = (!status || card.dataset.status === status) ? '' : 'none';
  });
}

function openAddSupplierModal() {
  openModal(`
    <h3><i class="fas fa-truck" style="color:var(--primary)"></i> Add Supplier</h3>
    <p>Register a new supplier for your bakery.</p>
    <div class="modal-form">
      <div class="form-group"><label>Company Name *</label><input type="text" id="s-name" placeholder="e.g. Fresh Mills Co." /></div>
      <div class="form-group"><label>Supply Type</label><input type="text" id="s-type" placeholder="e.g. Flour & Grains" /></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Contact No.</label><input type="text" id="s-contact" placeholder="09XX-XXX-XXXX" /></div>
        <div class="form-group"><label>Email</label><input type="email" id="s-email" placeholder="supplier@email.com" /></div>
      </div>
      <div class="form-group"><label>Address</label><input type="text" id="s-address" placeholder="City, Province" /></div>
      <div class="form-group"><label>Status</label>
        <select id="s-status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveNewSupplier()"><i class="fas fa-save"></i> Save Supplier</button>
      </div>
    </div>
  `);
}

function saveNewSupplier() {
  const name = document.getElementById('s-name')?.value.trim();
  if (!name) { showToast('Company name is required.', 'error'); return; }
  const sups = store.get('arbees_suppliers', []);
  sups.push({
    id:      's'+Date.now(),
    name,
    type:    document.getElementById('s-type')?.value || 'General',
    contact: document.getElementById('s-contact')?.value || '—',
    email:   document.getElementById('s-email')?.value || '—',
    address: document.getElementById('s-address')?.value || '—',
    status:  document.getElementById('s-status')?.value || 'active',
    products: 0,
  });
  store.set('arbees_suppliers', sups);
  logActivity('info', `New supplier <strong>${name}</strong> added`);
  closeModal();
  loadModule('suppliers', document.querySelector('[data-module="suppliers"]'));
  showToast(`Supplier "${name}" added!`, 'success');
}

function openEditSupplierModal(id) {
  const sups = store.get('arbees_suppliers', []);
  const s = sups.find(x => x.id === id);
  if (!s) return;
  openModal(`
    <h3><i class="fas fa-edit" style="color:var(--primary)"></i> Edit Supplier</h3>
    <div class="modal-form">
      <div class="form-group"><label>Company Name</label><input type="text" id="s-name" value="${s.name}" /></div>
      <div class="form-group"><label>Supply Type</label><input type="text" id="s-type" value="${s.type}" /></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Contact No.</label><input type="text" id="s-contact" value="${s.contact}" /></div>
        <div class="form-group"><label>Email</label><input type="email" id="s-email" value="${s.email}" /></div>
      </div>
      <div class="form-group"><label>Address</label><input type="text" id="s-address" value="${s.address}" /></div>
      <div class="form-group"><label>Status</label>
        <select id="s-status">
          <option value="active" ${s.status==='active'?'selected':''}>Active</option>
          <option value="inactive" ${s.status==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="updateSupplier('${id}')"><i class="fas fa-save"></i> Update</button>
      </div>
    </div>
  `);
}

function updateSupplier(id) {
  const sups = store.get('arbees_suppliers', []);
  const idx  = sups.findIndex(s => s.id === id);
  if (idx === -1) return;
  sups[idx] = {
    ...sups[idx],
    name:    document.getElementById('s-name').value.trim(),
    type:    document.getElementById('s-type').value,
    contact: document.getElementById('s-contact').value,
    email:   document.getElementById('s-email').value,
    address: document.getElementById('s-address').value,
    status:  document.getElementById('s-status').value,
  };
  store.set('arbees_suppliers', sups);
  closeModal();
  loadModule('suppliers', document.querySelector('[data-module="suppliers"]'));
  showToast('Supplier updated!', 'success');
}

function deleteSupplier(id) {
  const sups = store.get('arbees_suppliers', []);
  const s = sups.find(x => x.id === id);
  showConfirm('Delete Supplier', `Delete <strong>${s?.name}</strong>? This cannot be undone.`, () => {
    store.set('arbees_suppliers', sups.filter(x => x.id !== id));
    loadModule('suppliers', document.querySelector('[data-module="suppliers"]'));
    showToast('Supplier deleted.', 'warning');
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: PROFILE
───────────────────────────────────────────────────────────────*/
function profile() {
  const u = APP.currentUser;
  const session = store.get('arbees_session');
  const loginTime = session ? new Date(session.loginAt).toLocaleString() : 'N/A';

  return `
  <div class="page-header">
    <div class="page-title"><h2>My Profile</h2><p>Manage your personal information</p></div>
  </div>

  <div class="profile-hero animate-in">
    <div class="profile-avatar-lg" title="Click to change avatar">${u.firstName.charAt(0)}</div>
    <div class="profile-hero-info">
      <h2>${u.firstName} ${u.lastName}</h2>
      <p>${u.email}</p>
      <div class="profile-meta">
        <span class="profile-meta-item"><i class="fas fa-briefcase"></i> ${capitalize(u.role)}</span>
        <span class="profile-meta-item"><i class="fas fa-at"></i> @${u.username}</span>
        <span class="profile-meta-item"><i class="fas fa-calendar"></i> Joined ${new Date(u.createdAt).toLocaleDateString()}</span>
        <span class="profile-meta-item"><i class="fas fa-sign-in-alt"></i> Last login: ${loginTime}</span>
      </div>
    </div>
  </div>

  <div class="profile-grid">
    <div class="card animate-in delay-1">
      <div class="card-header"><span class="card-title"><i class="fas fa-user"></i> Personal Info</span>
        <button class="btn btn-primary btn-sm" onclick="openEditProfileModal()"><i class="fas fa-edit"></i> Edit</button>
      </div>
      <div class="card-body">
        ${profileRow('First Name',  u.firstName)}
        ${profileRow('Last Name',   u.lastName)}
        ${profileRow('Username',    '@'+u.username)}
        ${profileRow('Email',       u.email)}
        ${profileRow('Role',        capitalize(u.role))}
      </div>
    </div>

    <div class="card animate-in delay-2">
      <div class="card-header"><span class="card-title"><i class="fas fa-shield-alt"></i> Security</span></div>
      <div class="card-body">
        ${profileRow('Password', '••••••••')}
        ${profileRow('2-Step Verification', '<span class="badge badge-warning">Not Enabled</span>')}
        ${profileRow('Session Timeout', '60 minutes')}
        <div style="margin-top:14px">
          <button class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:8px" onclick="openChangePasswordModal()">
            <i class="fas fa-key"></i> Change Password
          </button>
        </div>
      </div>
    </div>

    <div class="card animate-in delay-3">
      <div class="card-header"><span class="card-title"><i class="fas fa-chart-pie"></i> My Activity</span></div>
      <div class="card-body">
        ${profileRow('Products Added', store.get('arbees_products', []).length + ' products')}
        ${profileRow('Suppliers Managed', store.get('arbees_suppliers', []).length + ' suppliers')}
        ${profileRow('Categories', store.get('arbees_categories', []).length + ' categories')}
      </div>
    </div>

    <div class="card animate-in delay-4">
      <div class="card-header"><span class="card-title"><i class="fas fa-cog"></i> Quick Actions</span></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-secondary" style="justify-content:flex-start" onclick="loadModule('settings', document.querySelector('[data-module=settings]'))">
          <i class="fas fa-cog"></i> Go to Settings
        </button>
        <button class="btn btn-secondary" style="justify-content:flex-start" onclick="openEditProfileModal()">
          <i class="fas fa-edit"></i> Edit Profile
        </button>
        <button class="btn btn-danger" style="justify-content:flex-start" onclick="confirmLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  </div>
  `;
}

function profileRow(label, value) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100);font-size:.85rem">
    <span style="color:var(--gray-400);font-weight:500">${label}</span>
    <span style="color:var(--gray-700);font-weight:600">${value}</span>
  </div>`;
}

function openEditProfileModal() {
  const u = APP.currentUser;
  openModal(`
    <h3><i class="fas fa-edit" style="color:var(--primary)"></i> Edit Profile</h3>
    <div class="modal-form">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>First Name</label><input type="text" id="p-first" value="${u.firstName}" /></div>
        <div class="form-group"><label>Last Name</label><input type="text" id="p-last" value="${u.lastName}" /></div>
      </div>
      <div class="form-group"><label>Email</label><input type="email" id="p-email" value="${u.email}" /></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveProfileUpdate()"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    </div>
  `);
}

function saveProfileUpdate() {
  const firstName = document.getElementById('p-first')?.value.trim();
  const lastName  = document.getElementById('p-last')?.value.trim();
  const email     = document.getElementById('p-email')?.value.trim();
  if (!firstName || !lastName || !email) { showToast('All fields are required.', 'error'); return; }

  const users = store.get('arbees_users', []);
  const idx   = users.findIndex(u => u.id === APP.currentUser.id);
  if (idx === -1) return;
  users[idx] = { ...users[idx], firstName, lastName, email };
  store.set('arbees_users', users);
  APP.currentUser = { ...APP.currentUser, firstName, lastName, email };

  // Update sidebar
  document.getElementById('sidebar-name').textContent = `${firstName} ${lastName}`;
  const initial = firstName.charAt(0).toUpperCase();
  document.getElementById('sidebar-avatar').textContent     = initial;
  document.getElementById('topbar-avatar-letter').textContent = initial;

  closeModal();
  loadModule('profile', document.querySelector('[data-module="profile"]'));
  showToast('Profile updated successfully!', 'success');
}

function openChangePasswordModal() {
  openModal(`
    <h3><i class="fas fa-key" style="color:var(--primary)"></i> Change Password</h3>
    <div class="modal-form">
      <div class="form-group"><label>Current Password</label>
        <div class="password-wrapper">
          <input type="password" id="cp-old" placeholder="Enter current password" />
          <button type="button" class="toggle-pw" onclick="togglePassword('cp-old',this)"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <div class="form-group"><label>New Password</label>
        <div class="password-wrapper">
          <input type="password" id="cp-new" placeholder="Minimum 8 characters" oninput="checkPasswordStrength(this.value)" />
          <button type="button" class="toggle-pw" onclick="togglePassword('cp-new',this)"><i class="fas fa-eye"></i></button>
        </div>
        <div class="password-strength" id="pw-strength">
          <div class="strength-bar"><span id="strength-fill"></span></div>
          <span id="strength-label"></span>
        </div>
      </div>
      <div class="form-group"><label>Confirm New Password</label>
        <div class="password-wrapper">
          <input type="password" id="cp-confirm" placeholder="Re-enter new password" />
          <button type="button" class="toggle-pw" onclick="togglePassword('cp-confirm',this)"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="changePassword()"><i class="fas fa-lock"></i> Change Password</button>
      </div>
    </div>
  `);
}

function changePassword() {
  const oldPw  = document.getElementById('cp-old')?.value;
  const newPw  = document.getElementById('cp-new')?.value;
  const confPw = document.getElementById('cp-confirm')?.value;

  const users = store.get('arbees_users', []);
  const user  = users.find(u => u.id === APP.currentUser.id);

  if (!user || atob(user.password) !== oldPw) {
    showToast('Current password is incorrect.', 'error'); return;
  }
  if (newPw.length < 8) {
    showToast('New password must be at least 8 characters.', 'error'); return;
  }
  if (newPw !== confPw) {
    showToast('New passwords do not match.', 'error'); return;
  }

  const idx = users.findIndex(u => u.id === APP.currentUser.id);
  users[idx].password = btoa(newPw);
  store.set('arbees_users', users);
  logActivity('info', `<strong>${APP.currentUser.firstName}</strong> changed their password`);
  closeModal();
  showToast('Password changed successfully!', 'success');
}

/* ─────────────────────────────────────────────────────────────
   MODULE: SETTINGS
───────────────────────────────────────────────────────────────*/
function settings() {
  return `
  <div class="page-header">
    <div class="page-title"><h2>Settings</h2><p>Customize your experience</p></div>
  </div>

  <div class="card animate-in">
    <div class="card-body" style="padding:0">
      <div class="settings-grid">

        <!-- Settings Nav -->
        <div style="padding:16px;border-right:1px solid var(--gray-100)">
          <div class="settings-nav">
            <button class="settings-nav-item active" onclick="switchSettings('appearance', this)">
              <i class="fas fa-palette"></i> Appearance
            </button>
            <button class="settings-nav-item" onclick="switchSettings('notifications', this)">
              <i class="fas fa-bell"></i> Notifications
            </button>
            <button class="settings-nav-item" onclick="switchSettings('security', this)">
              <i class="fas fa-shield-alt"></i> Security
            </button>
            <button class="settings-nav-item" onclick="switchSettings('system', this)">
              <i class="fas fa-server"></i> System
            </button>
            <button class="settings-nav-item" onclick="switchSettings('about', this)">
              <i class="fas fa-info-circle"></i> About
            </button>
          </div>
        </div>

        <!-- Settings Panels -->
        <div style="padding:20px">

          <!-- Appearance -->
          <div class="settings-panel active" id="settings-appearance">
            <div class="settings-section-title">Appearance</div>

            <div class="setting-row">
              <div class="setting-info">
                <h4>Dark Mode</h4>
                <p>Switch between light and dark theme</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="dark-mode-toggle" ${APP.theme === 'dark' ? 'checked' : ''} onchange="toggleDarkMode(this.checked)" />
                <div class="toggle-track"></div>
                <div class="toggle-thumb"></div>
              </label>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <h4>Sidebar Collapsed</h4>
                <p>Start with a compact sidebar by default</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" ${APP.sidebarCollapsed ? 'checked' : ''} onchange="toggleSidebarDefault(this.checked)" />
                <div class="toggle-track"></div>
                <div class="toggle-thumb"></div>
              </label>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <h4>Accent Color</h4>
                <p>Change the primary brand color</p>
              </div>
              <div class="color-swatches">
                <div class="color-swatch selected" style="background:#c8702a" onclick="setAccentColor('#c8702a','#9e5520')" title="Original Bakery"></div>
                <div class="color-swatch" style="background:#8b5cf6" onclick="setAccentColor('#8b5cf6','#6d28d9')" title="Purple"></div>
                <div class="color-swatch" style="background:#22c55e" onclick="setAccentColor('#22c55e','#16a34a')" title="Green"></div>
                <div class="color-swatch" style="background:#ef4444" onclick="setAccentColor('#ef4444','#dc2626')" title="Red"></div>
                <div class="color-swatch" style="background:#3b82f6" onclick="setAccentColor('#3b82f6','#2563eb')" title="Blue"></div>
                <div class="color-swatch" style="background:#f59e0b" onclick="setAccentColor('#f59e0b','#d97706')" title="Amber"></div>
              </div>
            </div>
          </div>

          <!-- Notifications -->
          <div class="settings-panel" id="settings-notifications">
            <div class="settings-section-title">Notification Preferences</div>
            ${settingToggle('Low stock alerts', 'Get notified when products run low', 'notif-lowstock', true)}
            ${settingToggle('New supplier alerts', 'Notify on new supplier additions', 'notif-supplier', true)}
            ${settingToggle('Session expiry warnings', 'Warn before session expires', 'notif-session', true)}
            ${settingToggle('Activity log notifications', 'Show in-app activity events', 'notif-activity', false)}
          </div>

          <!-- Security -->
          <div class="settings-panel" id="settings-security">
            <div class="settings-section-title">Security Settings</div>
            <div class="setting-row">
              <div class="setting-info">
                <h4>Max Login Attempts</h4>
                <p>Current: ${SEC.MAX_ATTEMPTS} attempts before lockout</p>
              </div>
              <span class="badge badge-primary">${SEC.MAX_ATTEMPTS} attempts</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <h4>Lockout Duration</h4>
                <p>How long the account is locked after failed attempts</p>
              </div>
              <span class="badge badge-warning">5 minutes</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <h4>Session Timeout</h4>
                <p>Auto-logout after inactivity</p>
              </div>
              <span class="badge badge-info">60 minutes</span>
            </div>
            ${settingToggle('Remember me feature', 'Allow saving login username', 'sec-remember', true)}
            <div style="margin-top:16px">
              <button class="btn btn-danger btn-sm" onclick="clearAllSessions()">
                <i class="fas fa-sign-out-alt"></i> Clear All Sessions
              </button>
            </div>
          </div>

          <!-- System -->
          <div class="settings-panel" id="settings-system">
            <div class="settings-section-title">System Data</div>
            <div class="setting-row">
              <div class="setting-info">
                <h4>Registered Users</h4>
                <p>Total accounts in the system</p>
              </div>
              <span class="badge badge-primary">${store.get('arbees_users', []).length} users</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <h4>Total Products</h4>
                <p>Products in inventory</p>
              </div>
              <span class="badge badge-success">${store.get('arbees_products', []).length} products</span>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <h4>Storage Used</h4>
                <p>Approximate localStorage usage</p>
              </div>
              <span class="badge badge-info">${getStorageSize()} KB</span>
            </div>
            <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" onclick="exportData()">
                <i class="fas fa-download"></i> Export Data
              </button>
              <button class="btn btn-danger btn-sm" onclick="confirmClearData()">
                <i class="fas fa-trash"></i> Clear App Data
              </button>
            </div>
          </div>

          <!-- About -->
          <div class="settings-panel" id="settings-about">
            <div class="settings-section-title">About This System</div>
            <div style="text-align:center;padding:20px">
              <div style="font-size:3rem;margin-bottom:12px">🍞</div>
              <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--gray-800)">Arbee's Bakery IMS</h3>
              <p style="color:var(--gray-400);font-size:.83rem;margin:4px 0">Inventory Management System</p>
              <div style="margin:16px 0">
                <span class="badge badge-primary" style="font-size:.8rem;padding:6px 14px">v1.0.0</span>
              </div>
              <p style="color:var(--gray-500);font-size:.82rem;line-height:1.7">
                A complete inventory management solution built for Arbee's Bakery Shop.<br/>
                Manage products, track stock, handle suppliers, and more.
              </p>
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--gray-100);color:var(--gray-400);font-size:.78rem">
                Built with ❤️ — HTML, CSS &amp; JavaScript
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
  `;
}

function settingToggle(title, desc, id, checked) {
  return `
  <div class="setting-row">
    <div class="setting-info"><h4>${title}</h4><p>${desc}</p></div>
    <label class="toggle-switch">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} />
      <div class="toggle-track"></div>
      <div class="toggle-thumb"></div>
    </label>
  </div>`;
}

function initSettings() { /* placeholder for future setting loaders */ }

function switchSettings(panel, btn) {
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`settings-${panel}`)?.classList.add('active');
  btn.classList.add('active');
}

function toggleDarkMode(on) {
  APP.theme = on ? 'dark' : 'light';
  applyTheme(APP.theme);
  localStorage.setItem('arbees_theme', APP.theme);
  showToast(`${on ? 'Dark' : 'Light'} mode activated`, 'info');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleSidebarDefault(on) {
  if (on !== APP.sidebarCollapsed) toggleSidebar();
}

function setAccentColor(primary, dark) {
  document.documentElement.style.setProperty('--primary', primary);
  document.documentElement.style.setProperty('--primary-dark', dark);
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('selected', s.style.background === primary || s.style.backgroundColor === primary);
  });
  showToast('Accent color updated!', 'success');
}

function clearAllSessions() {
  showConfirm('Clear Sessions', 'This will log you out immediately and clear all session data.', () => {
    store.del('arbees_session');
    showToast('All sessions cleared. Logging out…', 'warning');
    setTimeout(logout, 1000);
  });
}

function exportData() {
  const data = {
    products:   store.get('arbees_products', []),
    categories: store.get('arbees_categories', []),
    suppliers:  store.get('arbees_suppliers', []),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'arbees_bakery_data.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported as JSON!', 'success');
}

function getStorageSize() {
  let total = 0;
  for (const key in localStorage) {
    if (key.startsWith('arbees_')) total += localStorage[key].length;
  }
  return (total / 1024).toFixed(1);
}

function confirmClearData() {
  showConfirm('Clear All App Data', 'This will delete all products, suppliers, categories, and users EXCEPT the admin account. This cannot be undone!', () => {
    const adminUsers = store.get('arbees_users', []).filter(u => u.role === 'admin');
    store.del('arbees_products');
    store.del('arbees_categories');
    store.del('arbees_suppliers');
    store.del('arbees_activity');
    store.set('arbees_users', adminUsers);
    seedData(); // re-seed defaults
    showToast('App data cleared and reset to defaults.', 'warning');
    loadModule('dashboard', document.querySelector('[data-module="dashboard"]'));
  });
}

/* ─────────────────────────────────────────────────────────────
   GLOBAL SEARCH
───────────────────────────────────────────────────────────────*/
function globalSearch(val) {
  if (!val.trim()) return;
  const v = val.toLowerCase();
  const prods = store.get('arbees_products', []).filter(p => p.name.toLowerCase().includes(v) || p.category.toLowerCase().includes(v));
  const sups  = store.get('arbees_suppliers', []).filter(s => s.name.toLowerCase().includes(v));
  const cats  = store.get('arbees_categories', []).filter(c => c.name.toLowerCase().includes(v));

  if (prods.length && APP.currentModule !== 'products') {
    loadModule('products', document.querySelector('[data-module="products"]'));
  } else if (sups.length && APP.currentModule !== 'suppliers') {
    loadModule('suppliers', document.querySelector('[data-module="suppliers"]'));
  }
}

/* ─────────────────────────────────────────────────────────────
   TABLE FILTER
───────────────────────────────────────────────────────────────*/
function filterTable(tbodyId, val, cols) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const v = val.toLowerCase();
  tbody.querySelectorAll('tr').forEach(row => {
    const text = cols.map(i => row.cells[i]?.textContent || '').join(' ').toLowerCase();
    row.style.display = text.includes(v) ? '' : 'none';
  });
}

/* ─────────────────────────────────────────────────────────────
   MODAL SYSTEM
───────────────────────────────────────────────────────────────*/
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function showConfirm(title, message, onConfirm) {
  document.getElementById('confirm-title').innerHTML   = title;
  document.getElementById('confirm-message').innerHTML = message;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  const btn = document.getElementById('confirm-ok-btn');
  btn.onclick = () => { closeConfirm(); onConfirm(); };
  document.body.style.overflow = 'hidden';
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────────────────────────*/
const TOAST_ICONS = { success:'check-circle', error:'times-circle', warning:'exclamation-triangle', info:'info-circle' };

function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${TOAST_ICONS[type] || 'info-circle'} toast-icon"></i>
    <span>${msg}</span>
    <button class="toast-dismiss" onclick="dismissToast(this.parentElement)"><i class="fas fa-times"></i></button>
  `;
  container.appendChild(toast);
  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  if (!toast || toast._dismissing) return;
  toast._dismissing = true;
  toast.classList.add('toast-out');
  setTimeout(() => toast.remove(), 300);
}

/* ─────────────────────────────────────────────────────────────
   ACTIVITY LOG
───────────────────────────────────────────────────────────────*/
function logActivity(type, text) {
  const activity = store.get('arbees_activity', []);
  activity.unshift({ type, text, time: Date.now() });
  if (activity.length > 50) activity.splice(50);
  store.set('arbees_activity', activity);
}

/* ─────────────────────────────────────────────────────────────
   UTILITY FUNCTIONS
───────────────────────────────────────────────────────────────*/
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toLocaleString();
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60000)   return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
  if (diff < 86400000)return Math.floor(diff / 3600000) + ' hr ago';
  return Math.floor(diff / 86400000) + ' day(s) ago';
}

function stockClass(n) {
  if (n <= 5)  return 'low';
  if (n <= 20) return 'medium';
  return 'high';
}

function getSupplierName(id) {
  const sups = store.get('arbees_suppliers', []);
  return sups.find(s => s.id === id)?.name || '—';
}

/* ─────────────────────────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────────────────────────────*/
document.addEventListener('keydown', e => {
  // ESC closes modals
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
    document.getElementById('notif-panel')?.classList.add('hidden');
  }
  // Ctrl+/ focuses search
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    document.getElementById('global-search')?.focus();
  }
});

/* ─────────────────────────────────────────────────────────────
   OTP SYSTEM
───────────────────────────────────────────────────────────────*/

/**
 * Generates a cryptographically random 6-digit OTP
 */
function generateOTP() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

/**
 * Called right after credentials are verified.
 * Generates OTP, sends it via EmailJS, then shows OTP screen.
 */
function initiateOTP(user) {
  const otp       = generateOTP();
  const expiresAt = Date.now() + SEC.OTP_EXPIRY_MS;

  // Store OTP state (session-scoped, not persisted)
  APP._otp = {
    code:       otp,
    expiresAt,
    attempts:   0,
    lastSent:   Date.now(),
    userId:     user.id,
  };

  // Show OTP screen immediately (sending indicator)
  showOTPScreen(user.email, user.firstName);

  // Send OTP via EmailJS
  sendOTPEmail(user.email, user.firstName, otp)
    .then(() => {
      showToast(`OTP sent to ${maskEmail(user.email)} 📧`, 'success');
    })
    .catch((err) => {
      console.error('EmailJS error:', err);
      // Still show OTP screen with fallback visible code for demo
      const alertEl = document.getElementById('otp-alert');
      if (alertEl) {
        alertEl.className = 'alert-box warning';
        alertEl.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          EmailJS not configured yet. For demo, your OTP is:
          <strong style="font-size:1.1rem;letter-spacing:3px;margin-left:6px">${otp}</strong>
        `;
        alertEl.classList.remove('hidden');
      }
      showToast('EmailJS not set up — OTP shown on screen for demo.', 'warning', 6000);
    });
}

/**
 * Sends the OTP email using EmailJS.
 * Template variables: {{to_name}}, {{to_email}}, {{otp_code}}, {{expiry_mins}}
 */
function sendOTPEmail(toEmail, toName, otpCode) {
  // Check if EmailJS is configured
  if (
    EMAILJS_CFG.publicKey  === 'YOUR_EMAILJS_PUBLIC_KEY' ||
    EMAILJS_CFG.serviceId  === 'YOUR_SERVICE_ID'         ||
    EMAILJS_CFG.templateId === 'YOUR_TEMPLATE_ID'
  ) {
    return Promise.reject('EmailJS not configured');
  }

  emailjs.init(EMAILJS_CFG.publicKey);

  return emailjs.send(EMAILJS_CFG.serviceId, EMAILJS_CFG.templateId, {
    to_name:    toName,
    to_email:   toEmail,
    otp_code:   otpCode,
    expiry_mins: Math.round(SEC.OTP_EXPIRY_MS / 60000),
    shop_name:  "Arbee's Bakery Shop",
    sent_time:  new Date().toLocaleTimeString(),
  });
}

/**
 * Shows the OTP verification screen
 */
function showOTPScreen(email, firstName) {
  // Hide auth screen
  document.getElementById('auth-screen').classList.add('hidden');

  // Update masked email label
  const sentTo = document.getElementById('otp-sent-to');
  if (sentTo) {
    sentTo.innerHTML = `We sent a 6-digit code to <strong>${maskEmail(email)}</strong>`;
  }

  // Show OTP screen
  const otpScreen = document.getElementById('otp-screen');
  otpScreen.classList.remove('hidden');

  // Clear all boxes
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach(b => {
    b.value = '';
    b.classList.remove('filled', 'otp-error', 'otp-success');
  });

  // Clear alert
  const alertEl = document.getElementById('otp-alert');
  if (alertEl) alertEl.classList.add('hidden');

  // Focus first box
  setTimeout(() => boxes[0]?.focus(), 300);

  // Start countdown
  startOTPCountdown();

  // Setup box interactivity
  setupOTPBoxes();
}

/**
 * Wire up auto-advance, backspace, paste for OTP boxes
 */
function setupOTPBoxes() {
  const boxes = Array.from(document.querySelectorAll('.otp-box'));

  boxes.forEach((box, idx) => {
    // Remove previous listeners by cloning
    const fresh = box.cloneNode(true);
    box.parentNode.replaceChild(fresh, box);
    boxes[idx] = fresh;
  });

  // Re-query after clone
  const freshBoxes = Array.from(document.querySelectorAll('.otp-box'));

  freshBoxes.forEach((box, idx) => {
    // Input: only digits, auto-advance
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      box.value = val.slice(-1); // keep only last digit typed

      if (val) {
        box.classList.add('filled');
        box.classList.remove('otp-error');
        // Advance to next
        const next = freshBoxes[idx + 1];
        if (next) next.focus();
        else document.getElementById('otp-verify-btn')?.focus();
      } else {
        box.classList.remove('filled');
      }
    });

    // Keydown: backspace moves back
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value) {
        const prev = freshBoxes[idx - 1];
        if (prev) { prev.focus(); prev.value = ''; prev.classList.remove('filled'); }
      }
      // Enter triggers verify
      if (e.key === 'Enter') verifyOTP();
    });

    // Paste: distribute digits across boxes
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text').replace(/\D/g, '').slice(0, 6);
      if (!pasted) return;
      freshBoxes.forEach((b, i) => {
        if (pasted[i]) {
          b.value = pasted[i];
          b.classList.add('filled');
        }
      });
      // Focus last filled or verify btn
      const lastIdx = Math.min(pasted.length - 1, freshBoxes.length - 1);
      if (pasted.length >= 6) document.getElementById('otp-verify-btn')?.focus();
      else freshBoxes[lastIdx + 1]?.focus();
    });

    // Select all on focus
    box.addEventListener('focus', () => box.select());
  });
}

/**
 * Reads the 6 boxes and returns the combined OTP string
 */
function getEnteredOTP() {
  return Array.from(document.querySelectorAll('.otp-box'))
    .map(b => b.value.trim())
    .join('');
}

/**
 * Verifies the entered OTP against the stored code
 */
function verifyOTP() {
  const entered = getEnteredOTP();
  const btn     = document.getElementById('otp-verify-btn');

  if (entered.length < 6) {
    shakeOTPBoxes();
    showOTPAlert('error', 'Please enter all 6 digits of your OTP.');
    return;
  }

  if (!APP._otp) {
    showOTPAlert('error', 'OTP session expired. Please log in again.');
    return;
  }

  // Check expiry
  if (Date.now() > APP._otp.expiresAt) {
    showOTPAlert('error', 'OTP has expired. Please request a new code.');
    markOTPBoxes('otp-error');
    shakeOTPBoxes();
    stopOTPCountdown();
    return;
  }

  // Max OTP attempts (3)
  APP._otp.attempts = (APP._otp.attempts || 0) + 1;
  if (APP._otp.attempts > 3) {
    showOTPAlert('error', 'Too many incorrect attempts. Please log in again.');
    markOTPBoxes('otp-error');
    shakeOTPBoxes();
    setTimeout(backToLogin, 2000);
    return;
  }

  setButtonLoading(btn, true);

  setTimeout(() => {
    if (entered === APP._otp.code) {
      // ✅ OTP CORRECT — Complete login
      otpVerified();
    } else {
      // ❌ Wrong OTP
      setButtonLoading(btn, false);
      markOTPBoxes('otp-error');
      shakeOTPBoxes();
      const left = 3 - APP._otp.attempts;
      showOTPAlert('error',
        `Incorrect OTP. ${left > 0 ? `${left} attempt${left !== 1 ? 's' : ''} remaining.` : 'No attempts left.'}`
      );
    }
  }, 500);
}

/**
 * Called when OTP is correctly entered — finalizes the session
 */
function otpVerified() {
  const user = APP.pendingUser;
  if (!user) { backToLogin(); return; }

  // Mark all boxes success
  markOTPBoxes('otp-success');
  stopOTPCountdown();

  // Clear OTP state
  APP._otp = null;

  // Set session
  APP.currentUser = { ...user };

  if (APP.rememberMe) {
    store.set('arbees_remember', user.username);
  } else {
    store.del('arbees_remember');
  }

  store.set('arbees_session', {
    userId:    user.id,
    loginAt:   Date.now(),
    expiresAt: Date.now() + SEC.SESSION_MS,
  });

  logActivity('info', `<strong>${user.firstName}</strong> logged in with OTP verification`);

  // Show success overlay animation then launch app
  showOTPSuccessOverlay(user.firstName, () => {
    document.getElementById('otp-screen').classList.add('hidden');
    APP.pendingUser = null;
    launchApp();
  });
}

/**
 * Resend OTP — respects cooldown
 */
function resendOTP() {
  if (!APP.pendingUser) { backToLogin(); return; }

  const elapsed = Date.now() - (APP._otp?.lastSent || 0);
  if (elapsed < SEC.OTP_RESEND_MS) {
    const secs = Math.ceil((SEC.OTP_RESEND_MS - elapsed) / 1000);
    showToast(`Please wait ${secs}s before resending.`, 'warning');
    return;
  }

  const user = APP.pendingUser;
  const users = store.get('arbees_users', []);
  const fullUser = users.find(u => u.id === user.id);
  if (!fullUser) { backToLogin(); return; }

  initiateOTP(fullUser);
}

/**
 * Animated success overlay before launching dashboard
 */
function showOTPSuccessOverlay(name, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'otp-success-overlay';
  overlay.innerHTML = `
    <div class="otp-success-badge"><i class="fas fa-check"></i></div>
    <p>Identity Verified! 🎉</p>
    <small>Welcome back, ${name}. Loading your dashboard…</small>
  `;
  document.body.appendChild(overlay);

  showToast(`Welcome back, ${name}! 🍞`, 'success');

  setTimeout(() => {
    overlay.remove();
    callback();
  }, 2000);
}

/**
 * OTP countdown timer — 5 minutes
 */
function startOTPCountdown() {
  stopOTPCountdown();

  const endTime     = APP._otp?.expiresAt || (Date.now() + SEC.OTP_EXPIRY_MS);
  const resendBtn   = document.getElementById('otp-resend-btn');
  const resendReady = Date.now() + SEC.OTP_RESEND_MS;

  APP.otpCountdownTimer = setInterval(() => {
    const remaining = endTime - Date.now();
    const countEl   = document.getElementById('otp-countdown');

    if (!countEl) { stopOTPCountdown(); return; }

    if (remaining <= 0) {
      stopOTPCountdown();
      countEl.textContent = '00:00';
      countEl.classList.add('urgent');
      showOTPAlert('warning', 'OTP has expired. Please click Resend to get a new code.');
      if (resendBtn) resendBtn.disabled = false;
      return;
    }

    const mins = String(Math.floor(remaining / 60000)).padStart(2, '0');
    const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
    countEl.textContent = `${mins}:${secs}`;

    // Urgent styling under 60s
    if (remaining < 60000) countEl.classList.add('urgent');
    else countEl.classList.remove('urgent');

    // Enable resend after cooldown
    if (resendBtn) {
      resendBtn.disabled = Date.now() < resendReady;
    }

  }, 500);
}

function stopOTPCountdown() {
  if (APP.otpCountdownTimer) {
    clearInterval(APP.otpCountdownTimer);
    APP.otpCountdownTimer = null;
  }
}

/**
 * Go back to the login screen and clean up OTP state
 */
function backToLogin() {
  stopOTPCountdown();
  APP._otp       = null;
  APP.pendingUser = null;

  document.getElementById('otp-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');

  // Clear login password for re-entry
  document.getElementById('login-password').value = '';
  clearAlerts();
}

/* ── OTP UI HELPERS ─────────────────────────────────────────── */

function showOTPAlert(type, msg) {
  const el = document.getElementById('otp-alert');
  if (!el) return;
  const icons = { error:'times-circle', warning:'exclamation-triangle', success:'check-circle' };
  el.className = `alert-box ${type}`;
  el.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${msg}`;
  el.classList.remove('hidden');
}

function markOTPBoxes(cls) {
  document.querySelectorAll('.otp-box').forEach(b => {
    b.classList.remove('filled', 'otp-error', 'otp-success');
    if (cls) b.classList.add(cls);
  });
}

function shakeOTPBoxes() {
  const wrap = document.getElementById('otp-inputs');
  if (!wrap) return;
  wrap.style.animation = 'none';
  void wrap.offsetWidth;
  wrap.style.animation = 'shake .45s ease both';
  setTimeout(() => { wrap.style.animation = ''; }, 500);
}

/**
 * Masks email: e.g. emily@gmail.com → em***@gmail.com
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────────*/
(function init() {
  // Seed default data
  seedUsers();
  seedData();

  // Apply saved theme immediately
  applyTheme(APP.theme);

  // Pre-fill remembered username
  const remembered = store.get('arbees_remember');
  if (remembered) {
    const input = document.getElementById('login-username');
    if (input) {
      input.value = remembered;
      document.getElementById('remember-me').checked = true;
    }
  }

  // Check for existing valid session
  if (checkSession()) {
    launchApp();
  } else {
    // Make sure auth screen is visible
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  // Add ripple effect to buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn, .btn-auth');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    ripple.className = 'ripple';
    ripple.style.cssText = `
      width: ${Math.max(rect.width, rect.height) * 2}px;
      height: ${Math.max(rect.width, rect.height) * 2}px;
      left: ${e.clientX - rect.left - Math.max(rect.width, rect.height)}px;
      top: ${e.clientY - rect.top - Math.max(rect.width, rect.height)}px;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });

  console.log('%c🍞 Arbee\'s Bakery IMS loaded!', 'color:#c8702a;font-weight:bold;font-size:14px');
})();
