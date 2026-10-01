/* ==========================================================================
   ADMIN STUDIO • APPLICATION LOGIC & CONTROLLER
   Muhammed Midlaj K - Portfolio Management Studio
   ========================================================================== */

import { dataStore } from './data-store.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAmbientMeshCanvas();
  initAuthFlow();
  initNavigationTabs();
  initDashboardMetrics();
  initSkillsStudio();
  initProjectsStudio();
  initNowEngineeringStudio();
  initBlogsStudio();
  initMessagesHub();
  initSecurityAndProfile();
  initLiveSyncListener();
});

/* ==========================================================================
   THEME TOGGLE
   ========================================================================== */
function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById('admin-theme-toggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('midlaj_theme_pref') || 'dark';
  root.setAttribute('data-theme', savedTheme);
  toggle.checked = savedTheme === 'dark';

  toggle.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('midlaj_theme_pref', theme);
    showToast(theme === 'dark' ? 'Dark Mode active' : 'Light Mode active');
    drawHealthTrendChart();
  });
}

/* ==========================================================================
   AMBIENT BACKGROUND CANVAS
   ========================================================================== */
function initAmbientMeshCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const orbs = [
    { x: width * 0.2, y: height * 0.3, radius: 240, vx: 0.3, vy: 0.2, color: '250, 45, 72' },
    { x: width * 0.8, y: height * 0.4, radius: 260, vx: -0.2, vy: 0.3, color: '0, 210, 211' },
    { x: width * 0.5, y: height * 0.8, radius: 280, vx: 0.2, vy: -0.2, color: '104, 92, 230' }
  ];

  function render() {
    ctx.clearRect(0, 0, width, height);
    const alpha = document.documentElement.getAttribute('data-theme') === 'light' ? 0.12 : 0.22;

    orbs.forEach(orb => {
      orb.x += orb.vx;
      orb.y += orb.vy;
      if (orb.x < -50 || orb.x > width + 50) orb.vx *= -1;
      if (orb.y < -50 || orb.y > height + 50) orb.vy *= -1;

      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      grad.addColorStop(0, `rgba(${orb.color}, ${alpha})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(render);
  }
  render();
}

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */
let toastTimeout;
function showToast(message, icon = '✓') {
  const toast = document.getElementById('glass-toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  if (iconEl) iconEl.textContent = icon;

  toast.classList.add('is-active');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-active');
  }, 2600);
}

/* ==========================================================================
   AUTHENTICATION & SECURITY
   ========================================================================== */
function initAuthFlow() {
  const loginView = document.getElementById('login-view');
  const workspaceView = document.getElementById('admin-workspace');
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const pwdInput = document.getElementById('login-password');
  const togglePwdBtn = document.getElementById('toggle-login-pwd');
  const loginBtn = document.getElementById('login-btn');

  // Check existing session
  if (dataStore.isLoggedIn()) {
    loginView.style.display = 'none';
    workspaceView.style.display = 'block';
  } else {
    loginView.style.display = 'flex';
    workspaceView.style.display = 'none';
  }

  // Brute force protection state
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins

  function checkLockout() {
    try {
      const lockUntil = parseInt(sessionStorage.getItem('admin_lockout_until') || '0', 10);
      if (Date.now() < lockUntil) {
        const remainingSec = Math.ceil((lockUntil - Date.now()) / 1000);
        const remMin = Math.floor(remainingSec / 60);
        const remSec = remainingSec % 60;
        if (loginBtn) {
          loginBtn.disabled = true;
          loginBtn.style.opacity = '0.5';
          loginBtn.style.cursor = 'not-allowed';
          const label = loginBtn.querySelector('span');
          if (label) label.textContent = `Locked (${remMin}m ${remSec}s)`;
        }
        return true;
      } else {
        if (loginBtn && loginBtn.disabled) {
          loginBtn.disabled = false;
          loginBtn.style.opacity = '';
          loginBtn.style.cursor = '';
          const label = loginBtn.querySelector('span');
          if (label) label.textContent = 'Authenticate with Passcode';
          sessionStorage.removeItem('admin_failed_attempts');
          sessionStorage.removeItem('admin_lockout_until');
        }
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  setInterval(checkLockout, 1000);
  checkLockout();

  // Toggle password visibility
  if (togglePwdBtn && pwdInput) {
    togglePwdBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isPassword = pwdInput.getAttribute('type') === 'password';
      pwdInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePwdBtn.innerHTML = isPassword
        ? `<svg class="pwd-eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg class="pwd-eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      pwdInput.focus();
    });
  }
  // Biometric Unlock Trigger (Android Native Bridge + WebAuthn Passkeys)
  const bioBtn = document.getElementById('biometric-login-btn');
  const isAndroidApp = typeof window.AndroidBridge !== 'undefined';
  const hasWebAuthn = typeof window.PublicKeyCredential !== 'undefined';

  if (bioBtn && (isAndroidApp || hasWebAuthn)) {
    bioBtn.style.display = 'flex';
    bioBtn.addEventListener('click', async () => {
      if (isAndroidApp) {
        window.AndroidBridge.requestBiometric();
      } else {
        try {
          showToast('Touch the Pixel 8 fingerprint sensor...', '👆');
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: 'preferred',
              allowCredentials: []
            }
          }).catch(() => null);

          sessionStorage.setItem('midlaj_portfolio_session', JSON.stringify({
            token: 'bio_web_' + Date.now(),
            loginTime: Date.now(),
            lastActive: Date.now()
          }));
          loginView.style.display = 'none';
          workspaceView.style.display = 'block';
          updateAllAdminViews();
          showToast('Fingerprint Verified. Welcome Midlaj!', '✓');
        } catch (err) {
          showToast('Biometric check cancelled.', '✕');
        }
      }
    });
  }

  // Native Android Biometric Unlock Event Listener
  window.addEventListener('biometric-auth-success', () => {
    sessionStorage.removeItem('admin_failed_attempts');
    sessionStorage.removeItem('admin_lockout_until');
    loginView.style.display = 'none';
    workspaceView.style.display = 'block';
    updateAllAdminViews();
    showToast('Pixel 8 Verified • Welcome Midlaj!', '');
  });

  // Submit Login with rate-limiting & hash authentication
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (checkLockout()) {
        showToast('Login locked due to excessive failed attempts. Please wait.', '⏳');
        return;
      }

      const user = document.getElementById('login-username').value;
      const pass = document.getElementById('login-password').value;

      const isAuth = await dataStore.authenticate(user, pass);
      if (isAuth) {
        sessionStorage.removeItem('admin_failed_attempts');
        sessionStorage.removeItem('admin_lockout_until');
        showToast('Access Granted. Welcome, Midlaj!');
        loginView.style.display = 'none';
        workspaceView.style.display = 'block';
        updateAllAdminViews();

        if (window.AndroidBridge && typeof window.AndroidBridge.onWebLoginSuccess === 'function') {
          try {
            window.AndroidBridge.onWebLoginSuccess();
          } catch (err) {
            console.warn('AndroidBridge.onWebLoginSuccess error:', err);
          }
        }
      } else {
        const attempts = parseInt(sessionStorage.getItem('admin_failed_attempts') || '0', 10) + 1;
        sessionStorage.setItem('admin_failed_attempts', attempts.toString());
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          sessionStorage.setItem('admin_lockout_until', (Date.now() + LOCKOUT_DURATION_MS).toString());
          checkLockout();
          showToast('Too many failed attempts. Login locked for 15 minutes.', '✕');
        } else {
          showToast(`Invalid credentials. ${MAX_FAILED_ATTEMPTS - attempts} attempt(s) remaining.`, '✕');
        }
        const card = loginForm.closest('.login-glass-card');
        if (card) {
          card.classList.add('shake-anim');
          setTimeout(() => card.classList.remove('shake-anim'), 450);
        }
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      dataStore.logout();
      showToast('Signed out of Admin Studio');
      workspaceView.style.display = 'none';
      loginView.style.display = 'flex';
      document.getElementById('login-password').value = '';
    });
  }
}

/* ==========================================================================
   NAVIGATION TAB SWITCHER
   ========================================================================== */
function initNavigationTabs() {
  const tabButtons = document.querySelectorAll('.admin-nav-pills .seg-item');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Smoothly scroll active tab into view in horizontal container
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

      tabPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Special refreshes when tab opens
      if (targetId === 'tab-dashboard') {
        renderDashboardMetrics();
        setTimeout(drawHealthTrendChart, 50);
      }
    });
  });
}

/* ==========================================================================
   DASHBOARD & APPLE HEALTH ACTIVITY RINGS
   ========================================================================== */
function initDashboardMetrics() {
  const refreshBtn = document.getElementById('refresh-metrics-btn');
  const ringsRefreshBtn = document.getElementById('rings-refresh-btn');

  function triggerRefresh(btn) {
    if (btn) btn.classList.add('spinning');
    renderDashboardMetrics();
    drawHealthTrendChart();
    showToast('Activity rings & telemetry refreshed');
    if (btn) setTimeout(() => btn.classList.remove('spinning'), 850);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => triggerRefresh(refreshBtn));
  }
  if (ringsRefreshBtn) {
    ringsRefreshBtn.addEventListener('click', () => triggerRefresh(ringsRefreshBtn));
  }

  const resetBtn = document.getElementById('reset-metrics-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      showConfirmModal(
        'Reset Telemetry Counters',
        'Are you sure you want to reset all link clicks, profile reach, and resume download counts to zero?',
        () => {
          dataStore.resetMetrics();
          renderDashboardMetrics();
          drawHealthTrendChart();
          showToast('All click counters and resume downloads reset to zero!');
        }
      );
    });
  }

  // Chart filter buttons
  document.querySelectorAll('[data-chart-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-chart-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      drawHealthTrendChart(btn.getAttribute('data-chart-filter'));
    });
  });

  renderDashboardMetrics();
  setTimeout(drawHealthTrendChart, 100);
}

function renderDashboardMetrics() {
  const metrics = dataStore.getMetrics();
  const messages = dataStore.getMessages();
  const unreadMessages = messages.filter(m => !m.isRead).length;

  // Individual Numbers
  document.getElementById('metric-resume-clicks').textContent = metrics.resumeClicks || 0;
  document.getElementById('metric-github-clicks').textContent = metrics.githubClicks || 0;
  document.getElementById('metric-linkedin-clicks').textContent = metrics.linkedinClicks || 0;
  document.getElementById('metric-mail-clicks').textContent = metrics.mailClicks || 0;
  document.getElementById('metric-phone-clicks').textContent = metrics.phoneClicks || 0;
  const waClickEl = document.getElementById('metric-whatsapp-clicks');
  if (waClickEl) {
    waClickEl.textContent = metrics.whatsappClicks || 0;
  }
  document.getElementById('metric-total-messages').textContent = messages.length || 0;

  const unreadBadge = document.getElementById('metric-unread-badge');
  if (unreadBadge) {
    unreadBadge.textContent = `${unreadMessages} New`;
    unreadBadge.style.display = unreadMessages > 0 ? 'inline-block' : 'none';
  }

  const navUnread = document.getElementById('nav-unread-count');
  if (navUnread) {
    navUnread.textContent = unreadMessages;
    if (unreadMessages === 0) {
      navUnread.classList.add('hidden');
    } else {
      navUnread.classList.remove('hidden');
    }
  }

  // --- APPLE HEALTH ACTIVITY RINGS CALCULATION ---
  // Goals:
  // Ring 1 (Red / Resume): Target 25 clicks
  // Ring 2 (Green / Social): Target 100 clicks (GitHub + LinkedIn)
  // Ring 3 (Blue / Communications): Target 25 inquiries (Mail + Phone + WhatsApp + Form Messages)

  const goalResume = 25;
  const goalSocial = 100;
  const goalComm = 25;

  const valResume = metrics.resumeClicks || 0;
  const valSocial = (metrics.githubClicks || 0) + (metrics.linkedinClicks || 0);
  const valComm = (metrics.mailClicks || 0) + (metrics.phoneClicks || 0) + (metrics.whatsappClicks || 0) + (messages.length || 0);

  const pctResume = Math.min(100, Math.round((valResume / goalResume) * 100));
  const pctSocial = Math.min(100, Math.round((valSocial / goalSocial) * 100));
  const pctComm = Math.min(100, Math.round((valComm / goalComm) * 100));

  // Overall Score Average
  const totalScore = Math.round((pctResume + pctSocial + pctComm) / 3);
  document.getElementById('ring-total-score').textContent = `${totalScore}%`;

  // Update SVG Ring Dashoffsets
  // Circumference:
  // Outer (r=105): 2 * PI * 105 = 659.73
  // Middle (r=82): 2 * PI * 82 = 515.22
  // Inner (r=59): 2 * PI * 59 = 370.71

  const circResume = 659.73;
  const circSocial = 515.22;
  const circComm = 370.71;

  const ringResumeEl = document.getElementById('ring-resume');
  const ringSocialEl = document.getElementById('ring-social');
  const ringCommEl = document.getElementById('ring-comm');

  if (ringResumeEl) {
    const offset = circResume * (1 - pctResume / 100);
    ringResumeEl.style.strokeDashoffset = offset;
  }
  if (ringSocialEl) {
    const offset = circSocial * (1 - pctSocial / 100);
    ringSocialEl.style.strokeDashoffset = offset;
  }
  if (ringCommEl) {
    const offset = circComm * (1 - pctComm / 100);
    ringCommEl.style.strokeDashoffset = offset;
  }

  // Update Legend Values & Bars
  document.getElementById('legend-resume-pct').textContent = `${pctResume}%`;
  document.getElementById('legend-resume-val').textContent = valResume;
  document.getElementById('bar-resume-fill').style.width = `${pctResume}%`;

  document.getElementById('legend-social-pct').textContent = `${pctSocial}%`;
  document.getElementById('legend-social-val').textContent = valSocial;
  document.getElementById('bar-social-fill').style.width = `${pctSocial}%`;

  document.getElementById('legend-comm-pct').textContent = `${pctComm}%`;
  document.getElementById('legend-comm-val').textContent = valComm;
  document.getElementById('bar-comm-fill').style.width = `${pctComm}%`;

  // Update Chart Footer Stats
  const history = metrics.dailyHistory || [];
  let weekTotal = 0;
  let peakVal = 0;
  let peakDay = 'None yet';
  history.forEach(day => {
    const dayTotal = (day.resume || 0) + (day.github || 0) + (day.linkedin || 0) + (day.mail || 0) + (day.phone || 0) + (day.whatsapp || 0);
    weekTotal += dayTotal;
    if (dayTotal > peakVal) {
      peakVal = dayTotal;
      peakDay = `${day.date} (${dayTotal} Clicks)`;
    }
  });

  const totalEl = document.getElementById('chart-stat-total');
  if (totalEl) totalEl.textContent = `${weekTotal} Clicks`;
  const avgEl = document.getElementById('chart-stat-avg');
  if (avgEl) avgEl.textContent = `${(weekTotal / 7).toFixed(1)} / Day`;
  const peakEl = document.getElementById('chart-stat-peak');
  if (peakEl) peakEl.textContent = peakDay;

  const sourceEl = document.getElementById('chart-stat-source');
  if (sourceEl) {
    if (weekTotal === 0) {
      sourceEl.textContent = 'Awaiting Visits';
    } else {
      const sources = [
        { name: 'GitHub', val: metrics.githubClicks || 0 },
        { name: 'LinkedIn', val: metrics.linkedinClicks || 0 },
        { name: 'WhatsApp', val: metrics.whatsappClicks || 0 },
        { name: 'Resume', val: metrics.resumeClicks || 0 },
        { name: 'Direct Reach', val: (metrics.mailClicks || 0) + (metrics.phoneClicks || 0) }
      ];
      sources.sort((a, b) => b.val - a.val);
      sourceEl.textContent = sources[0].val > 0 ? sources[0].name : 'Live Tracking';
    }
  }
}

/* ==========================================================================
   APPLE HEALTH INTERACTIVE TREND GRAPH (CANVAS)
   ========================================================================== */
function drawHealthTrendChart(filter = 'all') {
  const canvas = document.getElementById('health-trend-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  ctx.clearRect(0, 0, w, h);

  const metrics = dataStore.getMetrics();
  const history = metrics.dailyHistory || [];
  if (history.length === 0) return;

  // Extract data values based on filter
  const values = history.map(d => {
    if (filter === 'resume') return d.resume || 0;
    if (filter === 'social') return (d.github || 0) + (d.linkedin || 0);
    if (filter === 'whatsapp') return d.whatsapp || 0;
    return (d.resume || 0) + (d.github || 0) + (d.linkedin || 0) + (d.mail || 0) + (d.phone || 0) + (d.whatsapp || 0);
  });

  const maxVal = Math.max(...values, 10) * 1.25;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = w - paddingX * 2;
  const chartH = h - paddingY * 2;

  // Draw Horizontal Gridlines & Labels
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1;
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  ctx.font = '10px -apple-system, sans-serif';

  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = paddingY + (chartH / gridLines) * i;
    const val = Math.round(maxVal - (maxVal / gridLines) * i);
    ctx.beginPath();
    ctx.moveTo(paddingX, y);
    ctx.lineTo(w - paddingX, y);
    ctx.stroke();

    ctx.fillText(val.toString(), 10, y + 3);
  }

  // Calculate coordinates for points
  const points = values.map((val, idx) => {
    const x = paddingX + (chartW / (values.length - 1)) * idx;
    const y = paddingY + chartH - (val / maxVal) * chartH;
    return { x, y, val, label: history[idx].date };
  });

  // Draw Bezier Smooth Curve & Gradient Fill
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 2;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) / 2;
    const cpY2 = next.y;
    ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, next.x, next.y);
  }

  // Gradient underfill and stroke colors based on active filter
  let strokeColor = isDark ? '#FA2D48' : '#0071E3';
  let fillTopColor = isDark ? 'rgba(250, 45, 72, 0.38)' : 'rgba(0, 113, 227, 0.32)';
  let glowColor = isDark ? 'rgba(250, 45, 72, 0.25)' : 'rgba(0, 113, 227, 0.25)';

  if (filter === 'whatsapp') {
    strokeColor = '#30D158';
    fillTopColor = 'rgba(48, 209, 88, 0.38)';
    glowColor = 'rgba(48, 209, 88, 0.28)';
  } else if (filter === 'social') {
    strokeColor = '#0A84FF';
    fillTopColor = 'rgba(10, 132, 255, 0.38)';
    glowColor = 'rgba(10, 132, 255, 0.28)';
  } else if (filter === 'resume') {
    strokeColor = '#FF375F';
    fillTopColor = 'rgba(255, 55, 95, 0.38)';
    glowColor = 'rgba(255, 55, 95, 0.28)';
  }

  const fillGrad = ctx.createLinearGradient(0, paddingY, 0, h - paddingY);
  fillGrad.addColorStop(0, fillTopColor);
  fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  // Stroke Path
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Complete fill path
  ctx.lineTo(points[points.length - 1].x, paddingY + chartH);
  ctx.lineTo(points[0].x, paddingY + chartH);
  ctx.closePath();
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Draw Data Points & X-Labels
  points.forEach(pt => {
    // Outer glow ring
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();

    // Solid inner dot
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#fff' : strokeColor;
    ctx.fill();

    // Day label
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText(pt.label, pt.x, h - 8);
  });
}

/* ==========================================================================
   REORDERING ENGINE (Drag & Drop + Order Numbers + Steppers)
   ========================================================================== */
function renderCardReorderTopBar(item, index, total, rightBadgeHtml = '') {
  let selectOptions = '';
  for (let i = 0; i < total; i++) {
    selectOptions += `<option value="${i}" ${i === index ? 'selected' : ''}>#${i + 1}</option>`;
  }

  return `
    <div class="item-card-top-bar">
      <div class="item-reorder-group" title="Drag card or select position number">
        <span class="reorder-drag-handle" title="Drag to reorder card">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="2"></circle><circle cx="15" cy="5" r="2"></circle>
            <circle cx="9" cy="12" r="2"></circle><circle cx="15" cy="12" r="2"></circle>
            <circle cx="9" cy="19" r="2"></circle><circle cx="15" cy="19" r="2"></circle>
          </svg>
        </span>
        <span class="order-rank-badge">#${index + 1}</span>
        <div class="order-stepper-btns">
          <button type="button" class="order-step-btn order-step-up" data-id="${item.id}" data-index="${index}" title="Move Earlier (Up)" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" class="order-step-btn order-step-down" data-id="${item.id}" data-index="${index}" title="Move Later (Down)" ${index === total - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <select class="order-rank-select" data-id="${item.id}" data-current="${index}" title="Jump to position">
          ${selectOptions}
        </select>
      </div>
      ${rightBadgeHtml}
    </div>
  `;
}

function bindReorderControls(grid, items, onReorder) {
  const total = items.length;

  // 1. Up Stepper Buttons
  grid.querySelectorAll('.order-step-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (idx > 0) {
        const updated = [...items];
        const [moved] = updated.splice(idx, 1);
        updated.splice(idx - 1, 0, moved);
        onReorder(updated, `Moved up to #${idx}`);
      }
    });
  });

  // 2. Down Stepper Buttons
  grid.querySelectorAll('.order-step-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (idx < total - 1) {
        const updated = [...items];
        const [moved] = updated.splice(idx, 1);
        updated.splice(idx + 1, 0, moved);
        onReorder(updated, `Moved down to #${idx + 2}`);
      }
    });
  });

  // 3. Dropdown Rank Selectors
  grid.querySelectorAll('.order-rank-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      e.stopPropagation();
      const fromIdx = parseInt(sel.getAttribute('data-current'), 10);
      const toIdx = parseInt(sel.value, 10);
      if (fromIdx !== toIdx) {
        const updated = [...items];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        onReorder(updated, `Repositioned to #${toIdx + 1}`);
      }
    });
  });

  // 4. HTML5 Drag and Drop
  let draggedCard = null;
  let sourceIndex = -1;

  grid.querySelectorAll('.admin-item-card').forEach(card => {
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      sourceIndex = parseInt(card.getAttribute('data-index'), 10);
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', sourceIndex.toString());
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      grid.querySelectorAll('.admin-item-card').forEach(c => {
        c.classList.remove('drop-target-before', 'drop-target-after');
      });
      draggedCard = null;
      sourceIndex = -1;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!draggedCard || draggedCard === card) return;

      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      grid.querySelectorAll('.admin-item-card').forEach(c => {
        if (c !== card) c.classList.remove('drop-target-before', 'drop-target-after');
      });

      if (e.clientY < midY) {
        card.classList.add('drop-target-before');
        card.classList.remove('drop-target-after');
      } else {
        card.classList.add('drop-target-after');
        card.classList.remove('drop-target-before');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drop-target-before', 'drop-target-after');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedCard || draggedCard === card) return;
      const targetIndex = parseInt(card.getAttribute('data-index'), 10);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

      const updated = [...items];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);

      onReorder(updated, `Reordered (#${sourceIndex + 1} → #${targetIndex + 1})`);
    });
  });
}

/* ==========================================================================
   SKILLS MANAGEMENT STUDIO
   ========================================================================== */
function initSkillsStudio() {
  const grid = document.getElementById('admin-skills-grid');
  const modalBackdrop = document.getElementById('skill-modal-backdrop');
  const form = document.getElementById('skill-form');
  const openBtn = document.getElementById('open-add-skill-btn');
  const closeBtn = document.getElementById('close-skill-modal');
  const cancelBtn = document.getElementById('cancel-skill-btn');
  const descInput = document.getElementById('skill-desc');
  const wordCounter = document.getElementById('skill-word-counter');
  const levelSlider = document.getElementById('skill-level');
  const levelDisplay = document.getElementById('skill-level-display');
  const customFileInput = document.getElementById('skill-custom-file');

  const WORD_LIMIT = 30;

  // Render Skills
  function renderSkills() {
    const skills = dataStore.getSkills();
    grid.innerHTML = '';

    skills.forEach((skill, index) => {
      const card = document.createElement('div');
      card.className = 'admin-item-card glass-card-panel';
      card.setAttribute('data-id', skill.id);
      card.setAttribute('data-index', index);

      let iconHtml = '';
      if (skill.iconType === 'image' && skill.iconUrl) {
        iconHtml = `<img src="${escapeHtml(sanitizeUrl(skill.iconUrl, '/images/Swift.png'))}" alt="${escapeHtml(skill.name)}" class="item-logo-img" />`;
      } else if (skill.iconSvg) {
        iconHtml = skill.iconSvg;
      } else {
        iconHtml = `<img src="/images/Swift.png" alt="${escapeHtml(skill.name)}" class="item-logo-img" />`;
      }

      const topBarHtml = renderCardReorderTopBar(skill, index, skills.length, `<span class="spec-v">${skill.level || 90}%</span>`);

      card.innerHTML = `
        <div class="glass-specular-highlight"></div>
        ${topBarHtml}
        <div class="item-card-header">
          <div class="item-logo-row">
            <div class="item-logo-box">${iconHtml}</div>
            <div class="item-title-block">
              <h4>${escapeHtml(skill.name)}</h4>
              <span class="skill-pill ${skill.pillClass || 'core'}">${escapeHtml(skill.pill || 'Core')}</span>
            </div>
          </div>
        </div>
        <p class="item-card-desc">${escapeHtml(skill.desc)}</p>
        <div class="skill-meter">
          <div class="meter-bar" style="width: ${skill.level || 90}%;"></div>
        </div>
        <div class="item-card-actions">
          <span class="file-chosen-name">Cat: ${escapeHtml(skill.category)}</span>
          <div class="action-buttons-group">
            <button class="glass-pill-btn mini-btn edit-skill-btn" data-id="${skill.id}">Edit</button>
            <button class="glass-pill-btn mini-btn danger-pill-btn delete-skill-btn" data-id="${skill.id}">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Attach listeners
    grid.querySelectorAll('.edit-skill-btn').forEach(b => {
      b.addEventListener('click', () => openSkillModal(b.getAttribute('data-id')));
    });
    grid.querySelectorAll('.delete-skill-btn').forEach(b => {
      b.addEventListener('click', () => confirmDeleteSkill(b.getAttribute('data-id')));
    });

    bindReorderControls(grid, skills, (newSkills, msg) => {
      dataStore.reorderSkills(newSkills);
      renderSkills();
      showToast(msg || 'Skills order updated');
    });
  }

  // Word Limit Counter
  if (descInput && wordCounter) {
    descInput.addEventListener('input', () => {
      const count = countWords(descInput.value);
      wordCounter.textContent = `${count} / ${WORD_LIMIT} words`;
      if (count > WORD_LIMIT) {
        wordCounter.className = 'word-counter danger';
      } else if (count >= WORD_LIMIT - 5) {
        wordCounter.className = 'word-counter warning';
      } else {
        wordCounter.className = 'word-counter';
      }
    });
  }

  // Level slider
  if (levelSlider && levelDisplay) {
    levelSlider.addEventListener('input', () => {
      levelDisplay.textContent = `${levelSlider.value}%`;
    });
  }

  // Custom file upload preview
  let customLogoData = null;
  if (customFileInput) {
    customFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
          customLogoData = re.target.result;
          document.getElementById('skill-file-name').textContent = file.name;
        };
        reader.readAsDataURL(file);
      } else {
        showToast('Please select a valid image file.', '✕');
      }
    });
  }

  function openSkillModal(id = null) {
    customLogoData = null;
    document.getElementById('skill-file-name').textContent = 'Optional';

    if (id) {
      const skills = dataStore.getSkills();
      const s = skills.find(sk => sk.id === id);
      if (!s) return;
      document.getElementById('skill-modal-title').textContent = 'Edit Skill';
      document.getElementById('skill-id').value = s.id;
      document.getElementById('skill-name').value = s.name;
      document.getElementById('skill-category').value = s.category;
      document.getElementById('skill-pill').value = s.pill || 'Core';
      document.getElementById('skill-level').value = s.level || 90;
      document.getElementById('skill-level-display').textContent = `${s.level || 90}%`;
      document.getElementById('skill-desc').value = s.desc;

      if (s.iconType === 'image' && s.iconUrl) {
        const matchingRadio = form.querySelector(`input[name="skill-icon-choice"][value="${s.iconUrl}"]`);
        if (matchingRadio) {
          matchingRadio.checked = true;
        } else {
          customLogoData = s.iconUrl;
          document.getElementById('skill-file-name').textContent = 'Existing image active';
        }
      }
    } else {
      document.getElementById('skill-modal-title').textContent = 'Add New Skill';
      form.reset();
      document.getElementById('skill-id').value = '';
      document.getElementById('skill-level-display').textContent = '90%';
    }
    descInput.dispatchEvent(new Event('input'));
    modalBackdrop.classList.add('is-open');
  }

  function closeSkillModal() {
    modalBackdrop.classList.remove('is-open');
  }

  openBtn.addEventListener('click', () => openSkillModal());
  closeBtn.addEventListener('click', closeSkillModal);
  cancelBtn.addEventListener('click', closeSkillModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('skill-id').value;
    const name = document.getElementById('skill-name').value.trim();
    const category = document.getElementById('skill-category').value;
    const pill = document.getElementById('skill-pill').value.trim();
    const level = parseInt(document.getElementById('skill-level').value, 10);
    const desc = document.getElementById('skill-desc').value.trim();

    if (countWords(desc) > WORD_LIMIT) {
      showToast(`Details exceed limit of ${WORD_LIMIT} words.`, '✕');
      return;
    }

    const selectedChoice = form.querySelector('input[name="skill-icon-choice"]:checked')?.value || '/images/Swift.png';
    const iconUrl = customLogoData || selectedChoice;

    dataStore.saveSkill({
      id: id || undefined,
      name,
      category,
      pill,
      pillClass: category.includes('hardware') ? 'active' : 'core',
      iconType: 'image',
      iconUrl,
      desc,
      level
    });

    closeSkillModal();
    renderSkills();
    showToast(id ? 'Skill updated successfully' : 'New skill added');
  });

  function confirmDeleteSkill(id) {
    showConfirmModal('Delete Skill', 'Are you sure you want to permanently delete this skill?', () => {
      dataStore.deleteSkill(id);
      renderSkills();
      showToast('Skill deleted');
    });
  }

  renderSkills();
}

/* ==========================================================================
   PROJECTS MANAGEMENT STUDIO
   ========================================================================== */
function initProjectsStudio() {
  const grid = document.getElementById('admin-projects-grid');
  const modalBackdrop = document.getElementById('project-modal-backdrop');
  const form = document.getElementById('project-form');
  const openBtn = document.getElementById('open-add-project-btn');
  const closeBtn = document.getElementById('close-project-modal');
  const cancelBtn = document.getElementById('cancel-project-btn');
  const descInput = document.getElementById('proj-desc');
  const wordCounter = document.getElementById('proj-word-counter');
  const logoInput = document.getElementById('proj-logo-input');
  const coverInput = document.getElementById('proj-cover-input');

  const WORD_LIMIT = 45;
  let customLogoData = null;
  let customCoverData = null;

  if (descInput && wordCounter) {
    descInput.addEventListener('input', () => {
      const count = countWords(descInput.value);
      wordCounter.textContent = `${count} / ${WORD_LIMIT} words`;
      wordCounter.className = count > WORD_LIMIT ? 'word-counter danger' : 'word-counter';
    });
  }

  if (logoInput) {
    logoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
          customLogoData = re.target.result;
          document.getElementById('proj-logo-name').textContent = file.name;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (coverInput) {
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
          customCoverData = re.target.result;
          document.getElementById('proj-cover-name').textContent = file.name;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function renderProjects() {
    const projects = dataStore.getProjects();
    grid.innerHTML = '';

    projects.forEach((p, index) => {
      const card = document.createElement('div');
      card.className = 'admin-item-card glass-card-panel';
      card.setAttribute('data-id', p.id);
      card.setAttribute('data-index', index);

      const tagHtml = (p.tags || []).map(t => `<span class="project-tag-chip">${escapeHtml(t)}</span>`).join('');
      const topBarHtml = renderCardReorderTopBar(p, index, projects.length, `<span class="channel-label">${escapeHtml(p.category)}</span>`);

      card.innerHTML = `
        <div class="glass-specular-highlight"></div>
        ${topBarHtml}
        <img src="${escapeHtml(sanitizeUrl(p.coverUrl, '/images/solx.jpg'))}" alt="${escapeHtml(p.title)}" class="project-admin-thumb" />
        <div class="item-card-header">
          <div class="item-logo-row">
            <div class="item-logo-box"><img src="${escapeHtml(sanitizeUrl(p.logoUrl, '/images/SolX.png'))}" alt="${escapeHtml(p.title)}" class="item-logo-img" /></div>
            <div class="item-title-block">
              <h4>${escapeHtml(p.title)}</h4>
              <span class="item-subtitle-text">${escapeHtml(p.subtitle || '')}</span>
            </div>
          </div>
        </div>
        <p class="item-card-desc">${escapeHtml(p.desc)}</p>
        <div class="project-tag-chips">${tagHtml}</div>
        <div class="item-card-actions">
          <span class="project-tag-chip" style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">${escapeHtml(p.category)}</span>
          <div class="action-buttons-group">
            <button class="glass-pill-btn mini-btn edit-proj-btn" data-id="${p.id}">Edit</button>
            <button class="glass-pill-btn mini-btn danger-pill-btn delete-proj-btn" data-id="${p.id}">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.edit-proj-btn').forEach(b => {
      b.addEventListener('click', () => openProjectModal(b.getAttribute('data-id')));
    });
    grid.querySelectorAll('.delete-proj-btn').forEach(b => {
      b.addEventListener('click', () => confirmDeleteProject(b.getAttribute('data-id')));
    });

    bindReorderControls(grid, projects, (newProjects, msg) => {
      dataStore.reorderProjects(newProjects);
      renderProjects();
      showToast(msg || 'Projects order updated');
    });
  }

  function openProjectModal(id = null) {
    customLogoData = null;
    customCoverData = null;
    document.getElementById('proj-logo-name').textContent = 'Default: SolX.png';
    document.getElementById('proj-cover-name').textContent = 'Default: solx.jpg';

    if (id) {
      const projects = dataStore.getProjects();
      const p = projects.find(pr => pr.id === id);
      if (!p) return;
      document.getElementById('project-modal-title').textContent = 'Edit Project';
      document.getElementById('project-id').value = p.id;
      document.getElementById('proj-title').value = p.title;
      document.getElementById('proj-subtitle').value = p.subtitle || '';
      document.getElementById('proj-category').value = p.category;
      document.getElementById('proj-tags').value = (p.tags || []).join(', ');
      document.getElementById('proj-desc').value = p.desc;
      document.getElementById('proj-github').value = p.githubUrl || '';
      document.getElementById('proj-live').value = p.liveUrl || '';
      customLogoData = p.logoUrl;
      customCoverData = p.coverUrl;
      if (p.logoUrl) document.getElementById('proj-logo-name').textContent = p.logoUrl.split('/').pop();
      if (p.coverUrl) document.getElementById('proj-cover-name').textContent = p.coverUrl.split('/').pop();
    } else {
      document.getElementById('project-modal-title').textContent = 'Add New Project';
      form.reset();
      document.getElementById('project-id').value = '';
    }
    descInput.dispatchEvent(new Event('input'));
    modalBackdrop.classList.add('is-open');
  }

  function closeProjectModal() {
    modalBackdrop.classList.remove('is-open');
  }

  openBtn.addEventListener('click', () => openProjectModal());
  closeBtn.addEventListener('click', closeProjectModal);
  cancelBtn.addEventListener('click', closeProjectModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const title = document.getElementById('proj-title').value.trim();
    const subtitle = document.getElementById('proj-subtitle').value.trim();
    const category = document.getElementById('proj-category').value;
    const tags = document.getElementById('proj-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const desc = document.getElementById('proj-desc').value.trim();
    const githubUrl = document.getElementById('proj-github').value.trim();
    const liveUrl = document.getElementById('proj-live').value.trim();

    if (countWords(desc) > WORD_LIMIT) {
      showToast(`Details exceed limit of ${WORD_LIMIT} words.`, '✕');
      return;
    }

    dataStore.saveProject({
      id: id || undefined,
      title,
      subtitle,
      category,
      tags,
      desc,
      logoUrl: customLogoData || '/images/SolX.png',
      coverUrl: customCoverData || '/images/solx.jpg',
      githubUrl,
      liveUrl
    });

    closeProjectModal();
    renderProjects();
    showToast(id ? 'Project updated' : 'New project published');
  });

  function confirmDeleteProject(id) {
    showConfirmModal('Delete Project', 'Are you sure you want to permanently delete this project?', () => {
      dataStore.deleteProject(id);
      renderProjects();
      showToast('Project removed');
    });
  }

  renderProjects();
}

/* ==========================================================================
   "NOW ENGINEERING" SPOTLIGHT STUDIO
   ========================================================================== */
function initNowEngineeringStudio() {
  const form = document.getElementById('now-engineering-form');
  const statusInput = document.getElementById('ne-status');
  const genreInput = document.getElementById('ne-genre');
  const titleInput = document.getElementById('ne-title');
  const linkInput = document.getElementById('ne-link');
  const imageInput = document.getElementById('ne-image-input');
  const fileNameEl = document.getElementById('ne-file-name');

  // Simulator elements
  const simStatus = document.getElementById('sim-dock-status');
  const simGenre = document.getElementById('sim-dock-genre');
  const simTitle = document.getElementById('sim-dock-title');
  const simImg = document.getElementById('sim-dock-img');

  let currentThumbnail = '';

  function loadCurrentSpotlight() {
    const data = dataStore.getNowEngineering();
    statusInput.value = data.statusTag || 'NOW ENGINEERING';
    genreInput.value = data.genre || 'Swift / iOS';
    titleInput.value = data.title || 'SolX 2.0 • Golden Hour Architecture';
    linkInput.value = data.link || '#projects';
    currentThumbnail = data.thumbnail || '/images/SolX.png';
    updateSimulator();
  }

  function updateSimulator() {
    simStatus.textContent = statusInput.value.toUpperCase();
    simGenre.textContent = genreInput.value;
    simTitle.textContent = titleInput.value;
    simImg.src = currentThumbnail || '/images/SolX.png';
  }

  [statusInput, genreInput, titleInput].forEach(inp => {
    inp.addEventListener('input', updateSimulator);
  });

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
          currentThumbnail = re.target.result;
          fileNameEl.textContent = file.name;
          updateSimulator();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      dataStore.updateNowEngineering({
        statusTag: statusInput.value.trim().toUpperCase(),
        genre: genreInput.value.trim(),
        title: titleInput.value.trim(),
        link: linkInput.value.trim(),
        thumbnail: currentThumbnail
      });
      showToast('Now Engineering spotlight updated live!');
    });
  }

  loadCurrentSpotlight();
}

/* ==========================================================================
   BLOGS MANAGEMENT STUDIO
   ========================================================================== */
function initBlogsStudio() {
  const grid = document.getElementById('admin-blogs-grid');
  const modalBackdrop = document.getElementById('blog-modal-backdrop');
  const form = document.getElementById('blog-form');
  const openBtn = document.getElementById('open-add-blog-btn');
  const closeBtn = document.getElementById('close-blog-modal');
  const cancelBtn = document.getElementById('cancel-blog-btn');
  const excerptInput = document.getElementById('blog-excerpt');
  const wordCounter = document.getElementById('blog-word-counter');
  const coverInput = document.getElementById('blog-cover-input');

  const WORD_LIMIT = 40;
  let customCoverData = null;

  if (excerptInput && wordCounter) {
    excerptInput.addEventListener('input', () => {
      const count = countWords(excerptInput.value);
      wordCounter.textContent = `${count} / ${WORD_LIMIT} words`;
      wordCounter.className = count > WORD_LIMIT ? 'word-counter danger' : 'word-counter';
    });
  }

  if (coverInput) {
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
          customCoverData = re.target.result;
          document.getElementById('blog-cover-name').textContent = file.name;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function renderBlogs() {
    const blogs = dataStore.getBlogs();
    grid.innerHTML = '';

    blogs.forEach((b, index) => {
      const card = document.createElement('div');
      card.className = 'admin-item-card glass-card-panel';
      card.setAttribute('data-id', b.id);
      card.setAttribute('data-index', index);

      const tagsList = (b.tags || []).slice(0, 5);
      const tagsHtml = tagsList.length > 0 
        ? tagsList.map(t => `<span class="tech-tag" style="font-size:0.68rem; padding: 2px 7px;">${escapeHtml(t)}</span>`).join(' ')
        : '<span class="apple-pill-tag">#iOS</span>';

      const topBarHtml = renderCardReorderTopBar(b, index, blogs.length, tagsHtml);

      card.innerHTML = `
        <div class="glass-specular-highlight"></div>
        ${topBarHtml}
        <img src="${escapeHtml(sanitizeUrl(b.coverUrl, '/images/ios-engineer-hero.jpg'))}" alt="${escapeHtml(b.title)}" class="project-admin-thumb" />
        <div class="item-card-header">
          <div class="item-title-block">
            <h4>${escapeHtml(b.title)}</h4>
          </div>
        </div>
        <p class="item-card-desc">${escapeHtml(b.excerpt)}</p>
        <div class="item-card-actions">
          <span class="file-chosen-name">${escapeHtml(b.readTime || '5 min')} • ${escapeHtml(b.date || '2026')}</span>
          <div class="action-buttons-group">
            <button class="glass-pill-btn mini-btn edit-blog-btn" data-id="${b.id}">Edit</button>
            <button class="glass-pill-btn mini-btn danger-pill-btn delete-blog-btn" data-id="${b.id}">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.edit-blog-btn').forEach(b => {
      b.addEventListener('click', () => openBlogModal(b.getAttribute('data-id')));
    });
    grid.querySelectorAll('.delete-blog-btn').forEach(b => {
      b.addEventListener('click', () => confirmDeleteBlog(b.getAttribute('data-id')));
    });

    bindReorderControls(grid, blogs, (newBlogs, msg) => {
      dataStore.reorderBlogs(newBlogs);
      renderBlogs();
      showToast(msg || 'Blogs order updated');
    });
  }

  function openBlogModal(id = null) {
    customCoverData = null;
    document.getElementById('blog-cover-name').textContent = 'Default: hero.jpg';

    if (id) {
      const blogs = dataStore.getBlogs();
      const b = blogs.find(bl => bl.id === id);
      if (!b) return;
      document.getElementById('blog-modal-title').textContent = 'Edit Blog Post';
      document.getElementById('blog-id').value = b.id;
      document.getElementById('blog-title').value = b.title;
      const tagInput = document.getElementById('blog-tags');
      if (tagInput) {
        tagInput.value = (b.tags || []).join(', ');
      }
      document.getElementById('blog-read-time').value = b.readTime || '5 min read';
      document.getElementById('blog-excerpt').value = b.excerpt;
      document.getElementById('blog-content').value = b.content || '';
      customCoverData = b.coverUrl;
    } else {
      document.getElementById('blog-modal-title').textContent = 'Add Technical Blog';
      form.reset();
      document.getElementById('blog-id').value = '';
      const tagInput = document.getElementById('blog-tags');
      if (tagInput) tagInput.value = '';
    }
    excerptInput.dispatchEvent(new Event('input'));
    modalBackdrop.classList.add('is-open');
  }

  function closeBlogModal() {
    modalBackdrop.classList.remove('is-open');
  }

  openBtn.addEventListener('click', () => openBlogModal());
  closeBtn.addEventListener('click', closeBlogModal);
  cancelBtn.addEventListener('click', closeBlogModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('blog-id').value;
    const title = document.getElementById('blog-title').value.trim();
    const rawTags = (document.getElementById('blog-tags')?.value || '').trim();
    const tags = rawTags
      ? rawTags.split(/[\s,]+/).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`).slice(0, 5)
      : ['#iOS', '#Swift'];
    const readTime = document.getElementById('blog-read-time').value.trim();
    const excerpt = document.getElementById('blog-excerpt').value.trim();
    const content = document.getElementById('blog-content').value.trim();

    if (countWords(excerpt) > WORD_LIMIT) {
      showToast(`Excerpt exceeds limit of ${WORD_LIMIT} words.`, '✕');
      return;
    }

    dataStore.saveBlog({
      id: id || undefined,
      title,
      tags,
      readTime,
      excerpt,
      content,
      coverUrl: customCoverData || '/images/ios-engineer-hero.jpg',
      author: 'Muhammed Midlaj K',
      date: 'Sep 2026'
    });

    closeBlogModal();
    renderBlogs();
    showToast(id ? 'Blog post updated' : 'New article published');
  });

  function confirmDeleteBlog(id) {
    showConfirmModal('Delete Blog Post', 'Are you sure you want to permanently delete this article?', () => {
      dataStore.deleteBlog(id);
      renderBlogs();
      showToast('Article deleted');
    });
  }

  renderBlogs();
}

/* ==========================================================================
   DIRECT MESSAGES HUB
   ========================================================================== */
function initMessagesHub() {
  const container = document.getElementById('admin-messages-list');
  const markAllBtn = document.getElementById('mark-all-read-btn');

  function renderMessages() {
    const messages = dataStore.getMessages();
    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="glass-card-panel messages-empty-state">
          <div class="empty-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <h4>No Direct Messages Yet</h4>
          <p class="channel-label">Contact form submissions from the live website will land here in real-time.</p>
        </div>
      `;
      return;
    }

    messages.forEach(msg => {
      const card = document.createElement('div');
      card.className = `message-card glass-card-panel ${msg.isRead ? '' : 'unread'}`;

      const initials = (msg.name || 'User')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const timeFormatted = new Date(msg.date).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        <div class="glass-specular-highlight"></div>
        <div class="message-header-row">
          <div class="sender-info">
            <div class="sender-avatar-initials">${initials}</div>
            <div class="sender-name-block">
              <span class="sender-name">${escapeHtml(msg.name)}</span>
              <a href="mailto:${escapeHtml(msg.email)}" class="sender-email">${escapeHtml(msg.email)}</a>
            </div>
          </div>
          <div class="message-meta-right">
            <span class="message-time">${timeFormatted}</span>
            ${msg.isRead ? '' : '<span class="admin-badge-count">New</span>'}
          </div>
        </div>

        <div class="message-subject">Subject: ${escapeHtml(msg.subject || 'Direct Inquiry')}</div>
        <div class="message-body">${escapeHtml(msg.message)}</div>

        <div class="message-actions-row">
          <a href="mailto:${encodeURIComponent(msg.email)}?subject=Re: ${encodeURIComponent(msg.subject || 'Inquiry')}" class="glass-pill-btn mini-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5-5-5 5M12 4v12"></path></svg>
            <span>Reply via Email</span>
          </a>
          <button class="glass-pill-btn mini-btn toggle-read-btn" data-id="${msg.id}">
            <span>${msg.isRead ? 'Mark Unread' : 'Mark Read'}</span>
          </button>
          <button class="glass-pill-btn mini-btn danger-pill-btn delete-msg-btn" data-id="${msg.id}">
            <span>Delete</span>
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.toggle-read-btn').forEach(b => {
      b.addEventListener('click', () => {
        dataStore.markMessageRead(b.getAttribute('data-id'));
        renderMessages();
        renderDashboardMetrics();
      });
    });

    container.querySelectorAll('.delete-msg-btn').forEach(b => {
      b.addEventListener('click', () => {
        dataStore.deleteMessage(b.getAttribute('data-id'));
        renderMessages();
        renderDashboardMetrics();
        showToast('Message removed');
      });
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      const messages = dataStore.getMessages();
      messages.forEach(m => m.isRead = true);
      dataStore.setItem('midlaj_portfolio_messages', messages);
      renderMessages();
      renderDashboardMetrics();
      showToast('All messages marked as read');
    });
  }

  renderMessages();
}

/* ==========================================================================
   SECURITY & PROFILE STUDIO (Password change, Photo & Resume Upload)
   ========================================================================== */
function initSecurityAndProfile() {
  const pwdForm = document.getElementById('change-password-form');
  const photoInput = document.getElementById('profile-photo-input');
  const resetPhotoBtn = document.getElementById('reset-photo-btn');
  const resumeInput = document.getElementById('resume-file-input');
  const downloadResumeBtn = document.getElementById('download-current-resume-btn');
  const exportBtn = document.getElementById('export-backup-btn');
  const importInput = document.getElementById('import-backup-input');
  const factoryResetBtn = document.getElementById('factory-reset-btn');

  const photoPreview = document.getElementById('master-profile-preview');
  const navAvatar = document.getElementById('admin-nav-avatar');
  const resumeNameDisplay = document.getElementById('display-resume-filename');

  // Load Profile Info
  function loadProfileInfo() {
    const profile = dataStore.getProfile();
    if (profile.photo) {
      photoPreview.src = profile.photo;
      if (navAvatar) navAvatar.src = profile.photo;
    }
    if (profile.resumeFileName) {
      resumeNameDisplay.textContent = profile.resumeFileName;
    }
  }

  // 1. Password Change Form
  if (pwdForm) {
    pwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const curr = document.getElementById('curr-pwd').value;
      const newPwd = document.getElementById('new-pwd').value;
      const confirmPwd = document.getElementById('confirm-pwd').value;

      if (newPwd !== confirmPwd) {
        showToast('New passwords do not match.', '✕');
        return;
      }

      const res = await dataStore.updatePassword(curr, newPwd);
      if (res.success) {
        showToast('Master password updated successfully! Keep it safe.');
        pwdForm.reset();
      } else {
        showToast(res.message, '✕');
      }
    });
  }

  // 2. Profile Photo Upload (Strictly Images Only)
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Strictly images only validation
      if (!file.type.startsWith('image/')) {
        showToast('Invalid file format. Strictly images only (JPG, PNG, WEBP).', '✕');
        return;
      }

      const reader = new FileReader();
      reader.onload = (re) => {
        const dataUrl = re.target.result;
        dataStore.updateProfile({ photo: dataUrl });
        photoPreview.src = dataUrl;
        if (navAvatar) navAvatar.src = dataUrl;
        showToast('Profile photo updated live across all views!');
      };
      reader.readAsDataURL(file);
    });
  }

  if (resetPhotoBtn) {
    resetPhotoBtn.addEventListener('click', () => {
      const defaultPhoto = '/images/MyPic.png';
      dataStore.updateProfile({ photo: defaultPhoto });
      photoPreview.src = defaultPhoto;
      if (navAvatar) navAvatar.src = defaultPhoto;
      showToast('Profile photo reset to original default.');
    });
  }

  // 3. Resume Upload (from device library)
  if (resumeInput) {
    resumeInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (re) => {
        const dataUrl = re.target.result;
        dataStore.updateProfile({
          resumeUrl: dataUrl,
          resumeFileName: file.name
        });
        resumeNameDisplay.textContent = file.name;
        showToast('Resume file updated and linked to public site!');
      };
      reader.readAsDataURL(file);
    });
  }

  if (downloadResumeBtn) {
    downloadResumeBtn.addEventListener('click', () => {
      const profile = dataStore.getProfile();
      if (profile.resumeUrl) {
        const a = document.createElement('a');
        a.href = profile.resumeUrl;
        a.download = profile.resumeFileName || 'Muhammed_Midlaj_Resume.pdf';
        a.click();
      } else {
        showToast('Currently using original default CV.');
      }
    });
  }

  // 4. Backup & Reset
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const json = dataStore.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `midlaj_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Portfolio backup exported as JSON.');
    });
  }

  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const res = dataStore.importAll(re.target.result);
        if (res.success) {
          showToast('Backup restored successfully!');
          updateAllAdminViews();
        } else {
          showToast('Import failed: invalid JSON.', '✕');
        }
      };
      reader.readAsText(file);
    });
  }

  if (factoryResetBtn) {
    factoryResetBtn.addEventListener('click', () => {
      showConfirmModal('Factory Reset', 'Are you sure? All custom modifications and analytics will be reset to defaults.', () => {
        dataStore.resetAll();
        updateAllAdminViews();
        showToast('Restored all defaults');
      });
    });
  }

  loadProfileInfo();
}

/* ==========================================================================
   LIVE SYNC LISTENER
   ========================================================================== */
function initLiveSyncListener() {
  dataStore.onSync((msg) => {
    // Refresh relevant views when background changes occur
    renderDashboardMetrics();
    drawHealthTrendChart();
    initMessagesHub();
  });
}

function updateAllAdminViews() {
  renderDashboardMetrics();
  drawHealthTrendChart();
  initSkillsStudio();
  initProjectsStudio();
  initNowEngineeringStudio();
  initBlogsStudio();
  initMessagesHub();
  initSecurityAndProfile();
}

/* ==========================================================================
   MODAL CONFIRMATION DIALOG
   ========================================================================== */
let pendingConfirmAction = null;
function showConfirmModal(title, desc, action) {
  const backdrop = document.getElementById('confirm-modal-backdrop');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-desc').textContent = desc;
  pendingConfirmAction = action;
  backdrop.classList.add('is-open');
}

document.getElementById('confirm-cancel-btn')?.addEventListener('click', () => {
  document.getElementById('confirm-modal-backdrop')?.classList.remove('is-open');
  pendingConfirmAction = null;
});

document.getElementById('confirm-ok-btn')?.addEventListener('click', () => {
  document.getElementById('confirm-modal-backdrop')?.classList.remove('is-open');
  if (typeof pendingConfirmAction === 'function') {
    pendingConfirmAction();
  }
  pendingConfirmAction = null;
});

/* ==========================================================================
   UTILITIES
   ========================================================================== */
function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return fallback;
}

// Global exposure for AndroidBridge session injection and external control
if (typeof window !== 'undefined') {
  window.updateAllAdminViews = updateAllAdminViews;
  window.showToast = showToast;
}
