#!/usr/bin/env node
/**
 * Eagle Mobile E2E Testing - Modern HTML Report Generator
 *
 * Generates beautiful, interactive test reports with:
 * - Dark/Light mode toggle with system preference detection
 * - Two-column layout (video + test details)
 * - Modern glassmorphism design
 * - Interactive test navigation
 * - Video playback with controls
 * - Screenshot lightbox gallery
 * - Animated statistics
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
`);
    process.exit(0);
  }
}

/**
 * Recursively find files with specific extensions
 */
function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

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

  // Find all videos and group by test
  const videos = findFiles(artifactsDir, ['.mp4', '.mov', '.webm']);
  const screenshots = findFiles(artifactsDir, ['.png', '.jpg', '.jpeg']);
  const logs = findFiles(artifactsDir, ['.log', '.txt']);

  // Group files by parent directory (test name)
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
        status: inferStatus(testName),
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

  // Also check for test-result.json files
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
        // Ignore parse errors
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
 * Infer test status from name
 */
function inferStatus(name) {
  const lower = name.toLowerCase();
  if (lower.includes('pass') || lower.includes('success') || lower.includes('✓')) {
    return 'passed';
  }
  if (lower.includes('fail') || lower.includes('error') || lower.includes('✗')) {
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
 * Convert file path to data URI for embedding
 */
function fileToDataUri(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    const mime = mimeTypes[ext] || 'application/octet-stream';
    const data = fs.readFileSync(filePath);
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch (e) {
    return null;
  }
}

/**
 * Generate the HTML report
 */
function generateHTML(tests, config) {
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const total = tests.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const timestamp = new Date().toLocaleString();

  // Helper to generate test item HTML
  const generateTestItem = (test, index) => `
    <div class="test-item ${index === 0 ? 'active' : ''}" data-index="${index}" data-status="${test.status}" onclick="selectTest(${index})">
      <div class="test-item-header">
        <div class="test-status ${test.status}"></div>
        <div class="test-name">${test.name}</div>
      </div>
      <div class="test-meta">
        ${test.duration ? `<span><i data-lucide="clock" style="width:12px;height:12px;display:inline;vertical-align:-2px;"></i> ${formatDuration(test.duration)}</span>` : ''}
        ${test.videos.length > 0 ? `<span><i data-lucide="video" style="width:12px;height:12px;display:inline;vertical-align:-2px;"></i> ${test.videos.length}</span>` : ''}
        ${test.screenshots.length > 0 ? `<span><i data-lucide="camera" style="width:12px;height:12px;display:inline;vertical-align:-2px;"></i> ${test.screenshots.length}</span>` : ''}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.projectName} - Test Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    :root {
      /* shadcn/ui default light theme (zinc) */
      --bg-primary: hsl(0 0% 100%);
      --bg-secondary: hsl(0 0% 100%);
      --bg-tertiary: hsl(240 4.8% 95.9%);
      --bg-glass: hsl(0 0% 100% / 0.8);
      --text-primary: hsl(240 10% 3.9%);
      --text-secondary: hsl(240 5.9% 10%);
      --text-muted: hsl(240 3.8% 46.1%);
      --border-color: hsl(240 5.9% 90%);
      --border-glass: hsl(240 5.9% 90%);
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-glass: 0 8px 32px rgb(0 0 0 / 0.08);
      --accent-primary: hsl(240 5.9% 10%);
      --accent-secondary: hsl(240 4.8% 95.9%);
      --accent-gradient: linear-gradient(135deg, hsl(240 5.9% 10%) 0%, hsl(240 3.8% 46.1%) 100%);
      --success: hsl(142.1 76.2% 36.3%);
      --success-bg: hsl(142.1 76.2% 36.3% / 0.1);
      --error: hsl(0 84.2% 60.2%);
      --error-bg: hsl(0 84.2% 60.2% / 0.1);
      --warning: hsl(38 92% 50%);
      --warning-bg: hsl(38 92% 50% / 0.1);
      --ring: hsl(240 5.9% 10%);
    }

    [data-theme="dark"] {
      /* shadcn/ui default dark theme (zinc) */
      --bg-primary: hsl(240 10% 3.9%);
      --bg-secondary: hsl(240 10% 3.9%);
      --bg-tertiary: hsl(240 3.7% 15.9%);
      --bg-glass: hsl(240 10% 3.9% / 0.8);
      --text-primary: hsl(0 0% 98%);
      --text-secondary: hsl(0 0% 98%);
      --text-muted: hsl(240 5% 64.9%);
      --border-color: hsl(240 3.7% 15.9%);
      --border-glass: hsl(240 3.7% 15.9%);
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
      --shadow-glass: 0 8px 32px rgb(0 0 0 / 0.4);
      --accent-primary: hsl(0 0% 98%);
      --accent-secondary: hsl(240 3.7% 15.9%);
      --accent-gradient: linear-gradient(135deg, hsl(0 0% 98%) 0%, hsl(240 5% 64.9%) 100%);
      --success-bg: hsl(142.1 76.2% 36.3% / 0.15);
      --error-bg: hsl(0 84.2% 60.2% / 0.15);
      --warning-bg: hsl(38 92% 50% / 0.15);
      --ring: hsl(240 4.9% 83.9%);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      transition: background-color 0.3s ease, color 0.3s ease;
      line-height: 1.6;
    }

    /* Subtle background - shadcn style */
    .bg-gradient {
      display: none;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 1.5rem;
      position: relative;
      z-index: 1;
    }

    /* Header Section */
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
    }

    /* Theme Toggle */
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
    }

    [data-theme="dark"] .theme-toggle::before {
      transform: translateX(34px);
    }

    .theme-toggle .icon {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      transition: opacity 0.3s ease, color 0.3s ease;
    }

    .theme-toggle .sun { left: 10px; opacity: 1; color: hsl(38 92% 50%); }
    .theme-toggle .moon { right: 10px; opacity: 0.5; color: hsl(240 5% 64.9%); }
    [data-theme="dark"] .theme-toggle .sun { opacity: 0.5; color: hsl(38 92% 50%); }
    [data-theme="dark"] .theme-toggle .moon { opacity: 1; color: hsl(217 91% 60%); }

    /* Stats Grid */
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
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--accent-gradient);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-card .label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      font-weight: 600;
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

    /* Main Content - Two Column Layout */
    .main-content {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 1.5rem;
      min-height: calc(100vh - 280px);
    }

    /* Test List Sidebar */
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

    [data-theme="dark"] .filter-btn.active {
      background: hsl(240 3.7% 25%);
      border-color: hsl(240 4.9% 83.9%);
      color: hsl(0 0% 98%);
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

    [data-theme="dark"] .test-item.active {
      background: hsl(240 3.7% 25%);
      border-color: hsl(240 4.9% 83.9%);
      color: hsl(0 0% 98%);
    }

    .test-item.active .test-status { opacity: 0.9; box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
    .test-item.active .test-meta { color: rgba(255,255,255,0.75); }
    .test-item.active .test-name { color: inherit; }

    [data-theme="dark"] .test-item.active .test-meta { color: hsl(240 5% 64.9%); }
    [data-theme="dark"] .test-item.active .test-name { color: hsl(0 0% 98%); }

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

    /* Detail Panel */
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
    }

    .badge.passed { background: var(--success-bg); color: var(--success); }
    .badge.failed { background: var(--error-bg); color: var(--error); }
    .badge.unknown { background: var(--warning-bg); color: var(--warning); }
    .badge.duration { background: var(--bg-tertiary); color: var(--text-secondary); text-transform: none; }

    /* Video Player */
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
      font-size: 4rem;
      opacity: 0.3;
    }

    .no-video p {
      font-size: 0.875rem;
      opacity: 0.6;
    }

    /* Screenshots Gallery */
    .screenshots-section {
      margin-bottom: 1.5rem;
    }

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
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 2rem 0.5rem 0.5rem;
      font-size: 0.65rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Error Section */
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

    /* Test Steps Timeline */
    .steps-section {
      margin-bottom: 1.5rem;
    }

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

    .step-item:last-child {
      padding-bottom: 0;
    }

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

    /* Logs Section */
    .logs-section {
      margin-bottom: 1.5rem;
    }

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

    /* Empty State */
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
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.4;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    .empty-state p {
      font-size: 0.875rem;
    }

    /* Lightbox */
    .lightbox {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.92);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      cursor: pointer;
      backdrop-filter: blur(8px);
    }

    .lightbox.active {
      display: flex;
    }

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
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .lightbox-close:hover {
      background: rgba(255,255,255,0.2);
    }

    /* Footer */
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

    .footer .heart {
      color: #ef4444;
      display: inline-block;
      animation: heartbeat 1.5s infinite;
    }

    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: var(--bg-tertiary);
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--text-muted);
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .main-content {
        grid-template-columns: 1fr;
      }

      .test-list-container {
        position: static;
        max-height: 350px;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header {
        padding: 1.25rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .header-top {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filter-buttons {
        flex-wrap: wrap;
      }
    }

    /* Animations */
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .test-item {
      animation: slideIn 0.3s ease forwards;
      opacity: 0;
    }

    .stat-card {
      animation: fadeIn 0.5s ease forwards;
    }

    ${Array.from({ length: 10 }, (_, i) => `.test-item:nth-child(${i + 1}) { animation-delay: ${i * 0.05}s; }`).join('\n    ')}
  </style>
</head>
<body>
  <div class="bg-gradient"></div>

  <div class="container">
    <header class="header">
      <div class="header-top">
        <div class="logo">
          <div class="logo-text">
            <h1>${config.projectName}</h1>
            <p>Generated ${timestamp}</p>
          </div>
        </div>
        <div class="theme-toggle" onclick="toggleTheme()" title="Toggle dark/light mode" role="button" tabindex="0">
          <span class="icon sun"><i data-lucide="sun" style="width:14px;height:14px;"></i></span>
          <span class="icon moon"><i data-lucide="moon" style="width:14px;height:14px;"></i></span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card total">
          <div class="label">Total Tests</div>
          <div class="value">${total}</div>
        </div>
        <div class="stat-card passed">
          <div class="label">Passed</div>
          <div class="value">${passed}</div>
        </div>
        <div class="stat-card failed">
          <div class="label">Failed</div>
          <div class="value">${failed}</div>
        </div>
        <div class="stat-card rate">
          <div class="label">Pass Rate</div>
          <div class="value">${passRate}%</div>
        </div>
      </div>
    </header>

    <div class="main-content">
      <aside class="test-list-container">
        <div class="test-list-header">
          <h2>Test Results</h2>
          <div class="filter-buttons">
            <button class="filter-btn active" onclick="filterTests('all', this)">All</button>
            <button class="filter-btn" onclick="filterTests('passed', this)">Passed</button>
            <button class="filter-btn" onclick="filterTests('failed', this)">Failed</button>
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
        Built with <span class="heart"><i data-lucide="heart" style="width:14px;height:14px;fill:currentColor;"></i></span> by
        <a href="https://www.linkedin.com/in/gautammandewalker" target="_blank" rel="noopener">Gautam Mandewalker</a>
        &nbsp;|&nbsp;
        <a href="https://github.com/eagleisbatman/eagle-mobile-e2e-testing" target="_blank" rel="noopener">Eagle Mobile E2E Testing</a>
      </p>
    </footer>
  </div>

  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <div class="lightbox-close" onclick="closeLightbox()">&times;</div>
    <img id="lightboxImage" src="" alt="Screenshot">
  </div>

  <script>
    // Test data embedded
    const testsData = ${JSON.stringify(tests, (key, value) => {
      // Don't include full file paths in JSON for security, just names
      if (key === 'path') return undefined;
      return value;
    }, 2)};

    let currentTestIndex = 0;

    // Theme management
    function toggleTheme() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('eagle-report-theme', newTheme);
    }

    // Initialize theme based on saved preference or system preference
    (function initTheme() {
      const savedTheme = localStorage.getItem('eagle-report-theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('eagle-report-theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });

    // Format duration helper
    function formatDuration(ms) {
      if (!ms) return '';
      if (ms < 1000) return ms + 'ms';
      if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
      return (ms / 60000).toFixed(1) + 'm';
    }

    // Filter tests
    function filterTests(status, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.test-item').forEach(item => {
        const itemStatus = item.getAttribute('data-status');
        item.style.display = (status === 'all' || itemStatus === status) ? 'block' : 'none';
      });
    }

    // Select test
    function selectTest(index) {
      currentTestIndex = index;
      document.querySelectorAll('.test-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
      });

      const detailPanel = document.getElementById('detailPanel');
      detailPanel.innerHTML = generateDetailHTML(testsData[index]);

      // Re-initialize Lucide icons for dynamically added content
      lucide.createIcons();
    }

    // Generate detail HTML dynamically
    function generateDetailHTML(test) {
      if (!test) {
        return '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="search" style="width:64px;height:64px;"></i></div><h3>Select a Test</h3><p>Choose a test from the list</p></div>';
      }

      let html = \`
        <div class="detail-header">
          <div class="detail-title">
            <h2>\${test.name}</h2>
            <div class="detail-badges">
              <span class="badge \${test.status}">\${test.status.toUpperCase()}</span>
              \${test.duration ? \`<span class="badge duration"><i data-lucide="clock" style="width:12px;height:12px;display:inline;vertical-align:-2px;"></i> \${formatDuration(test.duration)}</span>\` : ''}
            </div>
          </div>
        </div>

        <div class="video-container">
          \${test.videos && test.videos.length > 0 ? \`
            <video controls autoplay loop muted playsinline>
              <source src="\${test.videos[0].relativePath || test.videos[0].name}" type="video/mp4">
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
            <div class="error-title"><i data-lucide="alert-circle" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Error Details</div>
            <div class="error-message">\${test.error}</div>
          </div>
        \`;
      }

      if (test.screenshots && test.screenshots.length > 0) {
        html += \`
          <div class="screenshots-section">
            <div class="section-title"><i data-lucide="camera" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Screenshots (\${test.screenshots.length})</div>
            <div class="screenshots-grid">
              \${test.screenshots.map(s => \`
                <div class="screenshot-item" onclick="openLightbox('\${s.relativePath || s.name}')">
                  <img src="\${s.relativePath || s.name}" alt="\${s.name}" loading="lazy">
                  <div class="screenshot-name">\${s.name}</div>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      if (test.steps && test.steps.length > 0) {
        html += \`
          <div class="steps-section">
            <div class="section-title"><i data-lucide="list-checks" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Test Steps</div>
            <div class="steps-timeline">
              \${test.steps.map(step => \`
                <div class="step-item \${step.status || 'success'}">
                  <div class="step-action">\${step.action}</div>
                  \${step.detail ? \`<div class="step-detail">\${step.detail}</div>\` : ''}
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      return html;
    }

    // Lightbox functions
    function openLightbox(src) {
      const img = document.getElementById('lightboxImage');
      img.src = src;
      document.getElementById('lightbox').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
      document.body.style.overflow = '';
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
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

    // Theme toggle with keyboard
    document.querySelector('.theme-toggle').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        toggleTheme();
        e.preventDefault();
      }
    });

    // Initialize Lucide icons
    lucide.createIcons();
  </script>
</body>
</html>`;
}

/**
 * Generate detail panel HTML for initial render
 */
function generateDetailPanel(test) {
  if (!test) return '';

  let html = `
    <div class="detail-header">
      <div class="detail-title">
        <h2>${test.name}</h2>
        <div class="detail-badges">
          <span class="badge ${test.status}">${test.status.toUpperCase()}</span>
          ${test.duration ? `<span class="badge duration"><i data-lucide="clock" style="width:12px;height:12px;display:inline;vertical-align:-2px;"></i> ${formatDuration(test.duration)}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="video-container">
      ${test.videos && test.videos.length > 0 ? `
        <video controls autoplay loop muted playsinline>
          <source src="${test.videos[0].relativePath || path.basename(test.videos[0].path)}" type="video/mp4">
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
        <div class="error-title"><i data-lucide="alert-circle" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Error Details</div>
        <div class="error-message">${test.error}</div>
      </div>
    `;
  }

  if (test.screenshots && test.screenshots.length > 0) {
    html += `
      <div class="screenshots-section">
        <div class="section-title"><i data-lucide="camera" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Screenshots (${test.screenshots.length})</div>
        <div class="screenshots-grid">
          ${test.screenshots.map(s => `
            <div class="screenshot-item" onclick="openLightbox('${s.relativePath || path.basename(s.path)}')">
              <img src="${s.relativePath || path.basename(s.path)}" alt="${s.name}" loading="lazy">
              <div class="screenshot-name">${s.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (test.steps && test.steps.length > 0) {
    html += `
      <div class="steps-section">
        <div class="section-title"><i data-lucide="list-checks" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Test Steps</div>
        <div class="steps-timeline">
          ${test.steps.map(step => `
            <div class="step-item ${step.status || 'success'}">
              <div class="step-action">${step.action}</div>
              ${step.detail ? `<div class="step-detail">${step.detail}</div>` : ''}
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
  console.log('🦅 Eagle Mobile E2E Testing - Report Generator');
  console.log('━'.repeat(50));
  console.log(`📁 Artifacts: ${CONFIG.artifactsDir}`);
  console.log(`📄 Output: ${CONFIG.outputDir}/${CONFIG.reportName}.html`);
  console.log(`🏷️  Project: ${CONFIG.projectName}`);
  console.log('');

  // Scan for test artifacts
  const tests = scanArtifacts(CONFIG.artifactsDir);

  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;

  console.log(`📊 Found ${tests.length} test(s)`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('');

  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Copy media files to output directory
  const mediaDir = path.join(CONFIG.outputDir, 'media');
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  tests.forEach((test, testIndex) => {
    // Copy videos with unique names based on test ID
    if (test.videos) {
      test.videos.forEach((video, videoIndex) => {
        if (fs.existsSync(video.path)) {
          const ext = path.extname(video.path);
          const uniqueName = `test-${testIndex}-video-${videoIndex}${ext}`;
          const destPath = path.join(mediaDir, uniqueName);
          try {
            fs.copyFileSync(video.path, destPath);
            video.relativePath = `media/${uniqueName}`;
          } catch (e) {
            console.warn(`Failed to copy video: ${video.path}`);
          }
        }
      });
    }
    // Copy screenshots with unique names based on test ID
    if (test.screenshots) {
      test.screenshots.forEach((screenshot, ssIndex) => {
        if (fs.existsSync(screenshot.path)) {
          const ext = path.extname(screenshot.path);
          const uniqueName = `test-${testIndex}-screenshot-${ssIndex}${ext}`;
          const destPath = path.join(mediaDir, uniqueName);
          try {
            fs.copyFileSync(screenshot.path, destPath);
            screenshot.relativePath = `media/${uniqueName}`;
          } catch (e) {
            console.warn(`Failed to copy screenshot: ${screenshot.path}`);
          }
        }
      });
    }
  });

  // Generate HTML report
  const html = generateHTML(tests, CONFIG);
  const outputPath = path.join(CONFIG.outputDir, `${CONFIG.reportName}.html`);
  fs.writeFileSync(outputPath, html);

  console.log(`✅ Report generated successfully!`);
  console.log('');
  console.log(`🌐 Open in browser:`);
  console.log(`   file://${path.resolve(outputPath)}`);
  console.log('');
  console.log('💡 Tip: Use --help for all options');
  console.log('');
}

main();
