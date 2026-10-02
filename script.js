import { dataStore } from './data-store.js';

/**
 * Muhammed Midlaj K — iOS Engineer Portfolio JavaScript
 * Liquid Glass Interaction Engine (iOS Control Center & Apple Music Inspired)
 * High-performance, zero-lag, optimized for Mobile, Tablet, iPad & Desktop
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initAmbientMeshCanvas();
  initScrollNavBehavior();
  initHeroAvatarScrollAnimation();
  initSkillsSegmentedControl();
  initProjectsFilter();
  initBlogFilter();
  initExpandToggles();
  initModalSheets();
  initCopyChannels();
  initContactForm();
  initNowPlayingWidget();
  initMobileMenu();
  initAdminHiddenTrigger();
  initDataSyncWithStore();
  initAnalyticsTracking();
});

/* ==========================================================================
   1. THEME ENGINE (Apple Adaptive Dark/Light + iOS Toggle Switch)
   ========================================================================== */
function initThemeEngine() {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('midlaj_theme_pref');

  function applyTheme(isDark, save = true) {
    toggle.checked = isDark;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      if (save) localStorage.setItem('midlaj_theme_pref', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      if (save) localStorage.setItem('midlaj_theme_pref', 'light');
    }
  }

  // Initial state check
  if (savedTheme) {
    applyTheme(savedTheme === 'dark', false);
  } else {
    applyTheme(colorSchemeQuery.matches, false);
  }

  // iOS Switch Event Handler (instant, zero-lag)
  toggle.addEventListener('change', (e) => {
    applyTheme(e.target.checked, true);
    showToast(e.target.checked ? 'Dark Mode activated' : 'Light Mode activated');
  });

  // Listen for OS system preference changes
  colorSchemeQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('midlaj_theme_pref')) {
      applyTheme(e.matches, false);
    }
  });
}

/* ==========================================================================
   2. DYNAMIC AMBIENT GRADIENT MESH (Apple Music Color Bleed Canvas)
   ========================================================================== */
function initAmbientMeshCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, 150);
  }, { passive: true });

  const particles = [
    { x: width * 0.25, y: height * 0.3, radius: 260, vx: 0.35, vy: 0.25, color: '250, 45, 72' }, // Crimson
    { x: width * 0.75, y: height * 0.35, radius: 290, vx: -0.28, vy: 0.32, color: '0, 210, 211' }, // Cyan
    { x: width * 0.5, y: height * 0.75, radius: 310, vx: 0.25, vy: -0.2, color: '104, 92, 230' },  // Indigo
    { x: width * 0.3, y: height * 0.65, radius: 240, vx: -0.2, vy: -0.25, color: '255, 159, 10' } // Amber
  ];

  let targetMouseX = width / 2;
  let targetMouseY = height / 2;
  let mouseX = width / 2;
  let mouseY = height / 2;
  let isRunning = true;
  let animFrameId;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  }, { passive: true });

  function render() {
    if (!isRunning) return;

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const baseAlpha = isLight ? 0.14 : 0.24;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      p.x += dx * 0.001;
      p.y += dy * 0.001;

      if (p.x < -80 || p.x > width + 80) p.vx *= -1;
      if (p.y < -80 || p.y > height + 80) p.vy *= -1;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(${p.color}, ${baseAlpha})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    animFrameId = requestAnimationFrame(render);
  }

  render();

  window.ambientMeshEngine = {
    pause: () => {
      isRunning = false;
      cancelAnimationFrame(animFrameId);
    },
    resume: () => {
      if (!isRunning) {
        isRunning = true;
        render();
      }
    },
    isPaused: () => !isRunning
  };
}

/* ==========================================================================
   3. ZERO-LAG STICKY FLOATING GLASS NAV & SCROLLSPY
   ========================================================================== */
function initScrollNavBehavior() {
  const nav = document.getElementById('main-nav');
  const condensedTitle = document.getElementById('condensed-active-section');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main > section');

  if (!nav) return;

  const sectionTitles = {
    hero: 'Overview',
    skills: 'Technical Arsenal',
    'modern-tools': 'AI Workflow',
    projects: 'Selected Projects',
    experience: 'Career & Experience',
    blogs: 'Technical Blogs & Insights',
    contact: 'Contact & Connect'
  };

  let isCondensed = false;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY > 50 && !isCondensed) {
          nav.classList.add('is-condensed');
          isCondensed = true;
        } else if (scrollY <= 50 && isCondensed) {
          nav.classList.remove('is-condensed');
          isCondensed = false;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  const observerOptions = {
    root: null,
    rootMargin: '-25% 0px -40% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        if (condensedTitle && sectionTitles[id]) {
          condensedTitle.textContent = sectionTitles[id];
        }
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

/* ==========================================================================
   HERO PHOTO SMOOTH TRANSITION INTO TOP-LEFT CORNER ON SCROLL
   ========================================================================== */
function initHeroAvatarScrollAnimation() {
  const heroAvatar = document.getElementById('hero-profile-avatar');
  const navAvatar = document.getElementById('nav-brand-avatar');
  if (!heroAvatar) return;

  let ticking = false;

  const updateAvatar = () => {
    const scrollY = window.scrollY;
    // Continuous progress between 0 and 180px scroll
    const progress = Math.min(1, Math.max(0, scrollY / 180));
    
    // Smooth continuous glide towards top-left corner
    const moveX = -progress * 34;
    const moveY = -progress * 28;
    const scale = 1 - (progress * 0.2);
    const opacity = 1 - (progress * 0.35);
    
    heroAvatar.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(${scale})`;
    heroAvatar.style.opacity = `${opacity}`;
    
    if (navAvatar) {
      // Nav brand avatar smoothly sharpens as hero photo glides towards the top-left
      navAvatar.style.opacity = `${0.4 + (progress * 0.6)}`;
    }
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateAvatar();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial call on load
  updateAvatar();
}

/* ==========================================================================
   4. TOOLTIP POPUP REMOVED — REPLACED WITH SMOOTH APPLE LIQUID HOVER ZOOM
   ========================================================================== */
function initAppleMiniPopup() {
  // Permanently disabled per design rework: hover tooltips removed site-wide in favor of fluid spring zooming
}

/* ==========================================================================
   5. APPLE SEGMENTED CONTROL (SKILLS FILTER)
   ========================================================================== */
function initSkillsSegmentedControl() {
  const container = document.querySelector('.apple-segmented-control');
  if (!container) return;

  const items = container.querySelectorAll('.seg-item');
  const glider = container.querySelector('.seg-glider');
  const cards = document.querySelectorAll('.skill-card');

  function updateGlider(activeItem) {
    if (!glider || !activeItem) return;
    glider.style.width = `${activeItem.offsetWidth}px`;
    glider.style.transform = `translate3d(${activeItem.offsetLeft - 4}px, 0, 0)`;
  }

  const activeInitial = container.querySelector('.seg-item.active');
  if (activeInitial) {
    setTimeout(() => updateGlider(activeInitial), 60);
  }

  items.forEach((item) => {
    item.addEventListener('click', () => {
      items.forEach((i) => {
        i.classList.remove('active');
        i.setAttribute('aria-selected', 'false');
      });
      item.classList.add('active');
      item.setAttribute('aria-selected', 'true');
      updateGlider(item);

      const filter = item.getAttribute('data-filter');
      cards.forEach((card) => {
        const categories = card.getAttribute('data-category') || '';
        if (filter === 'all' || categories.includes(filter)) {
          card.classList.remove('is-hidden');
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });

  window.addEventListener('resize', () => {
    const current = container.querySelector('.seg-item.active');
    if (current) updateGlider(current);
  }, { passive: true });
}

/* ==========================================================================
   6. PROJECTS CATEGORY FILTER
   ========================================================================== */
function initProjectsFilter() {
  const filterButtons = document.querySelectorAll('#project-filter-group .filter-chip');
  const projectCards = document.querySelectorAll('.project-card');
  const projectsGrid = document.querySelector('.projects-grid');
  const expandBtn = document.getElementById('toggle-all-projects-btn');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      if (filter === 'all') {
        const isExpanded = projectsGrid?.classList.contains('is-expanded');
        projectCards.forEach((card, idx) => {
          card.classList.remove('is-hidden');
          if (idx >= 4 && !isExpanded) {
            card.classList.add('is-extra-hidden');
          } else {
            card.classList.remove('is-extra-hidden');
          }
        });
        if (expandBtn) expandBtn.style.display = projectCards.length > 4 ? 'inline-flex' : 'none';
      } else {
        projectCards.forEach((card) => {
          const cat = card.getAttribute('data-category') || '';
          if (cat.includes(filter)) {
            card.classList.remove('is-hidden');
            card.classList.remove('is-extra-hidden');
          } else {
            card.classList.add('is-hidden');
          }
        });
        if (expandBtn) expandBtn.style.display = 'none';
      }
    });
  });
}

/* ==========================================================================
   6B. BLOGS HASHTAG & TAGS FILTER
   ========================================================================== */
function initBlogFilter() {
  const filterButtons = document.querySelectorAll('#blog-filter-group [data-blog-tag]');
  const blogCards = document.querySelectorAll('.blog-card');
  const blogsGrid = document.querySelector('.blogs-grid');
  const expandBtn = document.getElementById('toggle-all-blogs-btn');
  if (!filterButtons.length || !blogCards.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterTag = (btn.getAttribute('data-blog-tag') || 'all').toLowerCase();

      if (filterTag === 'all') {
        const isExpanded = blogsGrid?.classList.contains('is-expanded');
        blogCards.forEach((card, idx) => {
          card.classList.remove('is-hidden');
          if (idx >= 3 && !isExpanded) {
            card.classList.add('is-extra-hidden');
          } else {
            card.classList.remove('is-extra-hidden');
          }
        });
        if (expandBtn) expandBtn.style.display = blogCards.length > 3 ? 'inline-flex' : 'none';
      } else {
        blogCards.forEach((card) => {
          const cardTags = (card.getAttribute('data-blog-tags') || '').toLowerCase();
          if (cardTags.includes(filterTag)) {
            card.classList.remove('is-hidden');
            card.classList.remove('is-extra-hidden');
          } else {
            card.classList.add('is-hidden');
          }
        });
        if (expandBtn) expandBtn.style.display = 'none';
      }
    });
  });
}

/* ==========================================================================
   6C. EXPAND & VIEW ALL TOGGLES (PROJECTS & BLOGS)
   ========================================================================== */
function initExpandToggles() {
  // 1. Projects Expand Toggle (Limit: First 4 projects)
  const projectsGrid = document.querySelector('.projects-grid');
  const projectCards = document.querySelectorAll('.project-card');
  const toggleProjectsBtn = document.getElementById('toggle-all-projects-btn');

  projectCards.forEach((card, idx) => {
    if (idx >= 4) {
      card.classList.add('is-extra-hidden');
    }
  });

  if (toggleProjectsBtn && projectsGrid) {
    if (projectCards.length <= 4) {
      toggleProjectsBtn.style.display = 'none';
    } else {
      const btnText = toggleProjectsBtn.querySelector('.expand-btn-text');
      toggleProjectsBtn.addEventListener('click', () => {
        const isExpanded = projectsGrid.classList.toggle('is-expanded');
        toggleProjectsBtn.classList.toggle('is-active', isExpanded);
        toggleProjectsBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        if (btnText) {
          btnText.textContent = isExpanded ? 'Show Fewer Projects' : `View All Projects (${projectCards.length})`;
        }
      });
    }
  }

  // 2. Blogs Expand Toggle (Limit: First 3 blogs)
  const blogsGrid = document.querySelector('.blogs-grid');
  const blogCards = document.querySelectorAll('.blog-card');
  const toggleBlogsBtn = document.getElementById('toggle-all-blogs-btn');

  blogCards.forEach((card, idx) => {
    if (idx >= 3) {
      card.classList.add('is-extra-hidden');
    }
  });

  if (toggleBlogsBtn && blogsGrid) {
    if (blogCards.length <= 3) {
      toggleBlogsBtn.style.display = 'none';
    } else {
      const btnText = toggleBlogsBtn.querySelector('.expand-btn-text');
      toggleBlogsBtn.addEventListener('click', () => {
        const isExpanded = blogsGrid.classList.toggle('is-expanded');
        toggleBlogsBtn.classList.toggle('is-active', isExpanded);
        toggleBlogsBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        if (btnText) {
          btnText.textContent = isExpanded ? 'Show Fewer Blogs' : `View More Blogs (${blogCards.length})`;
        }
      });
    }
  }
}

/* ==========================================================================
   7. LIQUID GLASS MODAL SHEETS & OFFICIAL RESUME DOWNLOAD
   ========================================================================== */
export async function downloadOfficialResume() {
  dataStore.trackClick('resume');
  const profile = dataStore.getProfile();
  const fileUrl = (profile && profile.resumeUrl) ? profile.resumeUrl : '/Muhammed_Midlaj_iOS_Resume.pdf';
  const fileName = (profile && profile.resumeFileName) ? profile.resumeFileName : 'Muhammed_Midlaj_iOS_Resume.pdf';

  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error('File not accessible');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    showToast('Official Resume downloaded ✓', '✓');
  } catch (err) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Official Resume downloaded ✓', '✓');
  }
}
window.downloadOfficialResume = downloadOfficialResume;

function initModalSheets() {
  const backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) return;

  const closeButtons = backdrop.querySelectorAll('.modal-close-btn');

  function openModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (!targetModal) return;

    backdrop.querySelectorAll('.glass-modal-sheet').forEach((m) => m.classList.remove('active'));
    targetModal.classList.add('active');
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      backdrop.querySelectorAll('.glass-modal-sheet').forEach((m) => m.classList.remove('active'));
    }, 280);
  }

  document.querySelectorAll('.project-detail-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      openModal(modalId);
    });
  });

  document.querySelectorAll('.blog-read-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const modalId = btn.getAttribute('data-modal');
      openModal(modalId);
    });
  });

  document.querySelectorAll('.blog-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const btn = card.querySelector('.blog-read-btn');
      if (btn) {
        const modalId = btn.getAttribute('data-modal');
        if (modalId) openModal(modalId);
      }
    });
  });

  const storyBtn = document.getElementById('open-story-btn');
  if (storyBtn) {
    storyBtn.addEventListener('click', () => openModal('modal-transition-story'));
  }

  const heroCard = document.getElementById('hero-glass-card');
  if (heroCard) {
    heroCard.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        openModal('modal-transition-story');
      }
    });
  }

  const resumeDownloadBtn = document.getElementById('resume-download-btn');
  if (resumeDownloadBtn) {
    resumeDownloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadOfficialResume();
    });
  }

  const modalDownloadResumeBtn = document.getElementById('modal-download-resume-btn');
  if (modalDownloadResumeBtn) {
    modalDownloadResumeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadOfficialResume();
    });
  }

  const heroResumeTrigger = document.getElementById('hero-resume-trigger');
  if (heroResumeTrigger) {
    heroResumeTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      downloadOfficialResume();
    });
  }

  closeButtons.forEach((btn) => btn.addEventListener('click', closeModal));

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   8. DIRECT CONTACT COPY CHANNELS & TOAST NOTIFICATION
   ========================================================================== */
function initCopyChannels() {
  const emailCard = document.getElementById('copy-email-btn');
  const phoneCard = document.getElementById('copy-phone-btn');

  if (emailCard) {
    emailCard.addEventListener('click', () => {
      const email = 'disney.mio@icloud.com';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
          showToast('Copied to clipboard: disney.mio@icloud.com');
        }).catch(() => {
          showToast('disney.mio@icloud.com');
        });
      } else {
        showToast('disney.mio@icloud.com');
      }
    });
  }

  if (phoneCard) {
    phoneCard.addEventListener('click', () => {
      const phone = '+91 80866 69437';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(phone).then(() => {
          showToast('Copied to clipboard: +91 80866 69437');
        }).catch(() => {
          showToast('+91 80866 69437');
        });
      } else {
        showToast('+91 80866 69437');
      }
    });
  }

  const whatsappCard = document.getElementById('copy-whatsapp-btn');
  if (whatsappCard) {
    whatsappCard.addEventListener('click', (e) => {
      if (e.target.closest('.direct-link-icon')) return;
      const phone = '+91 80866 69437';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(phone).then(() => {
          showToast('Copied to clipboard: +91 80866 69437 (WhatsApp)');
        }).catch(() => {
          showToast('+91 80866 69437');
        });
      } else {
        showToast('+91 80866 69437');
      }
    });
  }
}

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('glass-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.add('is-active');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-active');
  }, 2600);
}

/* ==========================================================================
   9. CONTACT FORM DISPATCH
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const successBanner = document.getElementById('form-success');
  if (!form) return;

  let lastSubmitTime = 0;
  const RATE_LIMIT_MS = 30000; // 30-second cooldown to block rapid spam

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // 1. Anti-spam honeypot check (hidden trap field)
    const honeypot = form.querySelector('#contact-hp');
    if (honeypot && honeypot.value.trim().length > 0) {
      // Bot detected - silently drop submission without logging
      if (successBanner) successBanner.classList.add('is-visible');
      form.reset();
      return;
    }

    // 2. Client-side rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      const remainingSec = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
      showToast(`Please wait ${remainingSec}s before sending another message.`, '⏳');
      return;
    }

    // 3. Extract & sanitize inputs
    const name = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    const subject = form.querySelector('#contact-subject').value.trim() || 'iOS Developer Opportunity';
    const message = form.querySelector('#contact-message').value.trim();

    // 4. Strict input validations
    if (!name || !email || !message) {
      showToast('Please fill out all required fields.', '✕');
      return;
    }

    if (name.length > 100) {
      showToast('Name must be 100 characters or fewer.', '✕');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 100) {
      showToast('Please enter a valid email address.', '✕');
      return;
    }

    if (subject.length > 150) {
      showToast('Subject must be 150 characters or fewer.', '✕');
      return;
    }

    if (message.length < 10) {
      showToast('Message must be at least 10 characters.', '✕');
      return;
    }

    if (message.length > 3000) {
      showToast('Message must be 3,000 characters or fewer.', '✕');
      return;
    }

    lastSubmitTime = now;

    // Persist sanitized message in dataStore for Admin Studio Direct Messages Hub
    dataStore.addMessage({ name, email, subject, message });

    if (successBanner) {
      successBanner.classList.add('is-visible');
    }
    form.reset();
    showToast('Direct message sent to Midlaj!', '✓');
  });
}

/* ==========================================================================
   10. APPLE MUSIC "NOW PLAYING" BOTTOM DOCK
   ========================================================================== */
function initNowPlayingWidget() {
  const pill = document.getElementById('now-playing-pill');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playPauseIcon = document.getElementById('play-pause-icon');

  if (!pill || !playPauseBtn || !playPauseIcon) return;

  let isPlaying = true;

  playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      pill.classList.remove('is-paused');
      playPauseIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      `;
      if (window.ambientMeshEngine) window.ambientMeshEngine.resume();
      showToast('Dynamic ambiance resumed');
    } else {
      pill.classList.add('is-paused');
      playPauseIcon.innerHTML = `
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      `;
      if (window.ambientMeshEngine) window.ambientMeshEngine.pause();
      showToast('Ambiance paused');
    }
  });
}

/* ==========================================================================
   11. MOBILE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   12. HIDDEN TRIPLE-CLICK ADMIN TRIGGER (Top-Left Avatar in Nav Bar)
   ========================================================================== */
function initAdminHiddenTrigger() {
  const navAvatar = document.getElementById('nav-brand-avatar');
  if (!navAvatar) return;

  let clickCount = 0;
  let clickTimer = null;

  navAvatar.addEventListener('click', (e) => {
    clickCount++;

    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 700);
    } else if (clickCount >= 3) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(clickTimer);
      clickCount = 0;

      // Apple developer mode activation visual feedback
      navAvatar.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      navAvatar.style.transform = 'scale(1.25) rotate(10deg)';
      showToast('🔓 Opening Admin Studio...', '');

      setTimeout(() => {
        navAvatar.style.transform = '';
        window.location.href = '/admin.html';
      }, 400);
    }
  });

  // Developer keyboard shortcut: ⌘ + ⌥ + A or Ctrl + Alt + A
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      showToast('🔓 Opening Admin Studio...', '');
      setTimeout(() => {
        window.location.href = '/admin.html';
      }, 300);
    }
  });
}

/* ==========================================================================
   13. DYNAMIC DATA SYNC WITH DATA-STORE (Profile, Now Eng, etc.)
   ========================================================================== */
function initDataSyncWithStore() {
  function applyStoreData() {
    // 1. Profile photo
    const profile = dataStore.getProfile();
    if (profile && profile.photo) {
      const navImg = document.querySelector('#nav-brand-avatar img');
      const heroImg = document.querySelector('#hero-profile-avatar img');
      if (navImg) navImg.src = profile.photo;
      if (heroImg) heroImg.src = profile.photo;
    }

    // 2. "Now Engineering" Dock
    const nowEng = dataStore.getNowEngineering();
    if (nowEng) {
      const thumb = document.querySelector('.player-thumb-img');
      const status = document.querySelector('.player-status-tag');
      const genre = document.querySelector('.player-genre');
      const title = document.querySelector('.player-title');
      if (thumb && nowEng.thumbnail) thumb.src = nowEng.thumbnail;
      if (status && nowEng.statusTag) status.textContent = nowEng.statusTag;
      if (genre && nowEng.genre) genre.textContent = nowEng.genre;
      if (title && nowEng.title) title.textContent = nowEng.title;
    }

    // 3. Skills order & content synchronization
    const skills = dataStore.getSkills();
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid && Array.isArray(skills)) {
      skills.forEach(s => {
        const card = document.getElementById(s.id);
        if (card) {
          const nameEl = card.querySelector('.skill-name');
          const descEl = card.querySelector('.skill-desc');
          const pillEl = card.querySelector('.skill-pill');
          const meterEl = card.querySelector('.meter-bar');
          if (nameEl && s.name) nameEl.textContent = s.name;
          if (descEl && s.desc) descEl.textContent = s.desc;
          if (pillEl && s.pill) pillEl.textContent = s.pill;
          if (meterEl && s.level) meterEl.style.setProperty('--level', `${s.level}%`);

          if (card.parentElement === skillsGrid) {
            skillsGrid.appendChild(card);
          }
        }
      });
    }

    // 4. Projects order & content synchronization
    const projects = dataStore.getProjects();
    const projectsGrid = document.querySelector('.projects-grid');
    if (Array.isArray(projects)) {
      projects.forEach(p => {
        const card = document.getElementById(p.id);
        if (card) {
          const titleEl = card.querySelector('.project-title');
          const subEl = card.querySelector('.project-subtitle-text');
          const imgEl = card.querySelector('.project-img');
          const descEl = card.querySelector('.project-desc');
          if (titleEl && p.title) titleEl.textContent = p.title;
          if (subEl && p.subtitle) subEl.textContent = p.subtitle;
          if (imgEl && p.coverUrl) imgEl.src = p.coverUrl;
          if (descEl && p.desc) descEl.textContent = p.desc;

          if (projectsGrid && card.parentElement === projectsGrid) {
            projectsGrid.appendChild(card);
          }
        }
      });
    }

    // 5. Blogs order & content synchronization
    const blogs = dataStore.getBlogs();
    const blogsGrid = document.querySelector('.blogs-grid');
    if (Array.isArray(blogs)) {
      blogs.forEach(b => {
        const card = document.getElementById(b.id) || 
          (b.modalId ? document.querySelector(`[data-modal="${b.modalId}"]`)?.closest('.blog-card') : null) ||
          document.querySelector(`[data-blog-id="${b.id}"]`) ||
          document.getElementById(`blog-card-${b.id.replace('blog-', '')}`);
        if (card) {
          const titleEl = card.querySelector('.blog-title');
          const excerptEl = card.querySelector('.blog-excerpt');
          const imgEl = card.querySelector('.blog-img');
          const timeEl = card.querySelector('.blog-read-time span');
          if (titleEl && b.title) titleEl.textContent = b.title;
          if (excerptEl && b.excerpt) excerptEl.textContent = b.excerpt;
          if (imgEl && b.coverUrl) imgEl.src = b.coverUrl;
          if (timeEl && b.readTime) timeEl.textContent = b.readTime;

          if (b.tags && Array.isArray(b.tags)) {
            card.setAttribute('data-blog-tags', b.tags.join(' '));
            const tagsContainer = card.querySelector('.blog-tags');
            if (tagsContainer) {
              tagsContainer.innerHTML = b.tags.slice(0, 5).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('');
            }
            const badgeEl = card.querySelector('.blog-overlay-badge .apple-pill-tag');
            if (badgeEl && b.tags[0]) {
              badgeEl.textContent = b.tags[0];
            }
          }

          if (blogsGrid && card.parentElement === blogsGrid) {
            blogsGrid.appendChild(card);
          }
        }
      });
    }
  }

  // Initial apply
  applyStoreData();

  // Listen for real-time background updates from admin tab
  dataStore.onSync(() => {
    applyStoreData();
  });
}

/* ==========================================================================
   14. TELEMETRY & CLICK ANALYTICS TRACKING
   ========================================================================== */
function initAnalyticsTracking() {
  // 1. Resume Download Clicks are handled directly inside downloadOfficialResume() to prevent duplicate counting

  // 2. GitHub Clicks
  document.querySelectorAll('a[href*="github.com"]').forEach(link => {
    link.addEventListener('click', () => {
      dataStore.trackClick('github');
    });
  });

  // 3. LinkedIn Clicks
  document.querySelectorAll('a[href*="linkedin.com"]').forEach(link => {
    link.addEventListener('click', () => {
      dataStore.trackClick('linkedin');
    });
  });

  // 4. Mail Clicks
  const emailBtn = document.getElementById('copy-email-btn');
  if (emailBtn) {
    emailBtn.addEventListener('click', () => dataStore.trackClick('mail'));
  }
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', () => {
      dataStore.trackClick('mail');
    });
  });

  // 5. Phone Clicks
  const phoneBtn = document.getElementById('copy-phone-btn');
  if (phoneBtn) {
    phoneBtn.addEventListener('click', () => dataStore.trackClick('phone'));
  }
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      dataStore.trackClick('phone');
    });
  });

  // 6. WhatsApp Clicks
  const whatsappBtn = document.getElementById('copy-whatsapp-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => dataStore.trackClick('whatsapp'));
  }
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]').forEach(link => {
    link.addEventListener('click', () => {
      dataStore.trackClick('whatsapp');
    });
  });
}

/* ==========================================================================
   UTILITY FUNCTIONS (Sanitization & XSS Prevention)
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

