#!/usr/bin/env node

/**
 * Eagle Mobile E2E Testing - Report Hub Generator
 *
 * Creates a consolidated dashboard for browsing multiple test sessions.
 * Each test run is appended as a session, viewable from a side navigation.
 *
 * Usage:
 *   node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub
 *   node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Login Flow"
 *   node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --append
 *
 * Options:
 *   --artifacts    Path to Detox artifacts directory
 *   --hub          Path to report hub directory (created if not exists)
 *   --session      Session name (default: timestamp)
 *   --append       Append to existing hub (default behavior if hub exists)
 *   --project      Project name for branding
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};

const artifactsPath = getArg('artifacts') || './e2e/artifacts';
const hubPath = getArg('hub') || './report-hub';
const sessionName = getArg('session') || new Date().toISOString().replace(/[:.]/g, '-');
const projectName = getArg('project') || 'E2E Test Hub';

// Ensure hub directory structure exists
const dataPath = path.join(hubPath, 'data');
const assetsPath = path.join(hubPath, 'assets');
fs.mkdirSync(dataPath, { recursive: true });
fs.mkdirSync(assetsPath, { recursive: true });

console.log(`[Report Hub] Processing artifacts from: ${artifactsPath}`);
console.log(`[Report Hub] Session name: ${sessionName}`);

// Collect test results from artifacts
function collectTestResults(artifactsDir) {
  const results = {
    id: sessionName,
    timestamp: new Date().toISOString(),
    name: sessionName,
    tests: [],
    summary: { total: 0, passed: 0, failed: 0, duration: 0 }
  };

  if (!fs.existsSync(artifactsDir)) {
    console.log(`[Report Hub] No artifacts directory found at ${artifactsDir}`);
    return results;
  }

  // Find all test directories
  const items = fs.readdirSync(artifactsDir);

  for (const item of items) {
    const itemPath = path.join(artifactsDir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      const test = processTestDirectory(item, itemPath, assetsPath);
      if (test) {
        results.tests.push(test);
        results.summary.total++;
        if (test.status === 'passed') results.summary.passed++;
        else results.summary.failed++;
        results.summary.duration += test.duration || 0;
      }
    }
  }

  return results;
}

function processTestDirectory(name, dirPath, assetsDir) {
  const test = {
    id: name,
    name: formatTestName(name),
    status: 'passed',
    duration: 0,
    screenshots: [],
    videos: [],
    logs: []
  };

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const ext = path.extname(file).toLowerCase();

    // Copy assets to hub
    const assetName = `${name}_${file}`;
    const assetDest = path.join(assetsDir, assetName);

    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      fs.copyFileSync(filePath, assetDest);
      test.screenshots.push(assetName);
    } else if (['.mp4', '.mov', '.webm'].includes(ext)) {
      fs.copyFileSync(filePath, assetDest);
      test.videos.push(assetName);
    } else if (['.log', '.txt'].includes(ext)) {
      fs.copyFileSync(filePath, assetDest);
      test.logs.push(assetName);
    }

    // Check for failure indicators
    if (file.includes('fail') || file.includes('error')) {
      test.status = 'failed';
    }
  }

  return test;
}

function formatTestName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Save session data
const sessionData = collectTestResults(artifactsPath);
const sessionFile = path.join(dataPath, `${sessionName}.json`);
fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
console.log(`[Report Hub] Session data saved: ${sessionFile}`);

// Generate hub index.html
function generateHubHTML() {
  // Load all session files
  const sessionFiles = fs.readdirSync(dataPath).filter(f => f.endsWith('.json'));
  const sessions = sessionFiles.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dataPath, f), 'utf-8'));
    return data;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-primary: #0a0a0a;
      --bg-secondary: #141414;
      --bg-tertiary: #1a1a1a;
      --bg-hover: #252525;
      --text-primary: #ffffff;
      --text-secondary: #a0a0a0;
      --text-muted: #666666;
      --border-color: #2a2a2a;
      --accent-green: #22c55e;
      --accent-red: #ef4444;
      --accent-blue: #3b82f6;
      --accent-yellow: #eab308;
      --sidebar-width: 320px;
    }

    [data-theme="light"] {
      --bg-primary: #ffffff;
      --bg-secondary: #f8f8f8;
      --bg-tertiary: #f0f0f0;
      --bg-hover: #e8e8e8;
      --text-primary: #0a0a0a;
      --text-secondary: #666666;
      --text-muted: #999999;
      --border-color: #e0e0e0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-header h1 {
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sidebar-header h1 i { color: var(--accent-blue); }

    .sidebar-stats {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .stat i { width: 14px; height: 14px; }
    .stat.passed i { color: var(--accent-green); }
    .stat.failed i { color: var(--accent-red); }

    .sidebar-search {
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-search input {
      width: 100%;
      padding: 10px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 14px;
    }

    .sidebar-search input::placeholder { color: var(--text-muted); }
    .sidebar-search input:focus { outline: none; border-color: var(--accent-blue); }

    .session-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .session-item {
      padding: 14px;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 8px;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .session-item:hover { background: var(--bg-hover); }
    .session-item.active { background: var(--bg-tertiary); border-color: var(--accent-blue); }

    .session-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .session-name {
      font-weight: 500;
      font-size: 14px;
      line-height: 1.3;
    }

    .session-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 12px;
    }

    .session-status.passed { background: rgba(34, 197, 94, 0.15); color: var(--accent-green); }
    .session-status.failed { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); }

    .session-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .session-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .session-meta i { width: 12px; height: 12px; }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .main-header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .main-header h2 {
      font-size: 16px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border-color);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      transition: all 0.15s ease;
    }

    .btn:hover { background: var(--bg-hover); }
    .btn i { width: 14px; height: 14px; }

    .filter-tabs {
      display: flex;
      gap: 4px;
      padding: 12px 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .filter-tab {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.15s ease;
    }

    .filter-tab:hover { background: var(--bg-tertiary); }
    .filter-tab.active { background: var(--bg-tertiary); color: var(--text-primary); }

    .test-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }

    .test-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .test-item:hover { background: var(--bg-tertiary); }

    .test-status-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 14px;
    }

    .test-status-icon.passed { background: rgba(34, 197, 94, 0.15); color: var(--accent-green); }
    .test-status-icon.failed { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); }

    .test-info { flex: 1; }
    .test-name { font-weight: 500; margin-bottom: 4px; }

    .test-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .test-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .test-assets {
      display: flex;
      gap: 8px;
    }

    .asset-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: var(--bg-tertiary);
      border-radius: 6px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .asset-badge i { width: 12px; height: 12px; }

    /* Detail Panel */
    .detail-panel {
      width: 400px;
      background: var(--bg-secondary);
      border-left: 1px solid var(--border-color);
      display: none;
      flex-direction: column;
    }

    .detail-panel.open { display: flex; }

    .detail-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-header h3 { font-size: 15px; font-weight: 600; }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.15s ease;
    }

    .close-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }

    .detail-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .detail-section {
      margin-bottom: 24px;
    }

    .detail-section-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .video-container {
      border-radius: 10px;
      overflow: hidden;
      background: var(--bg-primary);
    }

    .video-container video {
      width: 100%;
      display: block;
    }

    .screenshot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .screenshot-grid img {
      width: 100%;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.15s ease;
    }

    .screenshot-grid img:hover { transform: scale(1.02); }

    /* Empty State */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .empty-state i { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state p { font-size: 14px; }

    /* Trends Section */
    .trends-section {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
    }

    .trends-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .trend-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 60px;
    }

    .trend-bar {
      flex: 1;
      border-radius: 3px 3px 0 0;
      transition: all 0.15s ease;
      position: relative;
    }

    .trend-bar:hover { opacity: 0.8; }
    .trend-bar.passed { background: var(--accent-green); }
    .trend-bar.failed { background: var(--accent-red); }
    .trend-bar.mixed { background: linear-gradient(to top, var(--accent-red), var(--accent-green)); }

    /* Lightbox */
    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .lightbox.open { display: flex; }
    .lightbox img { max-width: 90%; max-height: 90%; border-radius: 8px; }

    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
    }

    /* Theme Toggle */
    .theme-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.15s ease;
      z-index: 100;
    }

    .theme-toggle:hover { background: var(--bg-hover); color: var(--text-primary); }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1><i data-lucide="layout-dashboard"></i> ${projectName}</h1>
      <div class="sidebar-stats">
        <span class="stat passed"><i data-lucide="check-circle"></i> <span id="total-passed">0</span> passed</span>
        <span class="stat failed"><i data-lucide="x-circle"></i> <span id="total-failed">0</span> failed</span>
      </div>
    </div>

    <div class="sidebar-search">
      <input type="text" placeholder="Search sessions..." id="session-search">
    </div>

    <div class="session-list" id="session-list"></div>

    <div class="trends-section">
      <div class="trends-title">Pass Rate Trend</div>
      <div class="trend-chart" id="trend-chart"></div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <div class="main-header">
      <h2 id="current-session-name">Select a Session</h2>
      <div class="header-actions">
        <button class="btn" onclick="exportReport()">
          <i data-lucide="download"></i> Export
        </button>
        <button class="btn" onclick="refreshData()">
          <i data-lucide="refresh-cw"></i> Refresh
        </button>
      </div>
    </div>

    <div class="filter-tabs">
      <div class="filter-tab active" data-filter="all">All Tests</div>
      <div class="filter-tab" data-filter="passed">Passed</div>
      <div class="filter-tab" data-filter="failed">Failed</div>
    </div>

    <div class="test-list" id="test-list">
      <div class="empty-state">
        <i data-lucide="folder-open"></i>
        <p>Select a session to view tests</p>
      </div>
    </div>
  </main>

  <!-- Detail Panel -->
  <aside class="detail-panel" id="detail-panel">
    <div class="detail-header">
      <h3 id="detail-test-name">Test Details</h3>
      <div class="close-btn" onclick="closeDetailPanel()">
        <i data-lucide="x"></i>
      </div>
    </div>
    <div class="detail-content" id="detail-content"></div>
  </aside>

  <!-- Lightbox -->
  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <div class="lightbox-close"><i data-lucide="x"></i></div>
    <img id="lightbox-img" src="" alt="">
  </div>

  <!-- Theme Toggle -->
  <button class="theme-toggle" onclick="toggleTheme()">
    <i data-lucide="moon" id="theme-icon"></i>
  </button>

  <script>
    // Session data embedded at build time
    const sessions = ${JSON.stringify(sessions)};

    let currentSession = null;
    let currentFilter = 'all';

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      renderSessions();
      renderTrends();
      updateTotalStats();

      // Auto-select first session
      if (sessions.length > 0) {
        selectSession(sessions[0].id);
      }

      // Event listeners
      document.getElementById('session-search').addEventListener('input', filterSessions);
      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => setFilter(tab.dataset.filter));
      });

      // Check system theme preference
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.body.setAttribute('data-theme', 'light');
        updateThemeIcon();
      }
    });

    function renderSessions() {
      const container = document.getElementById('session-list');
      container.innerHTML = sessions.map(session => \`
        <div class="session-item \${currentSession?.id === session.id ? 'active' : ''}"
             onclick="selectSession('\${session.id}')">
          <div class="session-item-header">
            <div class="session-name">\${session.name}</div>
            <div class="session-status \${session.summary.failed > 0 ? 'failed' : 'passed'}">
              <i data-lucide="\${session.summary.failed > 0 ? 'x' : 'check'}"></i>
              \${session.summary.failed > 0 ? session.summary.failed + ' failed' : 'All passed'}
            </div>
          </div>
          <div class="session-meta">
            <span><i data-lucide="calendar"></i> \${formatDate(session.timestamp)}</span>
            <span><i data-lucide="hash"></i> \${session.summary.total} tests</span>
          </div>
        </div>
      \`).join('');
      lucide.createIcons();
    }

    function selectSession(id) {
      currentSession = sessions.find(s => s.id === id);
      renderSessions();
      renderTests();
      document.getElementById('current-session-name').textContent = currentSession.name;
    }

    function renderTests() {
      if (!currentSession) return;

      const container = document.getElementById('test-list');
      let tests = currentSession.tests;

      if (currentFilter !== 'all') {
        tests = tests.filter(t => t.status === currentFilter);
      }

      if (tests.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <p>No tests match the current filter</p>
          </div>
        \`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = tests.map(test => \`
        <div class="test-item" onclick="showTestDetail('\${test.id}')">
          <div class="test-status-icon \${test.status}">
            <i data-lucide="\${test.status === 'passed' ? 'check' : 'x'}"></i>
          </div>
          <div class="test-info">
            <div class="test-name">\${test.name}</div>
            <div class="test-meta">
              <span><i data-lucide="clock"></i> \${test.duration || 0}ms</span>
            </div>
          </div>
          <div class="test-assets">
            \${test.videos.length > 0 ? \`<span class="asset-badge"><i data-lucide="video"></i> \${test.videos.length}</span>\` : ''}
            \${test.screenshots.length > 0 ? \`<span class="asset-badge"><i data-lucide="image"></i> \${test.screenshots.length}</span>\` : ''}
            \${test.logs.length > 0 ? \`<span class="asset-badge"><i data-lucide="file-text"></i> \${test.logs.length}</span>\` : ''}
          </div>
        </div>
      \`).join('');
      lucide.createIcons();
    }

    function showTestDetail(testId) {
      const test = currentSession.tests.find(t => t.id === testId);
      if (!test) return;

      document.getElementById('detail-test-name').textContent = test.name;

      let content = '';

      if (test.videos.length > 0) {
        content += \`
          <div class="detail-section">
            <div class="detail-section-title">Video Recording</div>
            <div class="video-container">
              <video controls src="assets/\${test.videos[0]}"></video>
            </div>
          </div>
        \`;
      }

      if (test.screenshots.length > 0) {
        content += \`
          <div class="detail-section">
            <div class="detail-section-title">Screenshots</div>
            <div class="screenshot-grid">
              \${test.screenshots.map(s => \`<img src="assets/\${s}" onclick="openLightbox('assets/\${s}')">\`).join('')}
            </div>
          </div>
        \`;
      }

      document.getElementById('detail-content').innerHTML = content;
      document.getElementById('detail-panel').classList.add('open');
      lucide.createIcons();
    }

    function closeDetailPanel() {
      document.getElementById('detail-panel').classList.remove('open');
    }

    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
      });
      renderTests();
    }

    function filterSessions(e) {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.session-item').forEach(item => {
        const name = item.querySelector('.session-name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? '' : 'none';
      });
    }

    function renderTrends() {
      const container = document.getElementById('trend-chart');
      const recentSessions = sessions.slice(0, 10).reverse();

      container.innerHTML = recentSessions.map(session => {
        const passRate = session.summary.total > 0
          ? (session.summary.passed / session.summary.total) * 100
          : 100;
        const className = passRate === 100 ? 'passed' : passRate === 0 ? 'failed' : 'mixed';
        return \`<div class="trend-bar \${className}" style="height: \${Math.max(passRate, 5)}%" title="\${session.name}: \${passRate.toFixed(0)}%"></div>\`;
      }).join('');
    }

    function updateTotalStats() {
      let totalPassed = 0, totalFailed = 0;
      sessions.forEach(s => {
        totalPassed += s.summary.passed;
        totalFailed += s.summary.failed;
      });
      document.getElementById('total-passed').textContent = totalPassed;
      document.getElementById('total-failed').textContent = totalFailed;
    }

    function formatDate(isoString) {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function openLightbox(src) {
      event.stopPropagation();
      document.getElementById('lightbox-img').src = src;
      document.getElementById('lightbox').classList.add('open');
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('open');
    }

    function toggleTheme() {
      const body = document.body;
      const isLight = body.getAttribute('data-theme') === 'light';
      body.setAttribute('data-theme', isLight ? 'dark' : 'light');
      updateThemeIcon();
    }

    function updateThemeIcon() {
      const icon = document.getElementById('theme-icon');
      const isLight = document.body.getAttribute('data-theme') === 'light';
      icon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
      lucide.createIcons();
    }

    function exportReport() {
      const dataStr = JSON.stringify(currentSession, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`\${currentSession.name}-report.json\`;
      a.click();
    }

    function refreshData() {
      window.location.reload();
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        closeDetailPanel();
      }
    });
  </script>
</body>
</html>`;
}

// Write hub index.html
const hubIndexPath = path.join(hubPath, 'index.html');
fs.writeFileSync(hubIndexPath, generateHubHTML());

console.log(`[Report Hub] Hub generated: ${hubIndexPath}`);
console.log(`[Report Hub] Total sessions: ${fs.readdirSync(dataPath).filter(f => f.endsWith('.json')).length}`);
console.log(`[Report Hub] Open ${hubIndexPath} in your browser to view the report hub.`);
