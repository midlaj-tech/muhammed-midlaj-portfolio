/* ==========================================================================
   PORTFOLIO DATA STORE & SYNCHRONIZATION ENGINE
   Provides persistent storage, live sync, analytics tracking, and content management
   ========================================================================== */

const STORAGE_KEYS = {
  AUTH: 'midlaj_portfolio_auth',
  SESSION: 'midlaj_portfolio_session',
  METRICS: 'midlaj_portfolio_metrics',
  MESSAGES: 'midlaj_portfolio_messages',
  PROFILE: 'midlaj_portfolio_profile',
  NOW_ENGINEERING: 'midlaj_portfolio_now_engineering',
  SKILLS: 'midlaj_portfolio_skills',
  PROJECTS: 'midlaj_portfolio_projects',
  BLOGS: 'midlaj_portfolio_blogs'
};

const SYNC_CHANNEL = 'midlaj_portfolio_sync_channel';
let broadcastChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL);
  }
} catch (e) {
  console.warn('BroadcastChannel not available:', e);
}

// Web Crypto SHA-256 helper for zero plaintext credential exposure
export async function computeSha256(message) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      // Fallback below
    }
  }
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = ((hash << 5) - hash) + message.charCodeAt(i);
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

// Initial Seed Data (Hashed - No plaintext credentials stored or transmitted)
const DEFAULT_AUTH = {
  username: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_USERNAME) || 'Midlaj',
  passwordHash: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_PASSWORD_HASH) || 'ab4e657e3fa9f5e6670e7f5a03b2b998f945234ffa679de4fc0863b72cdfb2b3'
};

const DEFAULT_METRICS = {
  resumeClicks: 0,
  githubClicks: 0,
  linkedinClicks: 0,
  mailClicks: 0,
  phoneClicks: 0,
  whatsappClicks: 0,
  dailyHistory: [
    { date: 'Mon', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
    { date: 'Tue', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
    { date: 'Wed', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
    { date: 'Thu', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
    { date: 'Fri', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
    { date: 'Sat', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
    { date: 'Sun', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 }
  ]
};

const DEFAULT_MESSAGES = [];

const DEFAULT_PROFILE = {
  photo: '/images/MyPic.png',
  resumeUrl: '',
  resumeFileName: 'Muhammed_Midlaj_iOS_Resume.pdf',
  statusText: 'Available for iOS & Full-Stack Roles'
};

const DEFAULT_NOW_ENGINEERING = {
  statusTag: 'NOW ENGINEERING',
  genre: 'Swift / iOS',
  title: 'SolX 2.0 • Golden Hour Architecture',
  thumbnail: '/images/SolX.png',
  link: '#projects'
};

const DEFAULT_SKILLS = [
  {
    id: 'skill-1',
    name: 'Swift & SwiftUI',
    category: 'ios',
    iconType: 'image',
    iconUrl: '/images/Swift.png',
    pill: 'iOS Specialization',
    pillClass: 'active',
    desc: 'Declarative UI architecture, UIKit bridges, CoreLocation, AVFoundation pipelines, Combine reactive streams, and AppKit/macOS foundations.',
    level: 94
  },
  {
    id: 'skill-2',
    name: 'Metal & GPU Shaders',
    category: 'ios hardware',
    iconType: 'svg',
    iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>',
    pill: 'Hardware & GPU',
    pillClass: 'hardware',
    desc: 'Metal Shading Language (MSL), compute pipelines, GPU vertex/fragment shaders, 120Hz ProMotion frame pacing, and liquid glass materials.',
    level: 88
  },
  {
    id: 'skill-3',
    name: 'SwiftData & CoreData',
    category: 'ios core',
    iconType: 'svg',
    iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>',
    pill: 'Architecture',
    pillClass: 'core',
    desc: 'Enterprise persistence: multi-threaded background contexts, schema migrations, NSPersistentCloudKitContainer sync, and faulting optimization.',
    level: 91
  },
  {
    id: 'skill-4',
    name: 'CoreBluetooth & BLE',
    category: 'ios hardware',
    iconType: 'svg',
    iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8l12 8-6 4V4l6 4-12 8"></path></svg>',
    pill: 'Hardware / IoT',
    pillClass: 'hardware',
    desc: 'CBCentral & CBPeripheral managers, GATT characteristic streaming, hardware sensor polling, packet serialization, and fault-tolerant reconnection.',
    level: 87
  },
  {
    id: 'skill-5',
    name: 'Instruments & ARC',
    category: 'ios core',
    iconType: 'svg',
    iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    pill: 'Architecture',
    pillClass: 'core',
    desc: 'Xcode Instruments (Allocations, Leaks, Time Profiler), Retain Cycle isolation, memory graph audits, Swift Concurrency (Actors, Tasks), and 0-lag runtimes.',
    level: 90
  },
  {
    id: 'skill-6',
    name: 'React & Web Ecosystem',
    category: 'web-app',
    iconType: 'image',
    iconUrl: '/images/React.png',
    pill: 'Modern Web',
    pillClass: 'active',
    desc: 'Component-driven frontends with React, Vite tooling, state architecture, responsive hooks, RESTful API consumption, and cross-platform web apps.',
    level: 86
  },
  {
    id: 'skill-7',
    name: 'Python',
    category: 'core',
    iconType: 'image',
    iconUrl: '/images/Python.png',
    pill: 'Core',
    pillClass: 'core',
    desc: 'Scripting, automation tooling, data manipulation, rapid prototyping, and backend API integration with clean, maintainable architecture.',
    level: 85
  },
  {
    id: 'skill-8',
    name: 'C (Systems)',
    category: 'core',
    iconType: 'image',
    iconUrl: '/images/C.png',
    pill: 'Systems',
    pillClass: 'core',
    desc: 'Manual memory management, pointers, bitwise logic, and low-level system structures that build fundamental software engineering muscle.',
    level: 88
  },
  {
    id: 'skill-9',
    name: 'C++',
    category: 'core hardware',
    iconType: 'svg',
    iconSvg: '<span style="font-weight: 800; font-size: 1rem; font-family: monospace;">C++</span>',
    pill: 'Systems / OOP',
    pillClass: 'core',
    desc: 'Object-oriented paradigms, STL algorithms, templates, and high-performance computing principles essential for systems and graphics logic.',
    level: 82
  },
  {
    id: 'skill-10',
    name: 'JavaScript (ES6+)',
    category: 'core web-app',
    iconType: 'image',
    iconUrl: '/images/JavaScript.png',
    pill: 'Web Foundation',
    pillClass: 'modern',
    desc: 'Modern asynchronous JavaScript, closures, DOM manipulation, Web APIs, event loops, and fluid animation controllers.',
    level: 90
  },
  {
    id: 'skill-11',
    name: 'HTML5',
    category: 'core web-app',
    iconType: 'image',
    iconUrl: '/images/HTML5.png',
    pill: 'Semantic',
    pillClass: 'modern',
    desc: 'Semantic document trees, accessibility standards (WCAG/ARIA), Canvas API, viewport scaling, and SEO-optimized structures.',
    level: 94
  },
  {
    id: 'skill-12',
    name: 'CSS3 & Glass',
    category: 'core web-app',
    iconType: 'image',
    iconUrl: '/images/CSS3.png',
    pill: 'Styling',
    pillClass: 'modern',
    desc: 'Apple Liquid Glass styling, backdrop-filter physics, hardware-accelerated transforms, responsive media queries, and design systems.',
    level: 92
  },
  {
    id: 'skill-13',
    name: 'MySQL',
    category: 'core',
    iconType: 'image',
    iconUrl: '/images/MySQL.png',
    pill: 'Database',
    pillClass: 'core',
    desc: 'Relational database design, query optimization, normalization, indexing, transaction integrity, and schema modeling.',
    level: 84
  }
];

const DEFAULT_PROJECTS = [
  {
    id: 'project-solx',
    title: 'SolX',
    subtitle: 'Golden-Hour Photography Companion',
    category: 'ios',
    logoUrl: '/images/SolX.png',
    coverUrl: '/images/solx.jpg',
    desc: 'High-precision iOS golden-hour photography tool. Calculates exact solar ephemeris angles, blue hour countdowns, sun azimuth compass trajectories, and manual shutter settings with tactile haptic feedback.',
    tags: ['Swift', 'SwiftUI', 'CoreLocation', 'AVFoundation'],
    modalId: 'modal-solx',
    liveUrl: '#',
    githubUrl: 'https://github.com/disneymio'
  },
  {
    id: 'project-powerboat-marketing',
    title: 'MMD Marketing App',
    subtitle: 'Luxury Marine Vessel Showcase',
    category: 'ios mobile',
    logoUrl: '/images/MMD.png',
    coverUrl: '/images/powerboat-marketing.jpg',
    desc: 'Native iOS client showcase application for powerboatmarines.com. Interactive luxury vessel fleet visualizer, technical engine specifications, high-knot performance data, and direct sea-trial booking portal.',
    tags: ['Swift', 'WebKit Bridge', 'RESTful API', 'powerboatmarines.com'],
    modalId: 'modal-powerboat-marketing',
    liveUrl: 'https://powerboatmarines.com',
    githubUrl: 'https://github.com/disneymio'
  },
  {
    id: 'project-powerboat-app',
    title: 'Powerboat Marines Mobile',
    subtitle: 'Cross-Platform Fleet & Telemetry',
    category: 'mobile web',
    logoUrl: '/images/MMD.png',
    coverUrl: '/images/powerboat-app.jpg',
    desc: 'Full iOS and Android mobile conversion of powerboatmarines.com. Engineered with responsive liquid navigation, offline vessel spec caching, push notifications for service alerts, and live GPS telemetry feeds.',
    tags: ['Mobile Web App', 'Offline Telemetry', 'REST APIs', 'UI/UX'],
    modalId: 'modal-powerboat-app',
    liveUrl: 'https://powerboatmarines.com',
    githubUrl: 'https://github.com/disneymio'
  },
  {
    id: 'project-brewme',
    title: 'BREWME',
    subtitle: 'The Complete Coffee Shop Solution • Madayipara, Kannur',
    category: 'web',
    logoUrl: '/images/brewme.png',
    coverUrl: '/images/brewme.jpg',
    desc: 'Commercial web platform for BREWME Cafe at Madayipara Eco Park, Kannur. Features dynamic QR table menu with category filters, interactive signature feast platter builder with real-time price multipliers, sensory flavor radar, and mobile-first ordering.',
    tags: ['React 18', 'Tailwind CSS', 'Framer Motion', 'QR Menu System'],
    modalId: 'modal-brewme',
    liveUrl: 'https://brewme-the-complete-coffee-shop-sol.vercel.app',
    githubUrl: 'https://github.com/disneymio'
  },
  {
    id: 'project-aether-audio',
    title: 'Aether Audio',
    subtitle: 'Low-Latency Spatial Audio Engine',
    category: 'ios mobile',
    logoUrl: '/images/Apple.png',
    coverUrl: '/images/ios-engineer-hero.jpg',
    desc: 'Professional 32-bit floating point audio synthesis and DSP architecture built with AVAudioEngine and custom C++ kernels. Features real-time FFT spectrum visualizer and 120Hz Liquid Glass waveform physics.',
    tags: ['Swift', 'AVAudioEngine', 'AudioUnit', 'C++ DSP'],
    modalId: 'modal-project-aether',
    liveUrl: '#',
    githubUrl: 'https://github.com/disneymio'
  }
];

const DEFAULT_BLOGS = [
  {
    id: 'blog-1',
    title: 'Architecting Liquid Glass UI in SwiftUI: Apple Music & Control Center',
    tags: ['#SwiftUI', '#iOS', '#LiquidGlass', '#Metal', '#AppleHIG'],
    coverUrl: '/images/ios-engineer-hero.jpg',
    readTime: '6 min read',
    date: 'Sep 2026',
    author: 'Muhammed Midlaj K',
    modalId: 'modal-blog-liquid-glass',
    excerpt: 'A technical exploration of building multi-layered translucent glass sheets, dynamic ambient color meshes, and specular highlights that sustain 120fps ProMotion fluidity across modern iOS devices.',
    content: `<h3>The Philosophy of Liquid Glass</h3>
<p>Modern iOS design has moved beyond flat skeuomorphism and stark minimalism into dynamic, fluid materials. Apple's modern interfaces feel tangible because they respond with physics rather than linear mathematical interpolations.</p>
<h4>1. Dual-Pass Backdrop Blurring</h4>
<p>To avoid GPU bottlenecks while maintaining 120fps ProMotion fluidity, we isolate blurring passes into dedicated compositor layers using Metal-backed offscreen render targets.</p>`
  },
  {
    id: 'blog-2',
    title: 'Precision Solar Ephemeris in Swift: The Math Powering SolX',
    tags: ['#Swift', '#Algorithms', '#CoreLocation', '#SolarEphemeris', '#SIMD'],
    coverUrl: '/images/solx.jpg',
    readTime: '8 min read',
    date: 'Aug 2026',
    author: 'Muhammed Midlaj K',
    modalId: 'modal-blog-ephemeris',
    excerpt: 'How SolX computes solar elevation, azimuth, and true twilight thresholds entirely on-device using pure astronomical trigonometry without external API dependencies.',
    content: `<h3>Computing Solar Elevation Purely On-Device</h3>
<p>Most weather apps query third-party REST APIs for sunset and golden hour times. When developing SolX, the goal was 100% offline autonomy in remote locations without cellular reception.</p>
<h4>Trigonometric Precision</h4>
<p>By implementing Keplerian orbital calculations directly in Swift, execution takes under 1.2 milliseconds on Apple Silicon.</p>`
  },
  {
    id: 'blog-3',
    title: 'The Agentic iOS Engineer: Antigravity, Claude Code & MCP',
    tags: ['#AI', '#AgenticCoding', '#Antigravity', '#ClaudeCode', '#MCP'],
    coverUrl: '/images/Antigravity.png',
    readTime: '5 min read',
    date: 'Jul 2026',
    author: 'Muhammed Midlaj K',
    modalId: 'modal-blog-agentic-ai',
    excerpt: 'Moving beyond simple autocomplete: how autonomous multi-agent engineering workflows, custom skills, and MCP servers compress multi-day iOS refactors into minutes without sacrificing code quality.',
    content: `<h3>The Shift from Autocomplete to Autonomous Pair Programming</h3>
<p>Generative AI for software development has evolved from simple in-line text completions into fully agentic workflows capable of navigating large codebases, maintaining context, and running compilation checks autonomously.</p>`
  },
  {
    id: 'blog-4',
    title: 'CoreBluetooth & BLE Telemetry: Real-Time Hardware Sensor Streaming',
    tags: ['#CoreBluetooth', '#BLE', '#Hardware', '#IoT', '#Swift'],
    coverUrl: '/images/powerboat-app.jpg',
    readTime: '7 min read',
    date: 'Jun 2026',
    author: 'Muhammed Midlaj K',
    modalId: 'modal-blog-ble',
    excerpt: 'Architecting robust CBCentral and CBPeripheral state machines in Swift to stream telemetry packets over Bluetooth Low Energy with zero packet drop and automated background reconnection.',
    content: `<h3>GATT Streaming Architecture</h3>
<p>Building high-reliability telemetry pipelines requires strict packet framing, serial background queues, and resilient state recovery when physical connections momentarily drop.</p>`
  },
  {
    id: 'blog-5',
    title: 'High-Performance SwiftData: Multi-Threaded Sync & Faulting Optimization',
    tags: ['#SwiftData', '#CoreData', '#Concurrency', '#Architecture', '#iOS'],
    coverUrl: '/images/solx.jpg',
    readTime: '6 min read',
    date: 'May 2026',
    author: 'Muhammed Midlaj K',
    modalId: 'modal-blog-swiftdata',
    excerpt: 'Mastering SwiftData concurrency with ModelActor, optimizing memory graphs with faulting boundaries, and orchestrating seamless background CloudKit synchronizations.',
    content: `<h3>Modern Swift Persistence</h3>
<p>With Swift Concurrency and actors, SwiftData enables thread-safe persistence without manual context merges. We isolate heavy data ingest into isolated background actors while maintaining instantaneous UI responsiveness.</p>`
  }
];

class PortfolioDataStore {
  constructor() {
    this.init();
  }

  init() {
    // Ensure all keys exist in localStorage & auto-migrate legacy plaintext
    const storedAuth = this.getItem(STORAGE_KEYS.AUTH);
    if (!storedAuth) {
      this.setItem(STORAGE_KEYS.AUTH, DEFAULT_AUTH);
    } else if (storedAuth.password && !storedAuth.passwordHash) {
      computeSha256(storedAuth.password).then(hash => {
        this.setItem(STORAGE_KEYS.AUTH, {
          username: storedAuth.username || DEFAULT_AUTH.username,
          passwordHash: hash
        });
      });
    }
    const storedMetrics = this.getItem(STORAGE_KEYS.METRICS);
    if (!storedMetrics || storedMetrics.resumeClicks === 18) {
      this.setItem(STORAGE_KEYS.METRICS, DEFAULT_METRICS);
    } else if (storedMetrics.whatsappClicks === undefined) {
      storedMetrics.whatsappClicks = 0;
      this.setItem(STORAGE_KEYS.METRICS, storedMetrics);
    }
    const storedMessages = this.getItem(STORAGE_KEYS.MESSAGES);
    if (!storedMessages || (Array.isArray(storedMessages) && storedMessages.some(m => m.id === 'msg-seed-1'))) {
      this.setItem(STORAGE_KEYS.MESSAGES, DEFAULT_MESSAGES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      this.setItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOW_ENGINEERING)) {
      this.setItem(STORAGE_KEYS.NOW_ENGINEERING, DEFAULT_NOW_ENGINEERING);
    }

    // Auto-heal & Migrate Skills: Ensure all 13 default skills exist in user storage
    const storedSkills = this.getItem(STORAGE_KEYS.SKILLS);
    if (!storedSkills || !Array.isArray(storedSkills) || storedSkills.length === 0) {
      this.setItem(STORAGE_KEYS.SKILLS, DEFAULT_SKILLS);
    } else {
      const existingIds = new Set(storedSkills.map(s => s.id));
      let modified = false;
      const updatedSkills = [...storedSkills];
      DEFAULT_SKILLS.forEach(defSkill => {
        if (!existingIds.has(defSkill.id)) {
          updatedSkills.push({ ...defSkill });
          existingIds.add(defSkill.id);
          modified = true;
        }
      });
      // Synchronize outdated legacy default titles if present
      const nameMigrations = {
        'Metal & CoreGraphics': 'Metal & GPU Shaders',
        'CoreData & SwiftData': 'SwiftData & CoreData',
        'CoreBluetooth & I/O': 'CoreBluetooth & BLE',
        'Instruments Profiling': 'Instruments & ARC',
        'React.js Ecosystem': 'React & Web Ecosystem',
        'Python 3': 'Python',
        'C Programming': 'C (Systems)',
        'C++ Systems': 'C++'
      };
      updatedSkills.forEach(s => {
        if (nameMigrations[s.name]) {
          s.name = nameMigrations[s.name];
          modified = true;
        }
      });
      if (modified) {
        this.setItem(STORAGE_KEYS.SKILLS, updatedSkills);
      }
    }

    // Auto-heal & Migrate Projects: Ensure all default projects exist
    const storedProjects = this.getItem(STORAGE_KEYS.PROJECTS);
    if (!storedProjects || !Array.isArray(storedProjects) || storedProjects.length === 0) {
      this.setItem(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
    } else {
      const existingIds = new Set(storedProjects.map(p => p.id));
      let modified = false;
      const updatedProjects = [...storedProjects];
      DEFAULT_PROJECTS.forEach(defProj => {
        if (!existingIds.has(defProj.id)) {
          updatedProjects.push({ ...defProj });
          existingIds.add(defProj.id);
          modified = true;
        }
      });
      const projTitleMigrations = {
        'Powerboat Marine Marketing': 'MMD Marketing App',
        'Powerboat Booking App': 'Powerboat Marines Mobile',
        'BrewMe Coffee': 'BREWME'
      };
      updatedProjects.forEach(p => {
        if (projTitleMigrations[p.title]) {
          p.title = projTitleMigrations[p.title];
          modified = true;
        }
        if (p.id === 'project-brewme') {
          if (!p.liveUrl || p.liveUrl === '#' || p.subtitle === 'Specialty Roasters Experience' || !p.tags?.includes('React 18')) {
            p.title = 'BREWME';
            p.subtitle = 'The Complete Coffee Shop Solution • Madayipara, Kannur';
            p.desc = 'Commercial web platform for BREWME Cafe at Madayipara Eco Park, Kannur. Features dynamic QR table menu with category filters, interactive signature feast platter builder with real-time price multipliers, sensory flavor radar, and mobile-first ordering.';
            p.tags = ['React 18', 'Tailwind CSS', 'Framer Motion', 'QR Menu System'];
            p.liveUrl = 'https://brewme-the-complete-coffee-shop-sol.vercel.app';
            modified = true;
          }
        }
      });
      if (modified) {
        this.setItem(STORAGE_KEYS.PROJECTS, updatedProjects);
      }
    }

    // Auto-heal & Migrate Blogs: Ensure all default blogs exist
    const storedBlogs = this.getItem(STORAGE_KEYS.BLOGS);
    if (!storedBlogs || !Array.isArray(storedBlogs) || storedBlogs.length === 0) {
      this.setItem(STORAGE_KEYS.BLOGS, DEFAULT_BLOGS);
    } else {
      const existingIds = new Set(storedBlogs.map(b => b.id));
      let modified = false;
      const updatedBlogs = [...storedBlogs];
      DEFAULT_BLOGS.forEach(defBlog => {
        if (!existingIds.has(defBlog.id)) {
          updatedBlogs.push({ ...defBlog });
          existingIds.add(defBlog.id);
          modified = true;
        }
      });
      const blogTitleMigrations = {
        'Crafting Apple Music Liquid Glass: 120Hz Animation Physics in SwiftUI': 'Architecting Liquid Glass UI in SwiftUI: Apple Music & Control Center',
        'Solar Ephemeris Algorithms: Computing Trigonometric Golden Hours in Swift': 'Precision Solar Ephemeris in Swift: The Math Powering SolX',
        'Autonomous AI Engineering: Compressing Days of iOS Refactoring into Minutes': 'The Agentic iOS Engineer: Antigravity, Claude Code & MCP'
      };
      updatedBlogs.forEach(b => {
        if (blogTitleMigrations[b.title]) {
          b.title = blogTitleMigrations[b.title];
          modified = true;
        }
        if (!b.tags || !Array.isArray(b.tags) || b.tags.length === 0 || b.category) {
          const catMap = {
            swiftui: ['#SwiftUI', '#iOS', '#LiquidGlass', '#Metal', '#AppleHIG'],
            algorithms: ['#Swift', '#Algorithms', '#CoreLocation', '#SolarEphemeris', '#SIMD'],
            ai: ['#AI', '#AgenticCoding', '#Antigravity', '#ClaudeCode', '#MCP']
          };
          b.tags = (b.tags && b.tags.length > 0) ? b.tags : (catMap[b.category] || ['#iOS', '#Swift', '#Mobile']);
          delete b.category;
          modified = true;
        }
      });
      if (modified) {
        this.setItem(STORAGE_KEYS.BLOGS, updatedBlogs);
      }
    }
  }

  getItem(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.broadcast(key, value);
    } catch (e) {
      console.error(`Error writing ${key}:`, e);
    }
  }

  broadcast(key, data) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ key, data, timestamp: Date.now() });
      } catch (e) {
        console.warn('Broadcast failed:', e);
      }
    }
  }

  onSync(callback) {
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', (event) => {
        callback(event.data);
      });
    }
    window.addEventListener('storage', (event) => {
      try {
        callback({ key: event.key, data: JSON.parse(event.newValue), timestamp: Date.now() });
      } catch (e) {}
    });
  }

  // --- AUTHENTICATION (Hashed & Session Inactivity Timeout) ---
  getAuth() {
    return this.getItem(STORAGE_KEYS.AUTH, DEFAULT_AUTH);
  }

  async authenticate(username, password) {
    if (!username || !password) return false;
    const auth = this.getAuth();
    if (username.trim().toLowerCase() !== (auth.username || '').toLowerCase()) {
      return false;
    }

    const inputHash = await computeSha256(password.trim());
    const expectedHash = auth.passwordHash || (auth.password ? await computeSha256(auth.password) : DEFAULT_AUTH.passwordHash);

    if (inputHash === expectedHash) {
      const token = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : ('midlaj_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36));
      const session = {
        token,
        loginTime: Date.now(),
        lastActive: Date.now()
      };
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      return true;
    }
    return false;
  }

  isLoggedIn() {
    try {
      const sessionRaw = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (!sessionRaw) return false;
      const session = JSON.parse(sessionRaw);
      // Auto-expire session after 2 hours (7200000 ms) of inactivity
      const MAX_IDLE = 2 * 60 * 60 * 1000;
      if (Date.now() - (session.lastActive || session.loginTime) > MAX_IDLE) {
        this.logout();
        return false;
      }
      session.lastActive = Date.now();
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      return true;
    } catch (e) {
      return false;
    }
  }

  logout() {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  async updatePassword(currentPassword, newPassword) {
    const auth = this.getAuth();
    const currHash = await computeSha256(currentPassword.trim());
    const expectedHash = auth.passwordHash || (auth.password ? await computeSha256(auth.password) : DEFAULT_AUTH.passwordHash);

    if (currHash !== expectedHash) {
      return { success: false, message: 'Current password does not match.' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters for security.' };
    }
    const newHash = await computeSha256(newPassword.trim());
    auth.passwordHash = newHash;
    delete auth.password; // Ensure plaintext is completely eradicated
    this.setItem(STORAGE_KEYS.AUTH, auth);
    return { success: true, message: 'Master password updated securely!' };
  }

  // --- METRICS / CLICK TRACKING ---
  getMetrics() {
    return this.getItem(STORAGE_KEYS.METRICS, DEFAULT_METRICS);
  }

  resetMetrics() {
    const emptyMetrics = {
      resumeClicks: 0,
      githubClicks: 0,
      linkedinClicks: 0,
      mailClicks: 0,
      phoneClicks: 0,
      whatsappClicks: 0,
      dailyHistory: [
        { date: 'Mon', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
        { date: 'Tue', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
        { date: 'Wed', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
        { date: 'Thu', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
        { date: 'Fri', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
        { date: 'Sat', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 },
        { date: 'Sun', resume: 0, github: 0, linkedin: 0, mail: 0, phone: 0, whatsapp: 0 }
      ]
    };
    this.setItem(STORAGE_KEYS.METRICS, emptyMetrics);
    return emptyMetrics;
  }

  trackClick(metricKey) {
    const metrics = this.getMetrics();
    const keyMap = {
      resume: 'resumeClicks',
      github: 'githubClicks',
      linkedin: 'linkedinClicks',
      mail: 'mailClicks',
      phone: 'phoneClicks',
      whatsapp: 'whatsappClicks'
    };

    const targetKey = keyMap[metricKey] || metricKey;
    if (typeof metrics[targetKey] === 'number') {
      metrics[targetKey] += 1;
      
      // Update today's bucket in daily history
      if (Array.isArray(metrics.dailyHistory) && metrics.dailyHistory.length > 0) {
        const lastDay = metrics.dailyHistory[metrics.dailyHistory.length - 1];
        if (metricKey in lastDay) {
          lastDay[metricKey] += 1;
        }
      }
      this.setItem(STORAGE_KEYS.METRICS, metrics);
    }
  }

  // --- CONTACT FORM MESSAGES ---
  getMessages() {
    return this.getItem(STORAGE_KEYS.MESSAGES, DEFAULT_MESSAGES);
  }

  addMessage(msgData) {
    const messages = this.getMessages();
    const sanitize = (str, maxLen) => {
      if (!str || typeof str !== 'string') return '';
      return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLen);
    };

    const newMsg = {
      id: 'msg-' + Date.now(),
      name: sanitize(msgData.name, 100),
      email: sanitize(msgData.email, 100),
      subject: sanitize(msgData.subject || 'Direct Inquiry', 150),
      message: sanitize(msgData.message, 3000),
      date: new Date().toISOString(),
      isRead: false
    };
    messages.unshift(newMsg);
    // Limit stored messages to 100 entries to prevent storage exhaustion
    if (messages.length > 100) messages.length = 100;
    this.setItem(STORAGE_KEYS.MESSAGES, messages);
    return newMsg;
  }

  markMessageRead(id) {
    const messages = this.getMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.isRead = !msg.isRead;
      this.setItem(STORAGE_KEYS.MESSAGES, messages);
    }
  }

  deleteMessage(id) {
    let messages = this.getMessages();
    messages = messages.filter(m => m.id !== id);
    this.setItem(STORAGE_KEYS.MESSAGES, messages);
  }

  // --- PROFILE (Photo, Resume) ---
  getProfile() {
    return this.getItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  }

  updateProfile(data) {
    const profile = { ...this.getProfile(), ...data };
    this.setItem(STORAGE_KEYS.PROFILE, profile);
    return profile;
  }

  // --- NOW ENGINEERING ---
  getNowEngineering() {
    return this.getItem(STORAGE_KEYS.NOW_ENGINEERING, DEFAULT_NOW_ENGINEERING);
  }

  updateNowEngineering(data) {
    const nowEng = { ...this.getNowEngineering(), ...data };
    this.setItem(STORAGE_KEYS.NOW_ENGINEERING, nowEng);
    return nowEng;
  }

  // --- SKILLS ---
  getSkills() {
    return this.getItem(STORAGE_KEYS.SKILLS, DEFAULT_SKILLS);
  }

  saveSkill(skillData) {
    const skills = this.getSkills();
    if (skillData.id) {
      const idx = skills.findIndex(s => s.id === skillData.id);
      if (idx !== -1) {
        skills[idx] = { ...skills[idx], ...skillData };
      } else {
        skills.push(skillData);
      }
    } else {
      skillData.id = 'skill-' + Date.now();
      skills.push(skillData);
    }
    this.setItem(STORAGE_KEYS.SKILLS, skills);
    return skillData;
  }

  deleteSkill(id) {
    let skills = this.getSkills();
    skills = skills.filter(s => s.id !== id);
    this.setItem(STORAGE_KEYS.SKILLS, skills);
  }

  reorderSkills(skills) {
    this.setItem(STORAGE_KEYS.SKILLS, skills);
    return skills;
  }

  moveSkill(fromIndex, toIndex) {
    const skills = [...this.getSkills()];
    if (fromIndex < 0 || fromIndex >= skills.length || toIndex < 0 || toIndex >= skills.length || fromIndex === toIndex) {
      return skills;
    }
    const [moved] = skills.splice(fromIndex, 1);
    skills.splice(toIndex, 0, moved);
    this.reorderSkills(skills);
    return skills;
  }

  // --- PROJECTS ---
  getProjects() {
    return this.getItem(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
  }

  saveProject(projectData) {
    const projects = this.getProjects();
    if (projectData.id) {
      const idx = projects.findIndex(p => p.id === projectData.id);
      if (idx !== -1) {
        projects[idx] = { ...projects[idx], ...projectData };
      } else {
        projects.push(projectData);
      }
    } else {
      projectData.id = 'project-' + Date.now();
      projects.push(projectData);
    }
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
    return projectData;
  }

  deleteProject(id) {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== id);
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
  }

  reorderProjects(projects) {
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
    return projects;
  }

  moveProject(fromIndex, toIndex) {
    const projects = [...this.getProjects()];
    if (fromIndex < 0 || fromIndex >= projects.length || toIndex < 0 || toIndex >= projects.length || fromIndex === toIndex) {
      return projects;
    }
    const [moved] = projects.splice(fromIndex, 1);
    projects.splice(toIndex, 0, moved);
    this.reorderProjects(projects);
    return projects;
  }

  // --- BLOGS ---
  getBlogs() {
    return this.getItem(STORAGE_KEYS.BLOGS, DEFAULT_BLOGS);
  }

  saveBlog(blogData) {
    const blogs = this.getBlogs();
    if (blogData.id) {
      const idx = blogs.findIndex(b => b.id === blogData.id);
      if (idx !== -1) {
        blogs[idx] = { ...blogs[idx], ...blogData };
      } else {
        blogs.push(blogData);
      }
    } else {
      blogData.id = 'blog-' + Date.now();
      blogs.unshift(blogData);
    }
    this.setItem(STORAGE_KEYS.BLOGS, blogs);
    return blogData;
  }

  deleteBlog(id) {
    let blogs = this.getBlogs();
    blogs = blogs.filter(b => b.id !== id);
    this.setItem(STORAGE_KEYS.BLOGS, blogs);
  }

  reorderBlogs(blogs) {
    this.setItem(STORAGE_KEYS.BLOGS, blogs);
    return blogs;
  }

  moveBlog(fromIndex, toIndex) {
    const blogs = [...this.getBlogs()];
    if (fromIndex < 0 || fromIndex >= blogs.length || toIndex < 0 || toIndex >= blogs.length || fromIndex === toIndex) {
      return blogs;
    }
    const [moved] = blogs.splice(fromIndex, 1);
    blogs.splice(toIndex, 0, moved);
    this.reorderBlogs(blogs);
    return blogs;
  }

  // --- BACKUP & RESET ---
  exportAll() {
    return JSON.stringify({
      // Credentials omitted from export for security
      metrics: this.getMetrics(),
      messages: this.getMessages(),
      profile: this.getProfile(),
      nowEngineering: this.getNowEngineering(),
      skills: this.getSkills(),
      projects: this.getProjects(),
      blogs: this.getBlogs(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      // Notice: auth is intentionally NOT imported from arbitrary JSON files
      if (data.metrics) this.setItem(STORAGE_KEYS.METRICS, data.metrics);
      if (data.messages) this.setItem(STORAGE_KEYS.MESSAGES, data.messages);
      if (data.profile) this.setItem(STORAGE_KEYS.PROFILE, data.profile);
      if (data.nowEngineering) this.setItem(STORAGE_KEYS.NOW_ENGINEERING, data.nowEngineering);
      if (data.skills) this.setItem(STORAGE_KEYS.SKILLS, data.skills);
      if (data.projects) this.setItem(STORAGE_KEYS.PROJECTS, data.projects);
      if (data.blogs) this.setItem(STORAGE_KEYS.BLOGS, data.blogs);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  resetAll() {
    this.setItem(STORAGE_KEYS.AUTH, DEFAULT_AUTH);
    this.setItem(STORAGE_KEYS.METRICS, DEFAULT_METRICS);
    this.setItem(STORAGE_KEYS.MESSAGES, DEFAULT_MESSAGES);
    this.setItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    this.setItem(STORAGE_KEYS.NOW_ENGINEERING, DEFAULT_NOW_ENGINEERING);
    this.setItem(STORAGE_KEYS.SKILLS, DEFAULT_SKILLS);
    this.setItem(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
    this.setItem(STORAGE_KEYS.BLOGS, DEFAULT_BLOGS);
    return true;
  }
}

// Export single instance globally and for ES modules
export const dataStore = new PortfolioDataStore();
if (typeof window !== 'undefined') {
  window.dataStore = dataStore;
}
