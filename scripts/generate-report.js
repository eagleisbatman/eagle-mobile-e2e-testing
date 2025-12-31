#!/usr/bin/env node
/**
 * Eagle Mobile E2E Testing - Professional HTML Report Generator
 *
 * Generates beautiful, interactive test reports with:
 * - Dark/Light mode toggle with system preference detection
 * - Two-column layout (video + test details)
 * - Modern glassmorphism design
 * - Professional Lucide icons (open-source, MIT license)
 * - Interactive test navigation
 * - Video playback with controls
 * - Screenshot lightbox gallery
 *
 * Icons: This report uses Lucide icons (https://lucide.dev)
 * Lucide is an open-source icon library with MIT license.
 *
 * Usage: node generate-report.js [options]
 *   --artifacts <dir>   Artifacts directory (default: ./artifacts)
 *   --output <dir>      Output directory (default: ./test-reports)
 *   --name <name>       Report file name (default: e2e-test-report)
 *   --project <name>    Project name for header
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  artifactsDir: './artifacts',
  outputDir: './test-reports',
  reportName: 'e2e-test-report',
  projectName: 'Eagle Mobile E2E Tests'
};

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--artifacts' && args[i + 1]) {
    CONFIG.artifactsDir = args[++i];
  } else if (args[i] === '--output' && args[i + 1]) {
    CONFIG.outputDir = args[++i];
  } else if (args[i] === '--name' && args[i + 1]) {
    CONFIG.reportName = args[++i];
  } else if (args[i] === '--project' && args[i + 1]) {
    CONFIG.projectName = args[++i];
  } else if (args[i] === '--help') {
    console.log(`
Eagle Mobile E2E Testing - Report Generator

Usage: node generate-report.js [options]

Options:
  --artifacts <dir>   Artifacts directory (default: ./artifacts)
  --output <dir>      Output directory (default: ./test-reports)
  --name <name>       Report file name (default: e2e-test-report)
  --project <name>    Project name for header
  --help              Show this help message

Icons:
  This report uses Lucide icons (https://lucide.dev)
  Lucide is an open-source icon library licensed under MIT.
`);
    process.exit(0);
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(str).replace(/[&<>"']/g, c => htmlEntities[c]);
}

/**
 * Escape string for use in JavaScript string literals
 */
function escapeJs(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Recursively find files with specific extensions
 */
function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        results.push(...findFiles(fullPath, extensions));
      } else {
        const ext = path.extname(file.name).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dir}: ${err.message}`);
  }
  return results;
}

/**
 * Scan artifacts directory for test results
 */
function scanArtifacts(artifactsDir) {
  const tests = [];

  if (!fs.existsSync(artifactsDir)) {
    console.warn(`Artifacts directory not found: ${artifactsDir}`);
    return tests;
  }

  const videos = findFiles(artifactsDir, ['.mp4', '.mov', '.webm']);
  const screenshots = findFiles(artifactsDir, ['.png', '.jpg', '.jpeg']);
  const logs = findFiles(artifactsDir, ['.log', '.txt']);

  const testMap = new Map();

  const processFile = (filePath, type) => {
    const dir = path.dirname(filePath);
    const testName = path.basename(dir);

    if (!testMap.has(testName)) {
      testMap.set(testName, {
        id: testName.replace(/[^a-zA-Z0-9]/g, '-'),
        name: formatTestName(testName),
        directory: dir,
        videos: [],
        screenshots: [],
        logs: [],
        status: inferStatus(testName, filePath),
        duration: null
      });
    }

    const test = testMap.get(testName);
    if (type === 'video') {
      test.videos.push({ name: path.basename(filePath), path: filePath });
    } else if (type === 'screenshot') {
      test.screenshots.push({ name: path.basename(filePath), path: filePath });
    } else if (type === 'log') {
      test.logs.push({ name: path.basename(filePath), path: filePath });
    }
  };

  videos.forEach(f => processFile(f, 'video'));
  screenshots.forEach(f => processFile(f, 'screenshot'));
  logs.forEach(f => processFile(f, 'log'));

  const resultFiles = findFiles(artifactsDir, ['.json']);
  resultFiles.forEach(jsonPath => {
    if (path.basename(jsonPath) === 'test-result.json') {
      try {
        const result = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const dir = path.dirname(jsonPath);
        const testName = path.basename(dir);

        if (testMap.has(testName)) {
          const test = testMap.get(testName);
          test.status = result.status || test.status;
          test.duration = result.duration;
          test.error = result.error;
          test.steps = result.steps;
        }
      } catch (e) {
        console.warn(`Warning: Could not parse ${jsonPath}: ${e.message}`);
      }
    }
  });

  return Array.from(testMap.values());
}

/**
 * Format test name from directory name
 */
function formatTestName(name) {
  return name
    .replace(/^\d+[-_]/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\.(test|spec)\.(js|ts)$/, '')
    .replace(/^./, c => c.toUpperCase())
    .trim() || 'Test';
}

/**
 * Infer test status from name and file patterns
 */
function inferStatus(name, filePath) {
  const lower = name.toLowerCase();
  const fileName = filePath ? path.basename(filePath).toLowerCase() : '';

  // Check for explicit pass/success indicators
  if (lower.includes('pass') || lower.includes('success')) {
    return 'passed';
  }

  // More specific failure detection patterns
  if (fileName.startsWith('fail') ||
      fileName.includes('.fail.') ||
      fileName.includes('_fail_') ||
      fileName.includes('-fail-') ||
      fileName.endsWith('-failed.png') ||
      fileName.endsWith('-error.png')) {
    return 'failed';
  }

  // Check directory name for failure patterns
  if (lower.startsWith('fail') ||
      lower.includes('-fail-') ||
      lower.includes('_fail_') ||
      lower.endsWith('-failed')) {
    return 'failed';
  }

  return 'unknown';
}

/**
 * Format duration in human readable form
 */
function formatDuration(ms) {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Generate the HTML report with Lucide icons
 */
function generateHTML(tests, config) {
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const total = tests.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const timestamp = new Date().toLocaleString();

  // Escape project name for HTML
  const safeProjectName = escapeHtml(config.projectName);

  const generateTestItem = (test, index) => `
    <div class="test-item ${index === 0 ? 'active' : ''}" data-index="${index}" data-status="${escapeHtml(test.status)}" onclick="selectTest(${index})">
      <div class="test-item-header">
        <div class="test-status ${escapeHtml(test.status)}"></div>
        <div class="test-name">${escapeHtml(test.name)}</div>
      </div>
      <div class="test-meta">
        ${test.duration ? `<span><i data-lucide="clock" class="icon-sm"></i> ${escapeHtml(formatDuration(test.duration))}</span>` : ''}
        ${test.videos.length > 0 ? `<span><i data-lucide="video" class="icon-sm"></i> ${test.videos.length}</span>` : ''}
        ${test.screenshots.length > 0 ? `<span><i data-lucide="camera" class="icon-sm"></i> ${test.screenshots.length}</span>` : ''}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeProjectName} - Test Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <!-- Lucide Icons - Open Source (MIT License) - https://lucide.dev -->
  <script src="https://unpkg.com/lucide@0.263.1/dist/umd/lucide.min.js"></script>
  <style>
    :root {
      --bg-primary: #f8fafc;
      --bg-secondary: #ffffff;
      --bg-tertiary: #f1f5f9;
      --bg-glass: rgba(255, 255, 255, 0.85);
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --border-color: rgba(0, 0, 0, 0.08);
      --border-glass: rgba(255, 255, 255, 0.4);
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.12);
      --accent-primary: #6366f1;
      --accent-secondary: #8b5cf6;
      --accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.12);
      --error: #ef4444;
      --error-bg: rgba(239, 68, 68, 0.12);
      --warning: #f59e0b;
      --warning-bg: rgba(245, 158, 11, 0.12);
    }

    [data-theme="dark"] {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --bg-glass: rgba(30, 41, 59, 0.85);
      --text-primary: #f1f5f9;
      --text-secondary: #cbd5e1;
      --text-muted: #64748b;
      --border-color: rgba(255, 255, 255, 0.08);
      --border-glass: rgba(255, 255, 255, 0.12);
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.6);
      --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.5);
      --success-bg: rgba(16, 185, 129, 0.18);
      --error-bg: rgba(239, 68, 68, 0.18);
      --warning-bg: rgba(245, 158, 11, 0.18);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      transition: background-color 0.3s ease, color 0.3s ease;
      line-height: 1.6;
    }

    /* Lucide icon styling */
    .icon-sm { width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px; }
    .icon-md { width: 18px; height: 18px; vertical-align: -3px; margin-right: 6px; }
    .icon-lg { width: 24px; height: 24px; vertical-align: -5px; margin-right: 8px; }
    .icon-xl { width: 32px; height: 32px; }

    .bg-gradient {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background:
        radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 1.5rem;
      position: relative;
      z-index: 1;
    }

    .header {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 1.5rem 2rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-glass);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-icon {
      width: 52px;
      height: 52px;
      background: var(--accent-gradient);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .logo-text h1 {
      font-size: 1.5rem;
      font-weight: 700;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .logo-text p {
      font-size: 0.875rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .theme-toggle {
      position: relative;
      width: 68px;
      height: 34px;
      background: var(--bg-tertiary);
      border-radius: 17px;
      cursor: pointer;
      transition: background 0.3s ease;
      border: 1px solid var(--border-color);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
    }

    .theme-toggle::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 28px;
      height: 28px;
      background: var(--accent-gradient);
      border-radius: 50%;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
      z-index: 1;
    }

    [data-theme="dark"] .theme-toggle::before {
      transform: translateX(34px);
    }

    .theme-toggle .icon {
      color: var(--text-muted);
      transition: opacity 0.3s ease;
      z-index: 0;
    }

    .theme-toggle .icon-sun { opacity: 1; }
    .theme-toggle .icon-moon { opacity: 0.4; }
    [data-theme="dark"] .theme-toggle .icon-sun { opacity: 0.4; }
    [data-theme="dark"] .theme-toggle .icon-moon { opacity: 1; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid var(--border-color);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--accent-gradient);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-card:hover::before { opacity: 1; }

    .stat-card .label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-card .value {
      font-size: 2rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: -0.02em;
    }

    .stat-card.passed .value { color: var(--success); }
    .stat-card.failed .value { color: var(--error); }
    .stat-card.total .value { background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-card.rate .value { color: var(--accent-primary); }

    .main-content {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 1.5rem;
      min-height: calc(100vh - 280px);
    }

    .test-list-container {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 1.25rem;
      box-shadow: var(--shadow-glass);
      max-height: calc(100vh - 180px);
      overflow-y: auto;
      position: sticky;
      top: 1.5rem;
    }

    .test-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .test-list-header h2 {
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-buttons {
      display: flex;
      gap: 0.375rem;
    }

    .filter-btn {
      padding: 0.375rem 0.625rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 0.7rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-btn:hover {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .filter-btn.active {
      background: var(--accent-primary);
      color: white;
      border-color: var(--accent-primary);
    }

    .test-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .test-item {
      padding: 1rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      background: var(--bg-secondary);
    }

    .test-item:hover {
      border-color: var(--accent-primary);
      transform: translateX(4px);
    }

    .test-item.active {
      border-color: var(--accent-primary);
      background: var(--accent-primary);
      color: white;
    }

    .test-item.active .test-status { opacity: 0.9; box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
    .test-item.active .test-meta { color: rgba(255,255,255,0.75); }

    .test-item-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .test-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 3px var(--bg-secondary);
    }

    .test-status.passed { background: var(--success); }
    .test-status.failed { background: var(--error); }
    .test-status.unknown { background: var(--warning); }

    .test-name {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .test-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      gap: 0.75rem;
    }

    .test-meta span {
      display: flex;
      align-items: center;
    }

    .detail-panel {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: var(--shadow-glass);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .detail-title h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      letter-spacing: -0.01em;
    }

    .detail-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge {
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge.passed { background: var(--success-bg); color: var(--success); }
    .badge.failed { background: var(--error-bg); color: var(--error); }
    .badge.unknown { background: var(--warning-bg); color: var(--warning); }
    .badge.duration { background: var(--bg-tertiary); color: var(--text-secondary); text-transform: none; }

    .video-container {
      position: relative;
      background: #000;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 1.5rem;
      aspect-ratio: 16/9;
      box-shadow: var(--shadow-lg);
    }

    .video-container video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .no-video {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #64748b;
      gap: 1rem;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .no-video-icon {
      opacity: 0.3;
    }

    .no-video p {
      font-size: 0.875rem;
      opacity: 0.6;
    }

    .screenshots-section { margin-bottom: 1.5rem; }

    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
    }

    .screenshots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .screenshot-item {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid var(--border-color);
      aspect-ratio: 9/16;
    }

    .screenshot-item:hover {
      transform: scale(1.03);
      box-shadow: var(--shadow-md);
    }

    .screenshot-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .screenshot-item .screenshot-name {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 2rem 0.5rem 0.5rem;
      font-size: 0.65rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .error-section {
      background: var(--error-bg);
      border: 1px solid var(--error);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }

    .error-title {
      color: var(--error);
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .error-message {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .steps-section { margin-bottom: 1.5rem; }

    .steps-timeline {
      position: relative;
      padding-left: 1.75rem;
    }

    .steps-timeline::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 4px;
      bottom: 4px;
      width: 2px;
      background: var(--border-color);
      border-radius: 1px;
    }

    .step-item {
      position: relative;
      padding-bottom: 1rem;
    }

    .step-item:last-child { padding-bottom: 0; }

    .step-item::before {
      content: '';
      position: absolute;
      left: -1.75rem;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent-primary);
      border: 2px solid var(--bg-secondary);
      box-shadow: var(--shadow-sm);
    }

    .step-item.success::before { background: var(--success); }
    .step-item.error::before { background: var(--error); }

    .step-action {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }

    .step-detail {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .logs-section { margin-bottom: 1.5rem; }

    .logs-content {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 1rem;
      max-height: 250px;
      overflow-y: auto;
    }

    .log-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      white-space: pre-wrap;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 350px;
      text-align: center;
      color: var(--text-muted);
    }

    .empty-state-icon {
      margin-bottom: 1rem;
      opacity: 0.4;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    .empty-state p { font-size: 0.875rem; }

    .lightbox {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.92);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      cursor: pointer;
      backdrop-filter: blur(8px);
    }

    .lightbox.active { display: flex; }

    .lightbox img {
      max-width: 90%;
      max-height: 90%;
      border-radius: 12px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }

    .lightbox-close {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .lightbox-close:hover { background: rgba(255,255,255,0.2); }

    .footer {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .footer a {
      color: var(--accent-primary);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .footer a:hover {
      color: var(--accent-secondary);
      text-decoration: underline;
    }

    .footer .divider { margin: 0 0.5rem; opacity: 0.5; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-tertiary); border-radius: 3px; }
    ::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }

    @media (max-width: 1200px) {
      .main-content { grid-template-columns: 1fr; }
      .test-list-container { position: static; max-height: 350px; }
    }

    @media (max-width: 768px) {
      .container { padding: 1rem; }
      .header { padding: 1.25rem; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .header-top { flex-direction: column; gap: 1rem; align-items: flex-start; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .filter-buttons { flex-wrap: wrap; }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .test-item { animation: slideIn 0.3s ease forwards; opacity: 0; }
    .stat-card { animation: fadeIn 0.5s ease forwards; }

    ${Array.from({ length: 10 }, (_, i) => `.test-item:nth-child(${i + 1}) { animation-delay: ${i * 0.05}s; }`).join('\n    ')}
  </style>
</head>
<body>
  <div class="bg-gradient"></div>

  <div class="container">
    <header class="header">
      <div class="header-top">
        <div class="logo">
          <div class="logo-icon">
            <i data-lucide="bird" class="icon-xl"></i>
          </div>
          <div class="logo-text">
            <h1>${safeProjectName}</h1>
            <p><i data-lucide="calendar" class="icon-sm"></i> ${escapeHtml(timestamp)}</p>
          </div>
        </div>
        <div class="theme-toggle" onclick="toggleTheme()" title="Toggle dark/light mode" role="button" tabindex="0">
          <i data-lucide="sun" class="icon icon-sun icon-sm"></i>
          <i data-lucide="moon" class="icon icon-moon icon-sm"></i>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card total">
          <div class="label"><i data-lucide="layers" class="icon-sm"></i> Total Tests</div>
          <div class="value">${total}</div>
        </div>
        <div class="stat-card passed">
          <div class="label"><i data-lucide="check-circle" class="icon-sm"></i> Passed</div>
          <div class="value">${passed}</div>
        </div>
        <div class="stat-card failed">
          <div class="label"><i data-lucide="x-circle" class="icon-sm"></i> Failed</div>
          <div class="value">${failed}</div>
        </div>
        <div class="stat-card rate">
          <div class="label"><i data-lucide="percent" class="icon-sm"></i> Pass Rate</div>
          <div class="value">${passRate}%</div>
        </div>
      </div>
    </header>

    <div class="main-content">
      <aside class="test-list-container">
        <div class="test-list-header">
          <h2><i data-lucide="list" class="icon-md"></i> Test Results</h2>
          <div class="filter-buttons">
            <button class="filter-btn active" onclick="filterTests('all', this)">All</button>
            <button class="filter-btn" onclick="filterTests('passed', this)"><i data-lucide="check" class="icon-sm"></i> Passed</button>
            <button class="filter-btn" onclick="filterTests('failed', this)"><i data-lucide="x" class="icon-sm"></i> Failed</button>
          </div>
        </div>
        <div class="test-list" id="testList">
          ${tests.length > 0 ? tests.map((test, index) => generateTestItem(test, index)).join('') : `
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="inbox" style="width:64px;height:64px;"></i></div>
              <h3>No Tests Found</h3>
              <p>Run your Detox tests to generate artifacts</p>
            </div>
          `}
        </div>
      </aside>

      <main class="detail-panel" id="detailPanel">
        ${tests.length > 0 ? generateDetailPanel(tests[0]) : `
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="search" style="width:64px;height:64px;"></i></div>
            <h3>No Test Selected</h3>
            <p>Run tests and select one from the list to view details</p>
          </div>
        `}
      </main>
    </div>

    <footer class="footer">
      <p>
        Made with care by <a href="https://www.linkedin.com/in/gautammandewalker" target="_blank" rel="noopener">Gautam Mandewalker</a>
        <span class="divider">|</span>
        <a href="https://github.com/eagleisbatman/eagle-mobile-e2e-testing" target="_blank" rel="noopener">Eagle Mobile E2E Testing</a>
        <span class="divider">|</span>
        Icons by <a href="https://lucide.dev" target="_blank" rel="noopener">Lucide</a>
      </p>
    </footer>
  </div>

  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <div class="lightbox-close" onclick="closeLightbox()">
      <i data-lucide="x" class="icon-lg"></i>
    </div>
    <img id="lightboxImage" src="" alt="Screenshot">
  </div>

  <script>
    // Escape HTML utility
    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    const testsData = ${JSON.stringify(tests.map(t => ({
      ...t,
      name: t.name,
      error: t.error,
      videos: t.videos.map(v => ({ name: v.name })),
      screenshots: t.screenshots.map(s => ({ name: s.name })),
      steps: t.steps
    })), null, 2)};

    let currentTestIndex = 0;

    function toggleTheme() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('eagle-report-theme', newTheme);
    }

    (function initTheme() {
      const savedTheme = localStorage.getItem('eagle-report-theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('eagle-report-theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });

    function formatDuration(ms) {
      if (!ms) return '';
      if (ms < 1000) return ms + 'ms';
      if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
      return (ms / 60000).toFixed(1) + 'm';
    }

    function filterTests(status, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.test-item').forEach(item => {
        const itemStatus = item.getAttribute('data-status');
        item.style.display = (status === 'all' || itemStatus === status) ? 'block' : 'none';
      });
    }

    function selectTest(index) {
      currentTestIndex = index;
      document.querySelectorAll('.test-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
      });
      const detailPanel = document.getElementById('detailPanel');
      detailPanel.innerHTML = generateDetailHTML(testsData[index]);
      lucide.createIcons();
    }

    function generateDetailHTML(test) {
      if (!test) {
        return '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="search" style="width:64px;height:64px;"></i></div><h3>Select a Test</h3><p>Choose a test from the list</p></div>';
      }

      const safeName = escapeHtml(test.name);
      const safeStatus = escapeHtml(test.status);
      const safeError = escapeHtml(test.error);

      let html = \`
        <div class="detail-header">
          <div class="detail-title">
            <h2>\${safeName}</h2>
            <div class="detail-badges">
              <span class="badge \${safeStatus}">
                <i data-lucide="\${test.status === 'passed' ? 'check-circle' : test.status === 'failed' ? 'x-circle' : 'alert-circle'}" class="icon-sm"></i>
                \${safeStatus.toUpperCase()}
              </span>
              \${test.duration ? \`<span class="badge duration"><i data-lucide="clock" class="icon-sm"></i> \${formatDuration(test.duration)}</span>\` : ''}
            </div>
          </div>
        </div>

        <div class="video-container">
          \${test.videos && test.videos.length > 0 ? \`
            <video controls autoplay loop muted playsinline>
              <source src="\${encodeURIComponent(test.videos[0].name)}" type="video/mp4">
              Video playback not supported
            </video>
          \` : \`
            <div class="no-video">
              <div class="no-video-icon"><i data-lucide="video-off" style="width:64px;height:64px;"></i></div>
              <p>No video recording available</p>
            </div>
          \`}
        </div>
      \`;

      if (test.error) {
        html += \`
          <div class="error-section">
            <div class="error-title"><i data-lucide="alert-triangle" class="icon-md"></i> Error Details</div>
            <div class="error-message">\${safeError}</div>
          </div>
        \`;
      }

      if (test.screenshots && test.screenshots.length > 0) {
        html += \`
          <div class="screenshots-section">
            <div class="section-title"><i data-lucide="image" class="icon-md"></i> Screenshots (\${test.screenshots.length})</div>
            <div class="screenshots-grid">
              \${test.screenshots.map(s => \`
                <div class="screenshot-item" onclick="openLightbox('\${encodeURIComponent(s.name)}')">
                  <img src="\${encodeURIComponent(s.name)}" alt="\${escapeHtml(s.name)}" loading="lazy">
                  <div class="screenshot-name">\${escapeHtml(s.name)}</div>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      if (test.steps && test.steps.length > 0) {
        html += \`
          <div class="steps-section">
            <div class="section-title"><i data-lucide="list-checks" class="icon-md"></i> Test Steps</div>
            <div class="steps-timeline">
              \${test.steps.map(step => \`
                <div class="step-item \${escapeHtml(step.status || 'success')}">
                  <div class="step-action">\${escapeHtml(step.action)}</div>
                  \${step.detail ? \`<div class="step-detail">\${escapeHtml(step.detail)}</div>\` : ''}
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      return html;
    }

    function openLightbox(src) {
      const img = document.getElementById('lightboxImage');
      img.src = decodeURIComponent(src);
      document.getElementById('lightbox').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (document.getElementById('lightbox').classList.contains('active')) return;
      if (e.key === 'ArrowUp' || e.key === 'k') {
        if (currentTestIndex > 0) selectTest(currentTestIndex - 1);
        e.preventDefault();
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        if (currentTestIndex < testsData.length - 1) selectTest(currentTestIndex + 1);
        e.preventDefault();
      }
    });

    document.querySelector('.theme-toggle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        toggleTheme();
        e.preventDefault();
      }
    });

    // Initialize Lucide icons
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
    });
  </script>
</body>
</html>`;
}

/**
 * Generate detail panel HTML for initial render
 */
function generateDetailPanel(test) {
  if (!test) return '';

  const safeName = escapeHtml(test.name);
  const safeStatus = escapeHtml(test.status);
  const safeError = escapeHtml(test.error);

  let html = `
    <div class="detail-header">
      <div class="detail-title">
        <h2>${safeName}</h2>
        <div class="detail-badges">
          <span class="badge ${safeStatus}">
            <i data-lucide="${test.status === 'passed' ? 'check-circle' : test.status === 'failed' ? 'x-circle' : 'alert-circle'}" class="icon-sm"></i>
            ${safeStatus.toUpperCase()}
          </span>
          ${test.duration ? `<span class="badge duration"><i data-lucide="clock" class="icon-sm"></i> ${escapeHtml(formatDuration(test.duration))}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="video-container">
      ${test.videos && test.videos.length > 0 ? `
        <video controls autoplay loop muted playsinline>
          <source src="${encodeURIComponent(path.basename(test.videos[0].path))}" type="video/mp4">
          Video playback not supported
        </video>
      ` : `
        <div class="no-video">
          <div class="no-video-icon"><i data-lucide="video-off" style="width:64px;height:64px;"></i></div>
          <p>No video recording available</p>
        </div>
      `}
    </div>
  `;

  if (test.error) {
    html += `
      <div class="error-section">
        <div class="error-title"><i data-lucide="alert-triangle" class="icon-md"></i> Error Details</div>
        <div class="error-message">${safeError}</div>
      </div>
    `;
  }

  if (test.screenshots && test.screenshots.length > 0) {
    html += `
      <div class="screenshots-section">
        <div class="section-title"><i data-lucide="image" class="icon-md"></i> Screenshots (${test.screenshots.length})</div>
        <div class="screenshots-grid">
          ${test.screenshots.map(s => `
            <div class="screenshot-item" onclick="openLightbox('${encodeURIComponent(path.basename(s.path))}')">
              <img src="${encodeURIComponent(path.basename(s.path))}" alt="${escapeHtml(s.name)}" loading="lazy">
              <div class="screenshot-name">${escapeHtml(s.name)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (test.steps && test.steps.length > 0) {
    html += `
      <div class="steps-section">
        <div class="section-title"><i data-lucide="list-checks" class="icon-md"></i> Test Steps</div>
        <div class="steps-timeline">
          ${test.steps.map(step => `
            <div class="step-item ${escapeHtml(step.status || 'success')}">
              <div class="step-action">${escapeHtml(step.action)}</div>
              ${step.detail ? `<div class="step-detail">${escapeHtml(step.detail)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return html;
}

/**
 * Main execution
 */
function main() {
  console.log('');
  console.log('Eagle Mobile E2E Testing - Report Generator');
  console.log('─'.repeat(50));
  console.log(`Artifacts:  ${CONFIG.artifactsDir}`);
  console.log(`Output:     ${CONFIG.outputDir}/${CONFIG.reportName}.html`);
  console.log(`Project:    ${CONFIG.projectName}`);
  console.log(`Icons:      Lucide (https://lucide.dev) - MIT License`);
  console.log('');

  try {
    const tests = scanArtifacts(CONFIG.artifactsDir);
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;

    console.log(`Found ${tests.length} test(s)`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log('');

    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const html = generateHTML(tests, CONFIG);
    const outputPath = path.join(CONFIG.outputDir, `${CONFIG.reportName}.html`);
    fs.writeFileSync(outputPath, html);

    console.log(`Report generated successfully!`);
    console.log('');
    console.log(`Open in browser:`);
    console.log(`  file://${path.resolve(outputPath)}`);
    console.log('');
    console.log('Tip: Use --help for all options');
    console.log('');
  } catch (err) {
    console.error(`Error generating report: ${err.message}`);
    process.exit(1);
  }
}

main();
