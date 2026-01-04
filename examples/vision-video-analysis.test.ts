/**
 * Video-Based Test Analysis
 *
 * Uses Gemini's video understanding capabilities to analyze
 * recorded test sessions for issues, regressions, and quality.
 *
 * Setup:
 *   npm install --save-dev @google/genai
 *   export GEMINI_API_KEY=your_api_key
 *
 * Run with video recording:
 *   npx detox test -c ios.sim.debug e2e/video-analysis.test.ts --record-videos all
 */

import { device, element, by, expect } from 'detox';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface VideoAnalysis {
  summary: string;
  screensVisited: string[];
  actionsPerformed: string[];
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    timestamp?: string;
    description: string;
  }>;
  uiQuality: {
    rating: number;
    animations: string;
    responsiveness: string;
    notes: string;
  };
  recommendations: string[];
}

interface ComparisonResult {
  identical: boolean;
  differences: string[];
  regressions: string[];
  improvements: string[];
}

// ============================================================================
// Video Analyzer
// ============================================================================

class VideoAnalyzer {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model; // 2.5+ supports video well
  }

  async analyzeVideo(videoPath: string, context?: string): Promise<VideoAnalysis> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video not found: ${videoPath}`);
    }

    const videoData = fs.readFileSync(videoPath);
    const base64 = videoData.toString('base64');
    const mimeType = this.getMimeType(videoPath);

    console.log(`📹 Analyzing video: ${path.basename(videoPath)}`);
    console.log(`   Size: ${(videoData.length / 1024 / 1024).toFixed(2)} MB`);

    const prompt = `Analyze this mobile app test recording${context ? ` (${context})` : ''}.

Provide analysis in JSON format:

{
  "summary": "Brief overview of what happened in the test",
  "screensVisited": ["List of screens in order"],
  "actionsPerformed": ["User actions: tap X, type Y, scroll Z"],
  "issues": [
    {
      "type": "error | warning | info",
      "timestamp": "approx time if notable",
      "description": "What went wrong"
    }
  ],
  "uiQuality": {
    "rating": 1-10,
    "animations": "Assessment of animations",
    "responsiveness": "How fast UI responded",
    "notes": "Other observations"
  },
  "recommendations": ["Suggested improvements"]
}

Look for:
- Smooth vs janky animations
- Loading indicators and delays
- Error states and handling
- Visual glitches or layout issues
- Touch responsiveness
- Navigation clarity`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
    });

    return this.parseAnalysis(response.text || '');
  }

  async compareVideos(
    baselinePath: string,
    currentPath: string
  ): Promise<ComparisonResult> {
    if (!fs.existsSync(baselinePath) || !fs.existsSync(currentPath)) {
      throw new Error('One or both video files not found');
    }

    const baseline = fs.readFileSync(baselinePath).toString('base64');
    const current = fs.readFileSync(currentPath).toString('base64');
    const mimeType = this.getMimeType(baselinePath);

    console.log('📹 Comparing videos:');
    console.log(`   Baseline: ${path.basename(baselinePath)}`);
    console.log(`   Current:  ${path.basename(currentPath)}`);

    const prompt = `Compare these two mobile app test recordings.

VIDEO 1 = BASELINE (expected behavior)
VIDEO 2 = CURRENT (new version)

Provide comparison in JSON:

{
  "identical": true/false,
  "differences": ["Notable differences between recordings"],
  "regressions": ["Things that got WORSE in current"],
  "improvements": ["Things that got BETTER in current"]
}

Compare:
- Same screens visited?
- Same flow/navigation?
- Animation quality changes
- Performance differences
- Any new errors or missing features`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: baseline } },
          { inlineData: { mimeType, data: current } },
          { text: prompt },
        ],
      }],
    });

    return this.parseComparison(response.text || '');
  }

  async analyzeForAccessibility(videoPath: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const videoData = fs.readFileSync(videoPath);
    const base64 = videoData.toString('base64');
    const mimeType = this.getMimeType(videoPath);

    const prompt = `Analyze this mobile app recording for ACCESSIBILITY issues.

Respond in JSON:

{
  "score": 1-100,
  "issues": [
    "Specific accessibility problems observed"
  ],
  "recommendations": [
    "How to fix or improve accessibility"
  ]
}

Look for:
- Text contrast and readability
- Touch target sizes (should be 44x44 min)
- Focus indicators visible?
- Screen reader would work?
- Motion/animation concerns
- Color-only information
- Text scaling support`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
    });

    try {
      const json = response.text?.match(/\{[\s\S]*\}/)?.[0];
      return json ? JSON.parse(json) : { score: 0, issues: [], recommendations: [] };
    } catch {
      return { score: 0, issues: [response.text || ''], recommendations: [] };
    }
  }

  private parseAnalysis(text: string): VideoAnalysis {
    try {
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    } catch {}

    return {
      summary: text,
      screensVisited: [],
      actionsPerformed: [],
      issues: [],
      uiQuality: { rating: 0, animations: '', responsiveness: '', notes: text },
      recommendations: [],
    };
  }

  private parseComparison(text: string): ComparisonResult {
    try {
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    } catch {}

    return {
      identical: false,
      differences: [text],
      regressions: [],
      improvements: [],
    };
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm' }[ext] || 'video/mp4';
  }

  findVideos(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];

    const files: string[] = [];
    const scan = (d: string) => {
      for (const f of fs.readdirSync(d)) {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) scan(full);
        else if (/\.(mp4|mov|webm)$/i.test(f)) files.push(full);
      }
    };
    scan(dir);

    return files.sort((a, b) =>
      fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime()
    );
  }
}

// ============================================================================
// Test Helper
// ============================================================================

async function runTestWithRecording(
  testName: string,
  testFn: () => Promise<void>,
  analyzer: VideoAnalyzer,
  artifactsDir: string
): Promise<{
  passed: boolean;
  error?: string;
  analysis?: VideoAnalysis;
}> {
  let passed = false;
  let error: string | undefined;

  try {
    await testFn();
    passed = true;
  } catch (e: any) {
    error = e.message;
  }

  // Find latest video
  const videos = analyzer.findVideos(artifactsDir);
  if (videos.length === 0) {
    console.warn('⚠️ No video found for analysis');
    return { passed, error };
  }

  const analysis = await analyzer.analyzeVideo(videos[0], testName);

  return { passed, error, analysis };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Video-Based Test Analysis', () => {
  let analyzer: VideoAnalyzer;
  const artifactsDir = './e2e/artifacts';
  const baselinesDir = './e2e/baselines';

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    analyzer = new VideoAnalyzer(
      process.env.GEMINI_API_KEY!,
      'gemini-2.5-flash'
    );

    // Ensure directories exist
    if (!fs.existsSync(baselinesDir)) {
      fs.mkdirSync(baselinesDir, { recursive: true });
    }
  });

  describe('Post-Test Analysis', () => {
    it('should analyze login flow recording', async () => {
      const result = await runTestWithRecording(
        'Login Flow',
        async () => {
          // Perform login test actions
          await waitFor(element(by.id('login-screen')))
            .toBeVisible()
            .withTimeout(5000);

          await element(by.id('email-input')).typeText('test@example.com');
          await element(by.id('password-input')).typeText('password123');
          await element(by.id('login-button')).tap();

          await waitFor(element(by.id('home-screen')))
            .toBeVisible()
            .withTimeout(10000);
        },
        analyzer,
        artifactsDir
      );

      console.log('\n📊 Analysis Results:');
      console.log(`   Test passed: ${result.passed}`);

      if (result.analysis) {
        console.log(`   Summary: ${result.analysis.summary}`);
        console.log(`   Screens: ${result.analysis.screensVisited.join(' → ')}`);
        console.log(`   UI Quality: ${result.analysis.uiQuality.rating}/10`);

        if (result.analysis.issues.length > 0) {
          console.log('   Issues:');
          for (const issue of result.analysis.issues) {
            console.log(`     [${issue.type}] ${issue.description}`);
          }
        }

        // Fail on errors found in video
        const errors = result.analysis.issues.filter(i => i.type === 'error');
        expect(errors).toHaveLength(0);
      }

      expect(result.passed).toBe(true);
    });

    it('should analyze checkout flow for performance', async () => {
      const result = await runTestWithRecording(
        'Checkout Performance',
        async () => {
          // Checkout flow actions
          await element(by.id('cart-tab')).tap();
          await element(by.id('checkout-button')).tap();
          await element(by.id('confirm-order')).tap();
        },
        analyzer,
        artifactsDir
      );

      if (result.analysis) {
        console.log('\n🚀 Performance Analysis:');
        console.log(`   Responsiveness: ${result.analysis.uiQuality.responsiveness}`);
        console.log(`   Animations: ${result.analysis.uiQuality.animations}`);

        // UI quality should be at least 6/10
        expect(result.analysis.uiQuality.rating).toBeGreaterThanOrEqual(6);
      }
    });
  });

  describe('Regression Detection', () => {
    it('should compare current test with baseline', async () => {
      // First, run the test
      await device.launchApp({ newInstance: true });

      // Perform test actions...
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Find recordings
      const currentVideos = analyzer.findVideos(artifactsDir);
      const baselineVideos = analyzer.findVideos(baselinesDir);

      if (currentVideos.length === 0) {
        console.log('⚠️ No current recording found');
        return;
      }

      if (baselineVideos.length === 0) {
        console.log('ℹ️ No baseline - saving current as baseline');
        const src = currentVideos[0];
        const dest = path.join(baselinesDir, 'home-flow-baseline.mp4');
        fs.copyFileSync(src, dest);
        return;
      }

      const comparison = await analyzer.compareVideos(
        baselineVideos[0],
        currentVideos[0]
      );

      console.log('\n🔍 Comparison Results:');
      console.log(`   Identical: ${comparison.identical}`);

      if (comparison.differences.length > 0) {
        console.log('   Differences:');
        for (const diff of comparison.differences) {
          console.log(`     - ${diff}`);
        }
      }

      if (comparison.regressions.length > 0) {
        console.log('   ⚠️ Regressions:');
        for (const reg of comparison.regressions) {
          console.log(`     - ${reg}`);
        }
      }

      if (comparison.improvements.length > 0) {
        console.log('   ✅ Improvements:');
        for (const imp of comparison.improvements) {
          console.log(`     - ${imp}`);
        }
      }

      // Fail on regressions
      expect(comparison.regressions).toHaveLength(0);
    });
  });

  describe('Accessibility Analysis', () => {
    it('should analyze app for accessibility', async () => {
      // Run through app screens
      await device.launchApp({ newInstance: true });

      // Navigate through main screens
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Find recording
      const videos = analyzer.findVideos(artifactsDir);
      if (videos.length === 0) {
        console.log('⚠️ No recording found');
        return;
      }

      const a11y = await analyzer.analyzeForAccessibility(videos[0]);

      console.log('\n♿ Accessibility Analysis:');
      console.log(`   Score: ${a11y.score}/100`);

      if (a11y.issues.length > 0) {
        console.log('   Issues:');
        for (const issue of a11y.issues) {
          console.log(`     - ${issue}`);
        }
      }

      if (a11y.recommendations.length > 0) {
        console.log('   Recommendations:');
        for (const rec of a11y.recommendations) {
          console.log(`     - ${rec}`);
        }
      }

      // Accessibility score should be reasonable
      expect(a11y.score).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Batch Analysis', () => {
    it('should analyze all recent test recordings', async () => {
      const videos = analyzer.findVideos(artifactsDir).slice(0, 5);

      if (videos.length === 0) {
        console.log('No recordings to analyze');
        return;
      }

      console.log(`\n📹 Analyzing ${videos.length} recordings...\n`);

      const results: Array<{ file: string; analysis: VideoAnalysis }> = [];

      for (const video of videos) {
        try {
          const analysis = await analyzer.analyzeVideo(video);
          results.push({ file: path.basename(video), analysis });

          console.log(`${path.basename(video)}:`);
          console.log(`  Rating: ${analysis.uiQuality.rating}/10`);
          console.log(`  Issues: ${analysis.issues.length}`);
        } catch (e: any) {
          console.log(`${path.basename(video)}: Error - ${e.message}`);
        }
      }

      // Save batch report
      const report = {
        timestamp: new Date().toISOString(),
        totalVideos: results.length,
        averageRating: results.reduce((sum, r) => sum + r.analysis.uiQuality.rating, 0) / results.length,
        totalIssues: results.reduce((sum, r) => sum + r.analysis.issues.length, 0),
        results,
      };

      fs.writeFileSync(
        './e2e/reports/video-batch-analysis.json',
        JSON.stringify(report, null, 2)
      );

      console.log(`\n📄 Report saved to e2e/reports/video-batch-analysis.json`);
    });
  });
});
