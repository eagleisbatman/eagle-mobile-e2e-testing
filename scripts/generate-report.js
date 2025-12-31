#!/usr/bin/env node
/**
 * E2E Test Report Generator
 * Generates HTML reports with embedded videos, screenshots, and test summaries
 * 
 * Usage: node generate-report.js [artifacts-dir] [output-file]
 */

const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = process.argv[2] || 'e2e/artifacts';
const OUTPUT_FILE = process.argv[3] || 'e2e/reports/test-report.html';

function findFiles(dir, extension) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results.push(...findFiles(fullPath, extension));
    } else if (file.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

function getRelativePath(filePath, baseDir) {
  return path.relative(path.dirname(OUTPUT_FILE), filePath);
}

function parseTestResults(artifactsDir) {
  const results = {
    passed: [],
    failed: [],
    total: 0,
    duration: 0,
  };
  
  // Parse junit.xml if exists
  const junitPath = path.join(artifactsDir, '../reports/junit.xml');
  if (fs.existsSync(junitPath)) {
    const content = fs.readFileSync(junitPath, 'utf-8');
    const testcases = content.match(/<testcase[^>]*>/g) || [];
    results.total = testcases.length;
    
    const failures = content.match(/<failure/g) || [];
    results.failed = new Array(failures.length).fill({ name: 'Failed Test' });
    results.passed = new Array(results.total - failures.length).fill({ name: 'Passed Test' });
  }
  
  return results;
}

function generateHTML(artifactsDir) {
  const videos = findFiles(artifactsDir, '.mp4');
  const screenshots = findFiles(artifactsDir, '.png');
  const logs = findFiles(artifactsDir, '.log');
  const traces = findFiles(artifactsDir, '.json');
  const testResults = parseTestResults(artifactsDir);
  
  const timestamp = new Date().toISOString();
  const passRate = testResults.total > 0 
    ? ((testResults.passed.length / testResults.total) * 100).toFixed(1) 
    : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E2E Test Report - ${timestamp}</title>
  <style>
    :root {
      --primary: #3b82f6;
      --success: #22c55e;
      --danger: #ef4444;
      --warning: #f59e0b;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      background: linear-gradient(135deg, var(--primary), #1d4ed8);
      color: white;
      padding: 2rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .header .meta {
      opacity: 0.9;
      font-size: 0.9rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: var(--card);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid var(--border);
    }
    
    .stat-card .label {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .stat-card .value {
      font-size: 2rem;
      font-weight: 700;
      margin-top: 0.25rem;
    }
    
    .stat-card.success .value { color: var(--success); }
    .stat-card.danger .value { color: var(--danger); }
    .stat-card.primary .value { color: var(--primary); }
    
    .section {
      background: var(--card);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid var(--border);
    }
    
    .section h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .section h2::before {
      content: '';
      width: 4px;
      height: 1.25rem;
      background: var(--primary);
      border-radius: 2px;
    }
    
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    
    .video-card {
      background: var(--bg);
      border-radius: 0.5rem;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    
    .video-card video {
      width: 100%;
      display: block;
    }
    
    .video-card .info {
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
    }
    
    .screenshot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .screenshot-card {
      position: relative;
      border-radius: 0.5rem;
      overflow: hidden;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .screenshot-card:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .screenshot-card img {
      width: 100%;
      display: block;
    }
    
    .screenshot-card .label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.75);
      color: white;
      padding: 0.5rem;
      font-size: 0.75rem;
    }
    
    .file-list {
      list-style: none;
    }
    
    .file-list li {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .file-list li:last-child {
      border-bottom: none;
    }
    
    .file-list a {
      color: var(--primary);
      text-decoration: none;
    }
    
    .file-list a:hover {
      text-decoration: underline;
    }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .badge.success { background: #dcfce7; color: #166534; }
    .badge.danger { background: #fee2e2; color: #991b1b; }
    
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }
    
    /* Lightbox */
    .lightbox {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }
    
    .lightbox.active { display: flex; }
    
    .lightbox img {
      max-width: 90%;
      max-height: 90%;
    }
    
    .lightbox-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: white;
      font-size: 2rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 E2E Test Report</h1>
      <div class="meta">
        Generated: ${timestamp} | Artifacts: ${artifactsDir}
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="label">Total Tests</div>
        <div class="value">${testResults.total || videos.length + screenshots.length}</div>
      </div>
      <div class="stat-card success">
        <div class="label">Passed</div>
        <div class="value">${testResults.passed.length}</div>
      </div>
      <div class="stat-card danger">
        <div class="label">Failed</div>
        <div class="value">${testResults.failed.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Pass Rate</div>
        <div class="value">${passRate}%</div>
      </div>
    </div>
    
    <div class="section">
      <h2>🎬 Test Videos (${videos.length})</h2>
      ${videos.length > 0 ? `
        <div class="video-grid">
          ${videos.map(video => {
            const name = path.basename(video);
            const relPath = getRelativePath(video, OUTPUT_FILE);
            return `
              <div class="video-card">
                <video controls>
                  <source src="${relPath}" type="video/mp4">
                  Your browser does not support video playback.
                </video>
                <div class="info">${name}</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<div class="empty-state">No videos recorded</div>'}
    </div>
    
    <div class="section">
      <h2>📸 Screenshots (${screenshots.length})</h2>
      ${screenshots.length > 0 ? `
        <div class="screenshot-grid">
          ${screenshots.map(screenshot => {
            const name = path.basename(screenshot);
            const relPath = getRelativePath(screenshot, OUTPUT_FILE);
            return `
              <div class="screenshot-card" onclick="openLightbox('${relPath}')">
                <img src="${relPath}" alt="${name}" loading="lazy">
                <div class="label">${name}</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<div class="empty-state">No screenshots captured</div>'}
    </div>
    
    <div class="section">
      <h2>📋 Log Files (${logs.length})</h2>
      ${logs.length > 0 ? `
        <ul class="file-list">
          ${logs.map(log => {
            const name = path.basename(log);
            const relPath = getRelativePath(log, OUTPUT_FILE);
            return `
              <li>
                <span>📄</span>
                <a href="${relPath}" target="_blank">${name}</a>
              </li>
            `;
          }).join('')}
        </ul>
      ` : '<div class="empty-state">No log files available</div>'}
    </div>
    
    <div class="section">
      <h2>📊 Trace Files (${traces.length})</h2>
      ${traces.length > 0 ? `
        <ul class="file-list">
          ${traces.map(trace => {
            const name = path.basename(trace);
            const relPath = getRelativePath(trace, OUTPUT_FILE);
            return `
              <li>
                <span>📈</span>
                <a href="${relPath}" target="_blank">${name}</a>
                <span class="badge">Open in chrome://tracing</span>
              </li>
            `;
          }).join('')}
        </ul>
      ` : '<div class="empty-state">No trace files available</div>'}
    </div>
  </div>
  
  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <span class="lightbox-close">&times;</span>
    <img id="lightbox-img" src="" alt="Screenshot">
  </div>
  
  <script>
    function openLightbox(src) {
      document.getElementById('lightbox-img').src = src;
      document.getElementById('lightbox').classList.add('active');
    }
    
    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  </script>
</body>
</html>`;
}

// Main execution
function main() {
  console.log('🔍 Scanning artifacts directory:', ARTIFACTS_DIR);
  
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    console.error('❌ Artifacts directory not found:', ARTIFACTS_DIR);
    process.exit(1);
  }
  
  const html = generateHTML(ARTIFACTS_DIR);
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, html);
  console.log('✅ Report generated:', OUTPUT_FILE);
  
  // Print summary
  const videos = findFiles(ARTIFACTS_DIR, '.mp4');
  const screenshots = findFiles(ARTIFACTS_DIR, '.png');
  const logs = findFiles(ARTIFACTS_DIR, '.log');
  
  console.log('\n📊 Summary:');
  console.log(`   Videos: ${videos.length}`);
  console.log(`   Screenshots: ${screenshots.length}`);
  console.log(`   Log files: ${logs.length}`);
}

main();
