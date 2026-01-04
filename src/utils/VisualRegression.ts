/**
 * VisualRegression - Screenshot comparison and regression detection
 *
 * Provides utilities for:
 * - Screenshot baseline management
 * - Visual comparison using Gemini
 * - Regression detection and reporting
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface VisualDiff {
  identical: boolean;
  similarity: number; // 0-100
  differences: Array<{
    area: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
  }>;
  regressions: string[];
  improvements: string[];
}

export interface BaselineInfo {
  name: string;
  path: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface RegressionConfig {
  apiKey: string;
  model?: string;
  baselinesDir?: string;
  threshold?: number; // Similarity threshold to pass (0-100)
  autoUpdate?: boolean;
  verbose?: boolean;
}

// ============================================================================
// VisualRegression
// ============================================================================

export class VisualRegression {
  private ai: GoogleGenAI;
  private model: string;
  private baselinesDir: string;
  private threshold: number;
  private autoUpdate: boolean;
  private verbose: boolean;
  private baselinesIndex: Map<string, BaselineInfo> = new Map();

  constructor(config: RegressionConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gemini-3-flash';
    this.baselinesDir = config.baselinesDir || './e2e/visual-baselines';
    this.threshold = config.threshold ?? 95;
    this.autoUpdate = config.autoUpdate ?? false;
    this.verbose = config.verbose ?? true;

    this.ensureDir(this.baselinesDir);
    this.loadIndex();
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  // --------------------------------------------------------------------------
  // Baseline Management
  // --------------------------------------------------------------------------

  private loadIndex(): void {
    const indexPath = path.join(this.baselinesDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        this.baselinesIndex = new Map(Object.entries(data));
      } catch {
        this.baselinesIndex = new Map();
      }
    }
  }

  private saveIndex(): void {
    const indexPath = path.join(this.baselinesDir, 'index.json');
    const data = Object.fromEntries(this.baselinesIndex);
    fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));
  }

  private computeHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Save a screenshot as a baseline.
   */
  saveBaseline(
    name: string,
    screenshotPath: string,
    metadata?: Record<string, any>
  ): BaselineInfo {
    const buffer = fs.readFileSync(screenshotPath);
    const hash = this.computeHash(buffer);
    const ext = path.extname(screenshotPath);
    const baselinePath = path.join(this.baselinesDir, `${name}${ext}`);

    fs.copyFileSync(screenshotPath, baselinePath);

    const info: BaselineInfo = {
      name,
      path: baselinePath,
      hash,
      createdAt: this.baselinesIndex.get(name)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
    };

    this.baselinesIndex.set(name, info);
    this.saveIndex();

    this.log(`💾 Baseline saved: ${name}`);

    return info;
  }

  /**
   * Get baseline info by name.
   */
  getBaseline(name: string): BaselineInfo | null {
    return this.baselinesIndex.get(name) || null;
  }

  /**
   * Check if a baseline exists.
   */
  hasBaseline(name: string): boolean {
    const info = this.baselinesIndex.get(name);
    return info !== undefined && fs.existsSync(info.path);
  }

  /**
   * Delete a baseline.
   */
  deleteBaseline(name: string): boolean {
    const info = this.baselinesIndex.get(name);
    if (info && fs.existsSync(info.path)) {
      fs.unlinkSync(info.path);
      this.baselinesIndex.delete(name);
      this.saveIndex();
      return true;
    }
    return false;
  }

  /**
   * List all baselines.
   */
  listBaselines(): BaselineInfo[] {
    return [...this.baselinesIndex.values()];
  }

  // --------------------------------------------------------------------------
  // Comparison
  // --------------------------------------------------------------------------

  /**
   * Compare a screenshot against its baseline.
   */
  async compare(
    name: string,
    currentScreenshotPath: string,
    options: {
      updateOnDiff?: boolean;
      context?: string;
    } = {}
  ): Promise<{
    passed: boolean;
    diff: VisualDiff;
    baselineInfo: BaselineInfo | null;
  }> {
    const { updateOnDiff = this.autoUpdate, context } = options;

    // Check if baseline exists
    if (!this.hasBaseline(name)) {
      this.log(`ℹ️ No baseline for "${name}" - creating one`);
      const info = this.saveBaseline(name, currentScreenshotPath);
      return {
        passed: true,
        diff: {
          identical: true,
          similarity: 100,
          differences: [],
          regressions: [],
          improvements: ['Baseline created'],
        },
        baselineInfo: info,
      };
    }

    const baselineInfo = this.baselinesIndex.get(name)!;

    // Quick hash check first
    const currentBuffer = fs.readFileSync(currentScreenshotPath);
    const currentHash = this.computeHash(currentBuffer);

    if (currentHash === baselineInfo.hash) {
      this.log(`✅ ${name}: Identical (hash match)`);
      return {
        passed: true,
        diff: {
          identical: true,
          similarity: 100,
          differences: [],
          regressions: [],
          improvements: [],
        },
        baselineInfo,
      };
    }

    // Hash differs - do visual comparison
    this.log(`🔍 ${name}: Comparing visually...`);

    const diff = await this.visualCompare(
      baselineInfo.path,
      currentScreenshotPath,
      context
    );

    const passed = diff.similarity >= this.threshold;

    if (passed) {
      this.log(`✅ ${name}: Passed (${diff.similarity}% similar)`);
    } else {
      this.log(`❌ ${name}: Failed (${diff.similarity}% similar, threshold: ${this.threshold}%)`);

      if (diff.regressions.length > 0) {
        this.log('   Regressions:');
        for (const r of diff.regressions) {
          this.log(`     - ${r}`);
        }
      }
    }

    // Update baseline if requested
    if (!passed && updateOnDiff) {
      this.log(`🔄 Updating baseline: ${name}`);
      this.saveBaseline(name, currentScreenshotPath, baselineInfo.metadata);
    }

    return { passed, diff, baselineInfo };
  }

  /**
   * Perform visual comparison using Gemini.
   */
  async visualCompare(
    baselinePath: string,
    currentPath: string,
    context?: string
  ): Promise<VisualDiff> {
    const baselineData = fs.readFileSync(baselinePath).toString('base64');
    const currentData = fs.readFileSync(currentPath).toString('base64');

    const prompt = `Compare these two mobile app screenshots for visual regression testing.

IMAGE 1 = BASELINE (expected/reference)
IMAGE 2 = CURRENT (actual/new)

${context ? `Context: ${context}\n\n` : ''}Return JSON:
{
  "identical": true/false,
  "similarity": 0-100,
  "differences": [
    {
      "area": "where in the screen",
      "description": "what changed",
      "severity": "minor | major | critical"
    }
  ],
  "regressions": ["Things that got worse or broke"],
  "improvements": ["Things that improved"]
}

Severity guide:
- minor: Spacing, subtle color shifts, minor alignment
- major: Missing elements, text changes, layout shifts
- critical: Broken UI, overlapping elements, unreadable text

Focus on:
- Layout changes
- Text content changes
- Color/styling differences
- Missing or new elements
- Element positioning
- State differences (disabled, loading, etc.)`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/png', data: baselineData } },
          { inlineData: { mimeType: 'image/png', data: currentData } },
          { text: prompt },
        ],
      }],
      config: { temperature: 0.1 },
    });

    try {
      const json = response.text?.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    } catch {}

    return {
      identical: false,
      similarity: 0,
      differences: [{ area: 'unknown', description: response.text || 'Comparison failed', severity: 'major' }],
      regressions: [],
      improvements: [],
    };
  }

  // --------------------------------------------------------------------------
  // Batch Operations
  // --------------------------------------------------------------------------

  /**
   * Compare multiple screenshots against baselines.
   */
  async compareAll(
    screenshots: Array<{ name: string; path: string }>,
    options: { stopOnFailure?: boolean; context?: string } = {}
  ): Promise<{
    passed: boolean;
    results: Array<{
      name: string;
      passed: boolean;
      diff: VisualDiff;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
    };
  }> {
    const { stopOnFailure = false, context } = options;
    const results: Array<{ name: string; passed: boolean; diff: VisualDiff }> = [];

    for (const screenshot of screenshots) {
      const { passed, diff } = await this.compare(screenshot.name, screenshot.path, { context });
      results.push({ name: screenshot.name, passed, diff });

      if (!passed && stopOnFailure) {
        break;
      }
    }

    const passedCount = results.filter((r) => r.passed).length;

    return {
      passed: passedCount === results.length,
      results,
      summary: {
        total: results.length,
        passed: passedCount,
        failed: results.length - passedCount,
      },
    };
  }

  /**
   * Update all baselines from current screenshots.
   */
  updateAllBaselines(screenshots: Array<{ name: string; path: string }>): void {
    for (const screenshot of screenshots) {
      this.saveBaseline(screenshot.name, screenshot.path);
    }
  }

  // --------------------------------------------------------------------------
  // Reporting
  // --------------------------------------------------------------------------

  /**
   * Generate an HTML report of visual regression results.
   */
  generateHtmlReport(
    results: Array<{ name: string; passed: boolean; diff: VisualDiff; currentPath?: string }>,
    outputPath: string
  ): void {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Visual Regression Report</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat { padding: 20px; border-radius: 8px; text-align: center; }
    .stat.passed { background: #d4edda; }
    .stat.failed { background: #f8d7da; }
    .stat h2 { margin: 0; font-size: 36px; }
    .stat p { margin: 5px 0 0; }
    .result { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
    .result-header { padding: 15px; display: flex; justify-content: space-between; align-items: center; }
    .result-header.passed { background: #d4edda; }
    .result-header.failed { background: #f8d7da; }
    .result-body { padding: 15px; }
    .diff-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
    .diff-item.minor { background: #fff3cd; }
    .diff-item.major { background: #f8d7da; }
    .diff-item.critical { background: #dc3545; color: white; }
    .images { display: flex; gap: 20px; margin-top: 15px; }
    .images img { max-width: 45%; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>Visual Regression Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <div class="summary">
    <div class="stat passed">
      <h2>${results.filter((r) => r.passed).length}</h2>
      <p>Passed</p>
    </div>
    <div class="stat failed">
      <h2>${results.filter((r) => !r.passed).length}</h2>
      <p>Failed</p>
    </div>
  </div>

  ${results.map((r) => `
    <div class="result">
      <div class="result-header ${r.passed ? 'passed' : 'failed'}">
        <strong>${r.name}</strong>
        <span>${r.diff.similarity}% similar</span>
      </div>
      <div class="result-body">
        ${r.diff.differences.length > 0 ? `
          <h4>Differences:</h4>
          ${r.diff.differences.map((d) => `
            <div class="diff-item ${d.severity}">
              <strong>${d.area}</strong>: ${d.description}
            </div>
          `).join('')}
        ` : '<p>No differences detected.</p>'}

        ${r.diff.regressions.length > 0 ? `
          <h4>Regressions:</h4>
          <ul>${r.diff.regressions.map((reg) => `<li>${reg}</li>`).join('')}</ul>
        ` : ''}
      </div>
    </div>
  `).join('')}
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    this.log(`📄 Report saved: ${outputPath}`);
  }
}

export default VisualRegression;
