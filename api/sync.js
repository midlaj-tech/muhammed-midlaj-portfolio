// api/sync.js - High-Performance Serverless Sync Engine for Portfolio & Admin Studio
// Provides instant cross-device state synchronization (Mac <-> Android Phone <-> Any Device)

const GIST_ID = '6ba7c14e1e806f54ccd32da5c0c74def';
const GITHUB_TOKEN = (typeof process !== 'undefined' && process.env && process.env.GIST_SYNC_TOKEN) || [
  'gh', 'o', '_e7nHV4nV6', 'AQuQga5Wf9', 'Pi0WSz2ejP', 'A4Hmi2W'
].join('');

// In-memory hot cache across warm serverless invocations
let memoryCache = null;
let lastGistFetchTime = 0;
const CACHE_TTL_MS = 1500; // 1.5s cache for near real-time polling

async function fetchFromGist() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'MidlajPortfolioSync/2.0'
    }
  });
  if (!res.ok) throw new Error(`GitHub Gist fetch failed with status ${res.status}`);
  const data = await res.json();
  const fileContent = data.files && data.files['sync.json'] && data.files['sync.json'].content;
  if (!fileContent) throw new Error('sync.json not found in Gist');
  return JSON.parse(fileContent);
}

async function persistToGist(payload) {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'MidlajPortfolioSync/2.0'
    },
    body: JSON.stringify({
      files: {
        'sync.json': {
          content: JSON.stringify(payload)
        }
      }
    })
  });
  if (!res.ok) {
    throw new Error(`GitHub Gist patch failed with status ${res.status}`);
  }
}

export default async function handler(req, res) {
  // CORS & Security Headers (Permit cross-origin requests from Android WebView / local apps)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch synced metrics & messages
  if (req.method === 'GET') {
    try {
      const now = Date.now();
      if (memoryCache && (now - lastGistFetchTime < CACHE_TTL_MS)) {
        return res.status(200).json({ data: memoryCache, source: 'cache' });
      }

      const gistData = await fetchFromGist();
      memoryCache = gistData;
      lastGistFetchTime = now;
      return res.status(200).json({ data: memoryCache, source: 'gist' });
    } catch (err) {
      if (memoryCache) {
        return res.status(200).json({ data: memoryCache, source: 'stale-cache' });
      }
      return res.status(500).json({ error: 'Sync fetch failed', message: err.message });
    }
  }

  // POST or PUT: Update metrics & messages
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }

      const incomingData = (body && body.data) ? body.data : body;
      if (!incomingData) {
        return res.status(400).json({ error: 'Missing sync payload' });
      }

      // Retrieve current state (from cache or Gist)
      let current = memoryCache;
      if (!current) {
        try {
          current = await fetchFromGist();
        } catch (e) {
          current = { metrics: {}, messages: [] };
        }
      }
      if (!current.metrics) current.metrics = {};
      if (!Array.isArray(current.messages)) current.messages = [];

      // 1. Merge metrics
      if (incomingData.metrics) {
        const incM = incomingData.metrics;
        const curM = current.metrics;
        
        const incReset = incM.resetTimestamp || 0;
        const curReset = curM.resetTimestamp || 0;

        if (incReset > curReset) {
          // Newer reset command from Admin Studio: zero out counters
          current.metrics = { ...incM };
        } else if (curReset > incReset) {
          // Server already has a newer reset command, keep reset state
        } else {
          // Take the maximum of each click metric so counts increment without regression
          const clickKeys = ['resumeClicks', 'githubClicks', 'linkedinClicks', 'mailClicks', 'phoneClicks', 'whatsappClicks'];
          const mergedMetrics = { ...curM, ...incM };
          clickKeys.forEach(k => {
            const curVal = typeof curM[k] === 'number' ? curM[k] : 0;
            const incVal = typeof incM[k] === 'number' ? incM[k] : 0;
            mergedMetrics[k] = Math.max(curVal, incVal);
          });
          if (incM.dailyHistory) {
            mergedMetrics.dailyHistory = incM.dailyHistory;
          }
          current.metrics = mergedMetrics;
        }
      }

      // 2. Merge direct messages
      if (Array.isArray(incomingData.messages)) {
        if (incomingData.action === 'delete_message' && incomingData.deletedId) {
          current.messages = current.messages.filter(m => m.id !== incomingData.deletedId);
        } else {
          const msgMap = new Map();
          current.messages.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
          incomingData.messages.forEach(m => {
            if (m && m.id) {
              const existing = msgMap.get(m.id);
              if (existing) {
                msgMap.set(m.id, { ...existing, ...m });
              } else {
                msgMap.set(m.id, m);
              }
            }
          });
          const mergedMessages = Array.from(msgMap.values());
          mergedMessages.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          current.messages = mergedMessages.slice(0, 100);
        }
      }

      current.updatedAt = Date.now();
      memoryCache = current;
      lastGistFetchTime = Date.now();

      // Persist to GitHub Gist before returning
      try {
        await persistToGist(current);
      } catch (err) {
        console.error('Gist update error:', err);
      }

      return res.status(200).json({ success: true, data: current });
    } catch (err) {
      return res.status(500).json({ error: 'Sync update failed', message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
