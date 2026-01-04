/**
 * AppExplorer - Autonomous app exploration with visual intelligence
 *
 * Systematically explores mobile apps to:
 * - Discover all screens and navigation paths
 * - Find visual, functional, and accessibility issues
 * - Generate coverage reports
 * - Create test case suggestions
 */

import { device, element, by } from 'detox';
import { GeminiVisionHandler, VisionHandlerConfig, ScreenAnalysis } from '../handlers/GeminiVisionHandler';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ExplorationResult {
  screensDiscovered: string[];
  navigationMap: Map<string, string[]>; // screen -> [reachable screens]
  elementsFound: Map<string, ScreenAnalysis>;
  issuesFound: Array<{
    screen: string;
    type: 'visual' | 'functional' | 'accessibility' | 'performance';
    severity: 'low' | 'medium' | 'high';
    description: string;
    element?: string;
    screenshotPath?: string;
  }>;
  coverageScore: number;
  totalSteps: number;
  duration: number;
  suggestedTestCases: string[];
}

export interface ExplorerConfig extends VisionHandlerConfig {
  screenshotsDir?: string;
  maxSteps?: number;
  maxScreens?: number;
  maxDepth?: number;
  avoidPatterns?: string[];
  focusAreas?: string[];
  verbose?: boolean;
}

interface ExplorationState {
  currentScreen: string;
  visitedScreens: Set<string>;
  exploredElements: Set<string>;
  navigationStack: string[];
  depth: number;
}

// ============================================================================
// AppExplorer
// ============================================================================

export class AppExplorer {
  private handler: GeminiVisionHandler;
  private config: ExplorerConfig;
  private screenshotsDir: string;
  private state: ExplorationState;
  private issues: ExplorationResult['issuesFound'] = [];
  private screenAnalyses: Map<string, ScreenAnalysis> = new Map();
  private navigationMap: Map<string, string[]> = new Map();
  private suggestedTestCases: string[] = [];

  constructor(config: ExplorerConfig) {
    this.handler = new GeminiVisionHandler(config);
    this.config = {
      maxSteps: 50,
      maxScreens: 15,
      maxDepth: 5,
      avoidPatterns: ['logout', 'delete', 'remove', 'cancel subscription'],
      focusAreas: [],
      verbose: true,
      ...config,
    };
    this.screenshotsDir = config.screenshotsDir || './e2e/artifacts/exploration';
    this.state = this.initState();

    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  private initState(): ExplorationState {
    return {
      currentScreen: 'unknown',
      visitedScreens: new Set(),
      exploredElements: new Set(),
      navigationStack: [],
      depth: 0,
    };
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  // --------------------------------------------------------------------------
  // Main Exploration
  // --------------------------------------------------------------------------

  /**
   * Explore the app autonomously starting from current screen.
   */
  async explore(options: {
    startingContext?: string;
    onScreen?: (screen: ScreenAnalysis) => void;
    onIssue?: (issue: ExplorationResult['issuesFound'][0]) => void;
  } = {}): Promise<ExplorationResult> {
    const { startingContext, onScreen, onIssue } = options;
    const startTime = Date.now();

    // Reset state
    this.state = this.initState();
    this.issues = [];
    this.screenAnalyses.clear();
    this.navigationMap.clear();
    this.suggestedTestCases = [];

    this.log('\n🔍 Starting App Exploration');
    this.log('='.repeat(50));

    if (startingContext) {
      this.log(`Context: ${startingContext}`);
    }

    let step = 0;
    let consecutiveFailures = 0;

    while (step < this.config.maxSteps!) {
      step++;
      this.log(`\n📍 Step ${step}/${this.config.maxSteps}`);

      // Capture and analyze current screen
      const screenshot = await this.captureScreenshot(`explore-${step}`);
      const analysis = await this.handler.analyzeScreen(screenshot.base64);

      // Update state
      const previousScreen = this.state.currentScreen;
      this.state.currentScreen = analysis.screenName;

      if (!this.state.visitedScreens.has(analysis.screenName)) {
        this.state.visitedScreens.add(analysis.screenName);
        this.screenAnalyses.set(analysis.screenName, analysis);
        this.log(`  🆕 New screen discovered: ${analysis.screenName}`);

        // Track navigation
        if (previousScreen !== 'unknown' && previousScreen !== analysis.screenName) {
          if (!this.navigationMap.has(previousScreen)) {
            this.navigationMap.set(previousScreen, []);
          }
          this.navigationMap.get(previousScreen)!.push(analysis.screenName);
        }

        // Collect issues
        for (const issue of analysis.issues) {
          const explorationIssue = {
            screen: analysis.screenName,
            ...issue,
            screenshotPath: screenshot.path,
          };
          this.issues.push(explorationIssue);
          onIssue?.(explorationIssue);
          this.log(`  ⚠️ Issue: [${issue.severity}] ${issue.description}`);
        }

        // Collect test case suggestions
        this.suggestedTestCases.push(...analysis.suggestedTestCases);

        onScreen?.(analysis);
      } else {
        this.log(`  📍 On known screen: ${analysis.screenName}`);
      }

      // Check termination conditions
      if (this.state.visitedScreens.size >= this.config.maxScreens!) {
        this.log(`\n📊 Reached ${this.config.maxScreens} screens - stopping`);
        break;
      }

      // Decide next action
      const nextAction = await this.decideNextAction(analysis, screenshot.base64);

      if (nextAction.type === 'done') {
        this.log('\n✅ Exploration complete - no more unexplored elements');
        break;
      }

      // Execute action
      const success = await this.executeAction(nextAction);

      if (!success) {
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          this.log('  🔄 Multiple failures - trying to navigate back');
          await this.navigateBack();
          consecutiveFailures = 0;
        }
      } else {
        consecutiveFailures = 0;
      }

      await this.wait(600);
    }

    const duration = Date.now() - startTime;

    return this.buildResult(duration, step);
  }

  /**
   * Explore with focus on finding specific types of issues.
   */
  async exploreForIssues(
    issueType: 'visual' | 'accessibility' | 'functional' | 'performance'
  ): Promise<ExplorationResult> {
    const focusPrompts = {
      visual: 'Focus on visual bugs: overlapping elements, cut-off text, wrong colors, misaligned items.',
      accessibility: 'Focus on accessibility: contrast issues, small touch targets, missing labels.',
      functional: 'Focus on functional issues: broken buttons, non-working inputs, navigation problems.',
      performance: 'Focus on performance: loading delays, janky animations, unresponsive UI.',
    };

    return this.explore({
      startingContext: focusPrompts[issueType],
    });
  }

  // --------------------------------------------------------------------------
  // Decision Making
  // --------------------------------------------------------------------------

  private async decideNextAction(
    analysis: ScreenAnalysis,
    screenshot: string
  ): Promise<{ type: string; target: string; value?: string }> {
    // Find unexplored interactive elements
    const unexplored = analysis.elements.filter(
      (el) =>
        el.interactable &&
        !this.state.exploredElements.has(`${analysis.screenName}:${el.identifier}`) &&
        !this.shouldAvoid(el.identifier)
    );

    if (unexplored.length === 0) {
      // No unexplored elements on this screen
      if (this.state.navigationStack.length > 0) {
        return { type: 'back', target: '' };
      }
      return { type: 'done', target: '' };
    }

    // Prioritize elements based on type
    const priority = ['tab', 'button', 'input', 'toggle', 'list'];
    unexplored.sort((a, b) => {
      const aIndex = priority.indexOf(a.type) >= 0 ? priority.indexOf(a.type) : 99;
      const bIndex = priority.indexOf(b.type) >= 0 ? priority.indexOf(b.type) : 99;
      return aIndex - bIndex;
    });

    const nextElement = unexplored[0];
    this.state.exploredElements.add(`${analysis.screenName}:${nextElement.identifier}`);

    this.log(`  🎯 Next: ${nextElement.type} "${nextElement.identifier}"`);

    if (nextElement.type === 'input') {
      return { type: 'type', target: nextElement.identifier, value: 'test input' };
    }

    return { type: 'tap', target: nextElement.identifier };
  }

  private shouldAvoid(identifier: string): boolean {
    const lower = identifier.toLowerCase();
    return this.config.avoidPatterns!.some((pattern) =>
      lower.includes(pattern.toLowerCase())
    );
  }

  // --------------------------------------------------------------------------
  // Action Execution
  // --------------------------------------------------------------------------

  private async executeAction(action: { type: string; target: string; value?: string }): Promise<boolean> {
    try {
      switch (action.type) {
        case 'tap':
          await this.executeTap(action.target);
          this.state.navigationStack.push(this.state.currentScreen);
          break;

        case 'type':
          await this.executeType(action.target, action.value || '');
          break;

        case 'scroll':
          await this.executeScroll();
          break;

        case 'back':
          await this.navigateBack();
          break;

        default:
          return false;
      }

      return true;
    } catch (error: any) {
      this.log(`  ❌ Action failed: ${error.message}`);
      return false;
    }
  }

  private async executeTap(target: string): Promise<void> {
    if (this.isTestId(target)) {
      await element(by.id(target)).tap();
    } else {
      try {
        await element(by.text(target)).atIndex(0).tap();
      } catch {
        await element(by.label(target)).atIndex(0).tap();
      }
    }
  }

  private async executeType(target: string, value: string): Promise<void> {
    if (this.isTestId(target)) {
      await element(by.id(target)).clearText();
      await element(by.id(target)).typeText(value);
    }
  }

  private async executeScroll(): Promise<void> {
    try {
      await element(by.type('RCTScrollView')).atIndex(0).scroll(300, 'down');
    } catch {
      await element(by.type('UIScrollView')).atIndex(0).scroll(300, 'down');
    }
  }

  private async navigateBack(): Promise<void> {
    this.state.navigationStack.pop();
    try {
      await device.pressBack();
    } catch {
      try {
        await element(by.traits(['button'])).atIndex(0).tap();
      } catch {
        this.log('  Could not navigate back');
      }
    }
  }

  private isTestId(target: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(target) && !target.includes(' ');
  }

  // --------------------------------------------------------------------------
  // Screenshots
  // --------------------------------------------------------------------------

  private async captureScreenshot(name: string): Promise<{ base64: string; path: string }> {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}`;
    const screenshotPath = await device.takeScreenshot(filename);

    const buffer = fs.readFileSync(screenshotPath);
    const base64 = buffer.toString('base64');

    const destPath = path.join(this.screenshotsDir, `${filename}.png`);
    fs.copyFileSync(screenshotPath, destPath);

    return { base64, path: destPath };
  }

  // --------------------------------------------------------------------------
  // Results
  // --------------------------------------------------------------------------

  private buildResult(duration: number, totalSteps: number): ExplorationResult {
    const screens = [...this.state.visitedScreens];
    const totalElements = [...this.screenAnalyses.values()].reduce(
      (sum, a) => sum + a.elements.length,
      0
    );

    // Calculate coverage score
    const screenScore = Math.min(screens.length / 10, 1) * 40;
    const elementScore = Math.min(totalElements / 50, 1) * 30;
    const issueDetectionScore = this.issues.length > 0 ? 20 : 10;
    const depthScore = Math.min(this.state.depth / 3, 1) * 10;

    const coverageScore = Math.round(screenScore + elementScore + issueDetectionScore + depthScore);

    // Deduplicate test case suggestions
    const uniqueTestCases = [...new Set(this.suggestedTestCases)];

    this.log('\n' + '='.repeat(50));
    this.log('📊 Exploration Summary');
    this.log('='.repeat(50));
    this.log(`  Screens discovered: ${screens.length}`);
    this.log(`  Elements found: ${totalElements}`);
    this.log(`  Issues found: ${this.issues.length}`);
    this.log(`  Steps taken: ${totalSteps}`);
    this.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
    this.log(`  Coverage score: ${coverageScore}%`);

    return {
      screensDiscovered: screens,
      navigationMap: this.navigationMap,
      elementsFound: this.screenAnalyses,
      issuesFound: this.issues,
      coverageScore,
      totalSteps,
      duration,
      suggestedTestCases: uniqueTestCases,
    };
  }

  /**
   * Generate a JSON report of the exploration.
   */
  generateReport(): string {
    const screens = [...this.state.visitedScreens];

    return JSON.stringify({
      summary: {
        screensDiscovered: screens.length,
        elementsFound: [...this.screenAnalyses.values()].reduce(
          (sum, a) => sum + a.elements.length,
          0
        ),
        issuesFound: this.issues.length,
        issuesByType: {
          visual: this.issues.filter((i) => i.type === 'visual').length,
          functional: this.issues.filter((i) => i.type === 'functional').length,
          accessibility: this.issues.filter((i) => i.type === 'accessibility').length,
          performance: this.issues.filter((i) => i.type === 'performance').length,
        },
        issuesBySeverity: {
          high: this.issues.filter((i) => i.severity === 'high').length,
          medium: this.issues.filter((i) => i.severity === 'medium').length,
          low: this.issues.filter((i) => i.severity === 'low').length,
        },
      },
      screens: screens.map((s) => ({
        name: s,
        analysis: this.screenAnalyses.get(s),
        reachableFrom: [...this.navigationMap.entries()]
          .filter(([, targets]) => targets.includes(s))
          .map(([source]) => source),
        leadsTo: this.navigationMap.get(s) || [],
      })),
      issues: this.issues,
      suggestedTestCases: [...new Set(this.suggestedTestCases)],
    }, null, 2);
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default AppExplorer;
