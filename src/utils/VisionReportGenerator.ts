/**
 * VisionReportGenerator - Generate HTML reports for vision test results
 *
 * Creates detailed HTML reports showing:
 * - Step-by-step vision analysis
 * - Screenshots with observations
 * - Action decisions and outcomes
 * - Visual regression results
 * - Accessibility audit findings
 */

import { StepResult, GoalResult } from '../runners/VisionTestRunner';
import { VideoAnalysis, AccessibilityAudit } from '../runners/VideoTestRunner';
import { ExplorationResult } from '../runners/AppExplorer';
import { VisualDiff } from './VisualRegression';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface VisionReportData {
  title: string;
  timestamp: string;
  goals?: GoalResult[];
  explorations?: ExplorationResult[];
  videoAnalyses?: VideoAnalysis[];
  accessibilityAudits?: AccessibilityAudit[];
  visualRegressions?: Array<{ name: string; passed: boolean; diff: VisualDiff }>;
  summary?: {
    totalTests: number;
    passed: number;
    failed: number;
    coverage: number;
  };
}

export interface ReportGeneratorConfig {
  outputDir?: string;
  embedScreenshots?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  projectName?: string;
}

// ============================================================================
// VisionReportGenerator
// ============================================================================

export class VisionReportGenerator {
  private config: ReportGeneratorConfig;

  constructor(config: ReportGeneratorConfig = {}) {
    this.config = {
      outputDir: './e2e/reports/vision',
      embedScreenshots: true,
      theme: 'auto',
      projectName: 'Vision E2E Tests',
      ...config,
    };

    if (!fs.existsSync(this.config.outputDir!)) {
      fs.mkdirSync(this.config.outputDir!, { recursive: true });
    }
  }

  /**
   * Generate a complete vision test report.
   */
  generate(data: VisionReportData): string {
    const html = this.buildHtml(data);
    const outputPath = path.join(
      this.config.outputDir!,
      `vision-report-${Date.now()}.html`
    );
    fs.writeFileSync(outputPath, html);
    console.log(`📄 Vision report generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Save vision test results as JSON for integration with other reporters.
   */
  saveJson(data: VisionReportData, filename?: string): string {
    const outputPath = path.join(
      this.config.outputDir!,
      filename || `vision-results-${Date.now()}.json`
    );

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    return outputPath;
  }

  private buildHtml(data: VisionReportData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || 'Vision Test Report'}</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body class="${this.config.theme}">
  <header>
    <h1>${this.config.projectName}</h1>
    <p class="timestamp">Generated: ${data.timestamp}</p>
    ${this.buildThemeToggle()}
  </header>

  ${data.summary ? this.buildSummary(data.summary) : ''}

  <main>
    ${data.goals ? this.buildGoalsSection(data.goals) : ''}
    ${data.explorations ? this.buildExplorationsSection(data.explorations) : ''}
    ${data.videoAnalyses ? this.buildVideoSection(data.videoAnalyses) : ''}
    ${data.accessibilityAudits ? this.buildAccessibilitySection(data.accessibilityAudits) : ''}
    ${data.visualRegressions ? this.buildRegressionSection(data.visualRegressions) : ''}
  </main>

  <script>
    ${this.getScript()}
  </script>
</body>
</html>`;
  }

  private getStyles(): string {
    return `
      :root {
        --bg: #f8fafc;
        --bg-card: #ffffff;
        --text: #1e293b;
        --text-muted: #64748b;
        --border: #e2e8f0;
        --success: #22c55e;
        --error: #ef4444;
        --warning: #f59e0b;
        --info: #3b82f6;
        --accent: #6366f1;
      }

      .dark {
        --bg: #0f172a;
        --bg-card: #1e293b;
        --text: #f1f5f9;
        --text-muted: #94a3b8;
        --border: #334155;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: system-ui, -apple-system, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.6;
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border);
      }

      header h1 { font-size: 24px; }
      .timestamp { color: var(--text-muted); font-size: 14px; }

      .theme-toggle {
        padding: 8px 16px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--bg-card);
        color: var(--text);
        cursor: pointer;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }

      .stat {
        background: var(--bg-card);
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        border: 1px solid var(--border);
      }

      .stat h2 { font-size: 36px; margin-bottom: 5px; }
      .stat.passed h2 { color: var(--success); }
      .stat.failed h2 { color: var(--error); }
      .stat p { color: var(--text-muted); }

      section {
        margin-bottom: 40px;
      }

      section h2 {
        font-size: 20px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border);
      }

      .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .card-header {
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        border-bottom: 1px solid var(--border);
      }

      .card-header.passed { background: rgba(34, 197, 94, 0.1); }
      .card-header.failed { background: rgba(239, 68, 68, 0.1); }

      .card-body {
        padding: 20px;
        display: none;
      }

      .card-body.open { display: block; }

      .step {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 20px;
        padding: 15px;
        border-bottom: 1px solid var(--border);
      }

      .step:last-child { border-bottom: none; }

      .step-screenshot {
        width: 100%;
        border-radius: 8px;
        cursor: pointer;
      }

      .step-details h4 { margin-bottom: 10px; }

      .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .badge.success { background: var(--success); color: white; }
      .badge.error { background: var(--error); color: white; }
      .badge.warning { background: var(--warning); color: white; }
      .badge.info { background: var(--info); color: white; }

      .observation {
        background: var(--bg);
        padding: 10px;
        border-radius: 8px;
        margin: 10px 0;
        font-size: 14px;
      }

      .action {
        font-family: monospace;
        background: var(--bg);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
      }

      .issues { margin-top: 20px; }

      .issue {
        padding: 12px;
        margin: 8px 0;
        border-radius: 8px;
        border-left: 4px solid;
      }

      .issue.high { border-color: var(--error); background: rgba(239, 68, 68, 0.1); }
      .issue.medium { border-color: var(--warning); background: rgba(245, 158, 11, 0.1); }
      .issue.low { border-color: var(--info); background: rgba(59, 130, 246, 0.1); }

      .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .lightbox.open { display: flex; }
      .lightbox img { max-width: 90%; max-height: 90%; }
      .lightbox-close {
        position: absolute;
        top: 20px;
        right: 30px;
        color: white;
        font-size: 30px;
        cursor: pointer;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--border);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--success);
        transition: width 0.3s;
      }

      .accessibility-score {
        font-size: 48px;
        font-weight: bold;
        text-align: center;
        padding: 20px;
      }

      .score-high { color: var(--success); }
      .score-medium { color: var(--warning); }
      .score-low { color: var(--error); }
    `;
  }

  private getScript(): string {
    return `
      // Theme toggle
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => {
          document.body.classList.toggle('dark');
          const isDark = document.body.classList.contains('dark');
          toggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
        });

        // Auto theme detection
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.body.classList.add('dark');
          toggle.textContent = '☀️ Light';
        }
      }

      // Card expand/collapse
      document.querySelectorAll('.card-header').forEach(header => {
        header.addEventListener('click', () => {
          const body = header.nextElementSibling;
          body.classList.toggle('open');
        });
      });

      // Lightbox
      const lightbox = document.getElementById('lightbox');
      const lightboxImg = document.getElementById('lightbox-img');

      document.querySelectorAll('.step-screenshot').forEach(img => {
        img.addEventListener('click', () => {
          lightboxImg.src = img.src;
          lightbox.classList.add('open');
        });
      });

      if (lightbox) {
        lightbox.addEventListener('click', () => {
          lightbox.classList.remove('open');
        });
      }
    `;
  }

  private buildThemeToggle(): string {
    return '<button class="theme-toggle">🌙 Dark</button>';
  }

  private buildSummary(summary: VisionReportData['summary']): string {
    if (!summary) return '';

    return `
      <div class="summary">
        <div class="stat">
          <h2>${summary.totalTests}</h2>
          <p>Total Tests</p>
        </div>
        <div class="stat passed">
          <h2>${summary.passed}</h2>
          <p>Passed</p>
        </div>
        <div class="stat failed">
          <h2>${summary.failed}</h2>
          <p>Failed</p>
        </div>
        <div class="stat">
          <h2>${summary.coverage}%</h2>
          <p>Coverage</p>
        </div>
      </div>
    `;
  }

  private buildGoalsSection(goals: GoalResult[]): string {
    return `
      <section>
        <h2>🎯 Goal-Based Tests</h2>
        ${goals.map((goal) => this.buildGoalCard(goal)).join('')}
      </section>
    `;
  }

  private buildGoalCard(goal: GoalResult): string {
    const statusClass = goal.success ? 'passed' : 'failed';
    const statusBadge = goal.success
      ? '<span class="badge success">✓ Passed</span>'
      : '<span class="badge error">✗ Failed</span>';

    return `
      <div class="card">
        <div class="card-header ${statusClass}">
          <div>
            <strong>${goal.goal}</strong>
            ${statusBadge}
          </div>
          <span>${goal.summary.totalSteps} steps · ${(goal.totalDuration / 1000).toFixed(1)}s</span>
        </div>
        <div class="card-body">
          ${goal.steps.map((step) => this.buildStepItem(step)).join('')}
        </div>
      </div>
    `;
  }

  private buildStepItem(step: StepResult): string {
    const screenshot = this.config.embedScreenshots && step.screenshot
      ? `<img src="data:image/png;base64,${step.screenshot}" class="step-screenshot" alt="Step ${step.stepNumber}">`
      : step.screenshotPath
        ? `<img src="${step.screenshotPath}" class="step-screenshot" alt="Step ${step.stepNumber}">`
        : '';

    const statusBadge = step.success
      ? '<span class="badge success">✓</span>'
      : `<span class="badge error">✗ ${step.error || ''}</span>`;

    return `
      <div class="step">
        <div>${screenshot}</div>
        <div class="step-details">
          <h4>Step ${step.stepNumber} ${statusBadge}</h4>
          <div class="observation">${step.action.observation || ''}</div>
          <div class="action">
            <strong>${step.action.action.type}</strong> → ${step.action.action.target}
            ${step.action.action.value ? `(${step.action.action.value})` : ''}
          </div>
          <p style="margin-top: 10px; color: var(--text-muted);">
            Confidence: ${step.action.confidence} · State: ${step.action.currentState}
          </p>
        </div>
      </div>
    `;
  }

  private buildExplorationsSection(explorations: ExplorationResult[]): string {
    return `
      <section>
        <h2>🔍 App Exploration</h2>
        ${explorations.map((exp) => this.buildExplorationCard(exp)).join('')}
      </section>
    `;
  }

  private buildExplorationCard(exp: ExplorationResult): string {
    return `
      <div class="card">
        <div class="card-header">
          <strong>Exploration Results</strong>
          <span>${exp.screensDiscovered.length} screens · ${exp.issuesFound.length} issues</span>
        </div>
        <div class="card-body">
          <div style="margin-bottom: 20px;">
            <h4>Coverage Score</h4>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${exp.coverageScore}%"></div>
            </div>
            <p style="text-align: center; margin-top: 5px;">${exp.coverageScore}%</p>
          </div>

          <h4>Screens Discovered</h4>
          <ul>
            ${exp.screensDiscovered.map((s) => `<li>${s}</li>`).join('')}
          </ul>

          ${exp.issuesFound.length > 0 ? `
            <div class="issues">
              <h4>Issues Found</h4>
              ${exp.issuesFound.map((issue) => `
                <div class="issue ${issue.severity}">
                  <strong>[${issue.type}]</strong> ${issue.description}
                  <br><small>Screen: ${issue.screen}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${exp.suggestedTestCases.length > 0 ? `
            <h4 style="margin-top: 20px;">Suggested Test Cases</h4>
            <ol>
              ${exp.suggestedTestCases.slice(0, 10).map((tc) => `<li>${tc}</li>`).join('')}
            </ol>
          ` : ''}
        </div>
      </div>
    `;
  }

  private buildVideoSection(analyses: VideoAnalysis[]): string {
    return `
      <section>
        <h2>📹 Video Analysis</h2>
        ${analyses.map((analysis) => `
          <div class="card">
            <div class="card-header">
              <strong>Video Analysis</strong>
              <span>UI Quality: ${analysis.uiQuality.rating}/10</span>
            </div>
            <div class="card-body">
              <p><strong>Summary:</strong> ${analysis.summary}</p>

              <h4 style="margin-top: 15px;">Screens Visited</h4>
              <p>${analysis.screensVisited.join(' → ')}</p>

              ${analysis.issues.length > 0 ? `
                <div class="issues">
                  <h4>Issues</h4>
                  ${analysis.issues.map((issue) => `
                    <div class="issue ${issue.severity}">
                      ${issue.timestamp ? `[${issue.timestamp}] ` : ''}${issue.description}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </section>
    `;
  }

  private buildAccessibilitySection(audits: AccessibilityAudit[]): string {
    return `
      <section>
        <h2>♿ Accessibility Audit</h2>
        ${audits.map((audit) => {
          const scoreClass = audit.score >= 80 ? 'score-high' : audit.score >= 50 ? 'score-medium' : 'score-low';
          return `
            <div class="card">
              <div class="card-header">
                <strong>Accessibility Score</strong>
                <span>WCAG ${audit.wcagLevel}</span>
              </div>
              <div class="card-body">
                <div class="accessibility-score ${scoreClass}">${audit.score}/100</div>

                ${audit.issues.length > 0 ? `
                  <div class="issues">
                    <h4>Issues</h4>
                    ${audit.issues.map((issue) => `
                      <div class="issue ${issue.severity}">
                        <strong>${issue.criterion}</strong>: ${issue.description}
                        <br><small>Recommendation: ${issue.recommendation}</small>
                      </div>
                    `).join('')}
                  </div>
                ` : '<p>No accessibility issues found.</p>'}

                ${audit.passedChecks.length > 0 ? `
                  <h4 style="margin-top: 20px;">Passed Checks</h4>
                  <ul>
                    ${audit.passedChecks.map((check) => `<li>✓ ${check}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </section>
    `;
  }

  private buildRegressionSection(regressions: Array<{ name: string; passed: boolean; diff: VisualDiff }>): string {
    return `
      <section>
        <h2>🔄 Visual Regression</h2>
        ${regressions.map((reg) => `
          <div class="card">
            <div class="card-header ${reg.passed ? 'passed' : 'failed'}">
              <strong>${reg.name}</strong>
              <span>${reg.diff.similarity}% similar</span>
            </div>
            <div class="card-body">
              ${reg.diff.differences.length > 0 ? `
                <h4>Differences</h4>
                ${reg.diff.differences.map((d) => `
                  <div class="issue ${d.severity === 'critical' ? 'high' : d.severity === 'major' ? 'medium' : 'low'}">
                    <strong>${d.area}</strong>: ${d.description}
                  </div>
                `).join('')}
              ` : '<p>No differences detected.</p>'}

              ${reg.diff.regressions.length > 0 ? `
                <h4 style="margin-top: 15px;">Regressions</h4>
                <ul>
                  ${reg.diff.regressions.map((r) => `<li style="color: var(--error);">${r}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </section>

      <div id="lightbox" class="lightbox">
        <span class="lightbox-close">&times;</span>
        <img id="lightbox-img" src="" alt="Screenshot">
      </div>
    `;
  }
}

export default VisionReportGenerator;
