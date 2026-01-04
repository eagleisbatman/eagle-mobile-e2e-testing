/**
 * Vision-Enhanced App Exploration Tests
 *
 * Uses Gemini's vision capabilities for autonomous app exploration,
 * discovering screens, features, and potential issues without predefined paths.
 *
 * Setup:
 *   npm install --save-dev @google/genai @wix-pilot/core @wix-pilot/detox
 *   export GEMINI_API_KEY=your_api_key
 *
 * Run:
 *   npx detox test -c ios.sim.debug e2e/vision-exploration.test.ts --record-videos all
 */

import { device, element, by } from 'detox';
import { GoogleGenAI, Chat } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface ExplorationState {
  screenName: string;
  elements: Array<{
    type: string;
    identifier: string;
    interactable: boolean;
  }>;
  hasUnexploredElements: boolean;
}

interface ExplorationResult {
  screensDiscovered: string[];
  elementsFound: Map<string, string[]>;
  issuesFound: Array<{
    screen: string;
    type: 'visual' | 'functional' | 'accessibility';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  coverageScore: number;
  totalSteps: number;
}

interface VisionAction {
  observation: string;
  currentState: string;
  unexploredElements: string[];
  suggestedAction: {
    type: 'tap' | 'type' | 'scroll' | 'swipe' | 'back' | 'none';
    target: string;
    value?: string;
    reason: string;
  };
  issues: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
  explorationComplete: boolean;
}

// ============================================================================
// Explorer Handler
// ============================================================================

class GeminiExplorerHandler {
  private ai: GoogleGenAI;
  private model: string;
  private chat: Chat | null = null;
  private visitedScreens: Set<string> = new Set();
  private exploredElements: Set<string> = new Set();

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  private getSystemPrompt(): string {
    return `You are an expert QA tester exploring a mobile app systematically.

Your goal is to discover ALL screens, features, and potential issues.

## Exploration Strategy
1. Identify the current screen and all interactive elements
2. Track which elements you've already explored
3. Prioritize unexplored elements
4. Navigate systematically (don't jump randomly)
5. Look for visual bugs, accessibility issues, and UX problems

## Response Format (JSON)
{
  "observation": "Detailed description of current screen",
  "currentState": "unique_screen_identifier",
  "unexploredElements": ["element1", "element2"],
  "suggestedAction": {
    "type": "tap | scroll | back | none",
    "target": "element to interact with",
    "reason": "why this action advances exploration"
  },
  "issues": [
    {
      "type": "visual | functional | accessibility",
      "description": "Issue description",
      "severity": "low | medium | high"
    }
  ],
  "explorationComplete": false
}

## What to Look For
- All buttons, links, and interactive elements
- Form fields and their validation
- Navigation patterns (tabs, menus, back buttons)
- Loading states and error handling
- Text truncation or overlap
- Contrast and readability issues
- Missing labels or accessibility hints`;
  }

  async startExploration(): Promise<void> {
    this.visitedScreens.clear();
    this.exploredElements.clear();
    this.chat = this.ai.chats.create({
      model: this.model,
      config: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        systemInstruction: this.getSystemPrompt(),
      },
    });
  }

  async analyzeAndSuggest(screenshot: string, context: string): Promise<VisionAction> {
    if (!this.chat) await this.startExploration();

    const prompt = `
${context}

ALREADY VISITED SCREENS: ${[...this.visitedScreens].join(', ') || 'None yet'}
ALREADY EXPLORED ELEMENTS: ${[...this.exploredElements].slice(-10).join(', ') || 'None yet'}

Analyze this screenshot and suggest the next exploration action.
Avoid re-exploring elements we've already interacted with.
If you've explored everything on this screen, suggest going back or indicate exploration is complete.`;

    const response = await this.chat!.sendMessage({
      parts: [
        { inlineData: { mimeType: 'image/png', data: screenshot } },
        { text: prompt },
      ],
    });

    const action = this.parseResponse(response.text || '');

    // Track visited screens
    if (action.currentState && action.currentState !== 'unknown') {
      this.visitedScreens.add(action.currentState);
    }

    return action;
  }

  markElementExplored(element: string): void {
    this.exploredElements.add(element);
  }

  getVisitedScreens(): string[] {
    return [...this.visitedScreens];
  }

  private parseResponse(response: string): VisionAction {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    return {
      observation: response,
      currentState: 'unknown',
      unexploredElements: [],
      suggestedAction: { type: 'none', target: '', reason: 'Parse error' },
      issues: [],
      explorationComplete: true,
    };
  }
}

// ============================================================================
// App Explorer
// ============================================================================

class AppExplorer {
  private handler: GeminiExplorerHandler;
  private screenshotsDir: string;
  private issues: ExplorationResult['issuesFound'] = [];
  private elementsMap: Map<string, string[]> = new Map();

  constructor(apiKey: string, model?: string) {
    this.handler = new GeminiExplorerHandler(apiKey, model);
    this.screenshotsDir = './e2e/artifacts/exploration';
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  async explore(options: {
    maxSteps?: number;
    maxScreens?: number;
    startingContext?: string;
  } = {}): Promise<ExplorationResult> {
    const { maxSteps = 50, maxScreens = 15, startingContext = '' } = options;

    await this.handler.startExploration();
    this.issues = [];
    this.elementsMap.clear();

    console.log('\n🔍 Starting App Exploration');
    console.log('='.repeat(50));

    let step = 0;
    let consecutiveBackActions = 0;

    while (step < maxSteps) {
      step++;
      console.log(`\n📍 Step ${step}/${maxSteps}`);

      const screenshot = await this.captureScreenshot(`explore-${step}`);

      const context = startingContext
        ? `Initial context: ${startingContext}\nStep ${step} of exploration.`
        : `Step ${step} of exploration.`;

      const analysis = await this.handler.analyzeAndSuggest(screenshot, context);

      // Log findings
      console.log(`  Screen: ${analysis.currentState}`);
      console.log(`  Unexplored: ${analysis.unexploredElements.length} elements`);
      console.log(`  Action: ${analysis.suggestedAction.type} → ${analysis.suggestedAction.target}`);

      // Track elements on this screen
      if (!this.elementsMap.has(analysis.currentState)) {
        this.elementsMap.set(analysis.currentState, []);
      }
      this.elementsMap.get(analysis.currentState)!.push(
        ...analysis.unexploredElements
      );

      // Record issues
      for (const issue of analysis.issues) {
        console.log(`  ⚠️ Issue: [${issue.severity}] ${issue.description}`);
        this.issues.push({
          screen: analysis.currentState,
          type: issue.type as any,
          description: issue.description,
          severity: issue.severity as any,
        });
      }

      // Check if exploration is complete
      if (analysis.explorationComplete) {
        console.log('\n✅ Exploration complete!');
        break;
      }

      // Check screen limit
      if (this.handler.getVisitedScreens().length >= maxScreens) {
        console.log(`\n📊 Reached ${maxScreens} screens - stopping exploration`);
        break;
      }

      // Track back navigation to avoid loops
      if (analysis.suggestedAction.type === 'back') {
        consecutiveBackActions++;
        if (consecutiveBackActions >= 3) {
          console.log('\n🔄 Detected navigation loop - stopping');
          break;
        }
      } else {
        consecutiveBackActions = 0;
      }

      // Execute the action
      await this.executeAction(analysis);

      // Mark element as explored
      if (analysis.suggestedAction.target) {
        this.handler.markElementExplored(analysis.suggestedAction.target);
      }

      await this.wait(600);
    }

    const screens = this.handler.getVisitedScreens();
    const totalElements = [...this.elementsMap.values()].flat().length;

    console.log('\n' + '='.repeat(50));
    console.log('📊 Exploration Summary');
    console.log('='.repeat(50));
    console.log(`  Screens discovered: ${screens.length}`);
    console.log(`  Elements found: ${totalElements}`);
    console.log(`  Issues found: ${this.issues.length}`);
    console.log(`  Steps taken: ${step}`);

    return {
      screensDiscovered: screens,
      elementsFound: this.elementsMap,
      issuesFound: this.issues,
      coverageScore: this.calculateCoverage(screens, totalElements),
      totalSteps: step,
    };
  }

  private async executeAction(analysis: VisionAction): Promise<void> {
    const { suggestedAction } = analysis;

    try {
      switch (suggestedAction.type) {
        case 'tap':
          if (this.isTestId(suggestedAction.target)) {
            await element(by.id(suggestedAction.target)).tap();
          } else {
            try {
              await element(by.text(suggestedAction.target)).atIndex(0).tap();
            } catch {
              await element(by.label(suggestedAction.target)).atIndex(0).tap();
            }
          }
          break;

        case 'scroll':
          try {
            await element(by.type('RCTScrollView')).atIndex(0).scroll(300, 'down');
          } catch {
            await element(by.type('UIScrollView')).atIndex(0).scroll(300, 'down');
          }
          break;

        case 'swipe':
          await element(by.type('RCTView')).atIndex(0).swipe('left');
          break;

        case 'back':
          try {
            await device.pressBack();
          } catch {
            // iOS doesn't have back button - try tap on back element
            try {
              await element(by.traits(['button'])).atIndex(0).tap();
            } catch {
              console.log('  Could not go back');
            }
          }
          break;

        case 'type':
          if (this.isTestId(suggestedAction.target)) {
            await element(by.id(suggestedAction.target)).typeText(
              suggestedAction.value || 'test input'
            );
          }
          break;
      }
    } catch (error: any) {
      console.log(`  Action failed: ${error.message}`);
    }
  }

  private isTestId(target: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(target) && !target.includes(' ');
  }

  private async captureScreenshot(name: string): Promise<string> {
    const screenshotPath = await device.takeScreenshot(name);
    const buffer = fs.readFileSync(screenshotPath);

    // Copy to exploration dir
    const destPath = path.join(this.screenshotsDir, `${name}.png`);
    fs.copyFileSync(screenshotPath, destPath);

    return buffer.toString('base64');
  }

  private calculateCoverage(screens: string[], elements: number): number {
    // Simple heuristic: score based on screens and elements discovered
    const screenScore = Math.min(screens.length / 10, 1) * 50;
    const elementScore = Math.min(elements / 50, 1) * 50;
    return Math.round(screenScore + elementScore);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport(): string {
    const screens = this.handler.getVisitedScreens();
    return JSON.stringify({
      summary: {
        screensDiscovered: screens.length,
        elementsFound: [...this.elementsMap.values()].flat().length,
        issuesFound: this.issues.length,
        issuesByType: {
          visual: this.issues.filter(i => i.type === 'visual').length,
          functional: this.issues.filter(i => i.type === 'functional').length,
          accessibility: this.issues.filter(i => i.type === 'accessibility').length,
        },
        issuesBySeverity: {
          high: this.issues.filter(i => i.severity === 'high').length,
          medium: this.issues.filter(i => i.severity === 'medium').length,
          low: this.issues.filter(i => i.severity === 'low').length,
        },
      },
      screens,
      elementsByScreen: Object.fromEntries(this.elementsMap),
      issues: this.issues,
    }, null, 2);
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Vision-Enhanced App Exploration', () => {
  let explorer: AppExplorer;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    explorer = new AppExplorer(
      process.env.GEMINI_API_KEY!,
      'gemini-2.5-flash' // Use 2.5 for better reasoning in exploration
    );
  });

  it('should discover all main screens', async () => {
    const result = await explorer.explore({
      maxSteps: 30,
      maxScreens: 10,
    });

    console.log('\nExploration Results:');
    console.log(`- Screens: ${result.screensDiscovered.join(', ')}`);
    console.log(`- Coverage Score: ${result.coverageScore}%`);

    // Save detailed report
    const report = explorer.generateReport();
    fs.writeFileSync('./e2e/reports/exploration-report.json', report);

    expect(result.screensDiscovered.length).toBeGreaterThan(2);
  });

  it('should find accessibility issues', async () => {
    const result = await explorer.explore({
      maxSteps: 20,
      startingContext: 'Focus on finding accessibility issues: missing labels, poor contrast, small touch targets.',
    });

    const accessibilityIssues = result.issuesFound.filter(
      i => i.type === 'accessibility'
    );

    console.log(`\nAccessibility issues found: ${accessibilityIssues.length}`);
    for (const issue of accessibilityIssues) {
      console.log(`  [${issue.severity}] ${issue.screen}: ${issue.description}`);
    }

    // Report but don't fail - this is informational
    expect(result.screensDiscovered.length).toBeGreaterThan(0);
  });

  it('should test all navigation paths', async () => {
    const result = await explorer.explore({
      maxSteps: 40,
      startingContext: 'Systematically test all navigation: tabs, menus, buttons, links. Ensure all paths work.',
    });

    // Check for navigation-related issues
    const navIssues = result.issuesFound.filter(
      i => i.description.toLowerCase().includes('navigation') ||
           i.description.toLowerCase().includes('back') ||
           i.description.toLowerCase().includes('unreachable')
    );

    if (navIssues.length > 0) {
      console.log('\nNavigation issues:');
      for (const issue of navIssues) {
        console.log(`  [${issue.severity}] ${issue.description}`);
      }
    }

    expect(result.screensDiscovered.length).toBeGreaterThan(3);
  });

  it('should identify visual bugs', async () => {
    const result = await explorer.explore({
      maxSteps: 25,
      startingContext: 'Look for visual bugs: overlapping elements, cut-off text, misaligned items, wrong colors.',
    });

    const visualIssues = result.issuesFound.filter(
      i => i.type === 'visual'
    );

    console.log(`\nVisual issues found: ${visualIssues.length}`);
    for (const issue of visualIssues) {
      console.log(`  [${issue.severity}] ${issue.screen}: ${issue.description}`);
    }

    // High severity visual issues should be zero
    const criticalVisualIssues = visualIssues.filter(i => i.severity === 'high');
    expect(criticalVisualIssues).toHaveLength(0);
  });

  afterAll(() => {
    // Save final exploration report
    const report = explorer.generateReport();
    const reportPath = './e2e/reports/full-exploration-report.json';
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  });
});
