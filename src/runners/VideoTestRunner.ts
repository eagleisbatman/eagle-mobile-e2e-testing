/**
 * VideoTestRunner - Video analysis for comprehensive test validation
 *
 * Analyzes recorded test videos for:
 * - Post-test issue detection
 * - Regression comparison with baselines
 * - Accessibility auditing
 * - Performance analysis
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface VideoAnalysis {
  summary: string;
  screensVisited: string[];
  actionsPerformed: string[];
  flowDescription: string;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    timestamp?: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  uiQuality: {
    rating: number;
    animations: string;
    responsiveness: string;
    consistency: string;
    notes: string;
  };
  performance: {
    loadingStates: string[];
    delays: string[];
    smoothness: string;
  };
  recommendations: string[];
}

export interface ComparisonResult {
  identical: boolean;
  overallMatch: number; // 0-100 percentage
  differences: string[];
  regressions: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp?: string;
  }>;
  improvements: string[];
  missingFeatures: string[];
  newFeatures: string[];
}

export interface AccessibilityAudit {
  score: number;
  wcagLevel: 'A' | 'AA' | 'AAA' | 'unknown';
  issues: Array<{
    criterion: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    element?: string;
    recommendation: string;
  }>;
  passedChecks: string[];
  recommendations: string[];
}

export interface VideoRunnerConfig {
  apiKey: string;
  model?: string;
  baselinesDir?: string;
  verbose?: boolean;
}

// ============================================================================
// VideoTestRunner
// ============================================================================

export class VideoTestRunner {
  private ai: GoogleGenAI;
  private model: string;
  private baselinesDir: string;
  private verbose: boolean;

  constructor(config: VideoRunnerConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gemini-2.5-flash';
    this.baselinesDir = config.baselinesDir || './e2e/baselines';
    this.verbose = config.verbose ?? true;

    if (!fs.existsSync(this.baselinesDir)) {
      fs.mkdirSync(this.baselinesDir, { recursive: true });
    }
  }

  private log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  // --------------------------------------------------------------------------
  // Video Analysis
  // --------------------------------------------------------------------------

  /**
   * Analyze a recorded test video comprehensively.
   */
  async analyzeVideo(videoPath: string, context?: string): Promise<VideoAnalysis> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video not found: ${videoPath}`);
    }

    const videoData = fs.readFileSync(videoPath);
    const base64 = videoData.toString('base64');
    const mimeType = this.getMimeType(videoPath);

    this.log(`📹 Analyzing video: ${path.basename(videoPath)}`);
    this.log(`   Size: ${(videoData.length / 1024 / 1024).toFixed(2)} MB`);

    const prompt = `Analyze this mobile app test recording${context ? ` (Context: ${context})` : ''}.

Provide comprehensive analysis in JSON:

{
  "summary": "Brief overview of what happened in the test",
  "screensVisited": ["List of screens/pages visited in order"],
  "actionsPerformed": ["User actions: tap X, type Y, scroll Z"],
  "flowDescription": "Natural language description of the user journey",
  "issues": [
    {
      "type": "error | warning | info",
      "timestamp": "approximate time",
      "description": "What went wrong or could be improved",
      "severity": "low | medium | high"
    }
  ],
  "uiQuality": {
    "rating": 1-10,
    "animations": "Assessment of animation quality",
    "responsiveness": "How fast UI responded to inputs",
    "consistency": "Visual consistency across screens",
    "notes": "Other quality observations"
  },
  "performance": {
    "loadingStates": ["Observed loading indicators"],
    "delays": ["Notable delays in response"],
    "smoothness": "Overall smoothness assessment"
  },
  "recommendations": ["Suggested improvements or additional tests"]
}

Look for:
- Navigation flow smoothness
- Loading state handling
- Error state visibility
- Visual glitches or layout issues
- Animation jank or stuttering
- Touch responsiveness
- Text readability
- Color consistency`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      config: { temperature: 0.2 },
    });

    return this.parseVideoAnalysis(response.text || '');
  }

  /**
   * Analyze video for real-time issues (streaming analysis simulation).
   */
  async analyzeVideoStream(
    videoPath: string,
    onIssue: (issue: { timestamp: string; description: string; severity: string }) => void
  ): Promise<VideoAnalysis> {
    const analysis = await this.analyzeVideo(videoPath, 'Focus on detecting issues in real-time');

    // Emit issues as they would have been detected
    for (const issue of analysis.issues) {
      onIssue({
        timestamp: issue.timestamp || 'unknown',
        description: issue.description,
        severity: issue.severity,
      });
    }

    return analysis;
  }

  // --------------------------------------------------------------------------
  // Baseline Comparison
  // --------------------------------------------------------------------------

  /**
   * Compare current test video with a baseline recording.
   */
  async compareWithBaseline(
    currentVideoPath: string,
    baselineName: string
  ): Promise<ComparisonResult> {
    const baselinePath = path.join(this.baselinesDir, `${baselineName}.mp4`);

    if (!fs.existsSync(baselinePath)) {
      this.log(`ℹ️ No baseline found. Saving current as baseline: ${baselineName}`);
      await this.saveAsBaseline(currentVideoPath, baselineName);
      return {
        identical: true,
        overallMatch: 100,
        differences: [],
        regressions: [],
        improvements: [],
        missingFeatures: [],
        newFeatures: ['Baseline created'],
      };
    }

    return this.compareVideos(baselinePath, currentVideoPath);
  }

  /**
   * Compare two video recordings.
   */
  async compareVideos(baselinePath: string, currentPath: string): Promise<ComparisonResult> {
    if (!fs.existsSync(baselinePath) || !fs.existsSync(currentPath)) {
      throw new Error('One or both video files not found');
    }

    const baselineData = fs.readFileSync(baselinePath).toString('base64');
    const currentData = fs.readFileSync(currentPath).toString('base64');
    const mimeType = this.getMimeType(baselinePath);

    this.log('📹 Comparing videos:');
    this.log(`   Baseline: ${path.basename(baselinePath)}`);
    this.log(`   Current:  ${path.basename(currentPath)}`);

    const prompt = `Compare these two mobile app test recordings.

VIDEO 1 = BASELINE (expected behavior from previous version)
VIDEO 2 = CURRENT (actual behavior from current version)

Provide detailed comparison in JSON:

{
  "identical": true/false,
  "overallMatch": 0-100,
  "differences": ["Notable differences between recordings"],
  "regressions": [
    {
      "description": "What got worse",
      "severity": "low | medium | high",
      "timestamp": "when it occurs"
    }
  ],
  "improvements": ["Things that got better"],
  "missingFeatures": ["Features in baseline but not in current"],
  "newFeatures": ["Features in current but not in baseline"]
}

Compare:
- Same screens visited in same order?
- Same navigation flow?
- Animation quality changes
- Performance differences (faster/slower)
- UI changes (layout, colors, text)
- Error handling differences
- Loading state differences`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: baselineData } },
          { inlineData: { mimeType, data: currentData } },
          { text: prompt },
        ],
      }],
      config: { temperature: 0.1 },
    });

    return this.parseComparisonResult(response.text || '');
  }

  /**
   * Save a video as a baseline for future comparisons.
   */
  async saveAsBaseline(videoPath: string, name: string): Promise<string> {
    const ext = path.extname(videoPath);
    const baselinePath = path.join(this.baselinesDir, `${name}${ext}`);
    fs.copyFileSync(videoPath, baselinePath);
    this.log(`💾 Baseline saved: ${baselinePath}`);
    return baselinePath;
  }

  // --------------------------------------------------------------------------
  // Accessibility Audit
  // --------------------------------------------------------------------------

  /**
   * Analyze video for accessibility issues.
   */
  async auditAccessibility(videoPath: string): Promise<AccessibilityAudit> {
    const videoData = fs.readFileSync(videoPath);
    const base64 = videoData.toString('base64');
    const mimeType = this.getMimeType(videoPath);

    this.log(`♿ Auditing accessibility: ${path.basename(videoPath)}`);

    const prompt = `Analyze this mobile app recording for ACCESSIBILITY issues.

Evaluate against WCAG 2.1 guidelines. Return JSON:

{
  "score": 0-100,
  "wcagLevel": "A | AA | AAA | unknown",
  "issues": [
    {
      "criterion": "WCAG criterion (e.g., 1.4.3 Contrast)",
      "severity": "low | medium | high",
      "description": "What's wrong",
      "element": "Which element if identifiable",
      "recommendation": "How to fix"
    }
  ],
  "passedChecks": ["Accessibility aspects that look good"],
  "recommendations": ["General accessibility improvements"]
}

Check for:
- Text contrast (4.5:1 for normal, 3:1 for large)
- Touch target sizes (minimum 44x44 points)
- Focus indicators visible?
- Text scaling support
- Color-only information
- Motion/animation concerns
- Screen reader compatibility hints
- Keyboard/switch access support
- Error identification
- Labels and instructions`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      config: { temperature: 0.2 },
    });

    return this.parseAccessibilityAudit(response.text || '');
  }

  // --------------------------------------------------------------------------
  // Multi-Device Comparison
  // --------------------------------------------------------------------------

  /**
   * Compare the same flow across different devices.
   */
  async compareAcrossDevices(
    videos: Array<{ path: string; device: string; platform: string }>
  ): Promise<{
    consistencyScore: number;
    platformDifferences: Array<{
      ios: string;
      android: string;
      difference: string;
    }>;
    deviceDifferences: Array<{
      device1: string;
      device2: string;
      difference: string;
    }>;
    recommendations: string[];
  }> {
    if (videos.length < 2) {
      throw new Error('Need at least 2 videos to compare');
    }

    const parts: any[] = [];

    for (const video of videos) {
      const data = fs.readFileSync(video.path).toString('base64');
      parts.push({
        inlineData: { mimeType: this.getMimeType(video.path), data },
      });
    }

    const deviceList = videos.map((v) => `${v.device} (${v.platform})`).join(', ');

    parts.push({
      text: `Compare these ${videos.length} recordings of the same app flow on different devices: ${deviceList}

Return JSON:
{
  "consistencyScore": 0-100,
  "platformDifferences": [
    {
      "ios": "How it appears on iOS",
      "android": "How it appears on Android",
      "difference": "What's different"
    }
  ],
  "deviceDifferences": [
    {
      "device1": "Device name",
      "device2": "Device name",
      "difference": "What's different"
    }
  ],
  "recommendations": ["How to improve cross-device consistency"]
}

Look for:
- Layout differences
- Font rendering
- Color differences
- Animation smoothness
- Touch target sizes
- Navigation patterns
- Platform-specific UI elements`,
    });

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ parts }],
      config: { temperature: 0.2 },
    });

    try {
      const json = response.text?.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    } catch {}

    return {
      consistencyScore: 0,
      platformDifferences: [],
      deviceDifferences: [],
      recommendations: [response.text || 'Analysis failed'],
    };
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  /**
   * Find all video files in a directory.
   */
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

  /**
   * Get the most recent video from artifacts directory.
   */
  getLatestVideo(artifactsDir: string = './e2e/artifacts'): string | null {
    const videos = this.findVideos(artifactsDir);
    return videos.length > 0 ? videos[0] : null;
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm' }[ext] || 'video/mp4';
  }

  // --------------------------------------------------------------------------
  // Parsing
  // --------------------------------------------------------------------------

  private parseVideoAnalysis(text: string): VideoAnalysis {
    try {
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    } catch {}

    return {
      summary: text,
      screensVisited: [],
      actionsPerformed: [],
      flowDescription: text,
      issues: [],
      uiQuality: { rating: 0, animations: '', responsiveness: '', consistency: '', notes: text },
      performance: { loadingStates: [], delays: [], smoothness: '' },
      recommendations: [],
    };
  }

  private parseComparisonResult(text: string): ComparisonResult {
    try {
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    } catch {}

    return {
      identical: false,
      overallMatch: 0,
      differences: [text],
      regressions: [],
      improvements: [],
      missingFeatures: [],
      newFeatures: [],
    };
  }

  private parseAccessibilityAudit(text: string): AccessibilityAudit {
    try {
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (json) return JSON.parse(json);
    } catch {}

    return {
      score: 0,
      wcagLevel: 'unknown',
      issues: [],
      passedChecks: [],
      recommendations: [text],
    };
  }
}

export default VideoTestRunner;
