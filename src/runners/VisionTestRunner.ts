/**
 * VisionTestRunner - Goal-based test execution with visual feedback
 *
 * Executes tests by analyzing screenshots and deciding next actions
 * based on visual state. Self-corrects when lost and works without
 * relying solely on testIDs.
 */

import { device, element, by } from 'detox';
import { GeminiVisionHandler, VisionHandlerConfig, VisionAction } from '../handlers/GeminiVisionHandler';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface StepResult {
  stepNumber: number;
  screenshot: string;
  screenshotPath: string;
  action: VisionAction;
  success: boolean;
  error?: string;
  timestamp: number;
  duration: number;
}

export interface GoalResult {
  success: boolean;
  goal: string;
  steps: StepResult[];
  finalState: string;
  totalDuration: number;
  screenshotsDir: string;
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    avgStepDuration: number;
  };
}

export interface RunnerConfig extends VisionHandlerConfig {
  screenshotsDir?: string;
  maxRetries?: number;
  stepDelay?: number;
  saveScreenshots?: boolean;
  verbose?: boolean;
}

// ============================================================================
// VisionTestRunner
// ============================================================================

export class VisionTestRunner {
  private handler: GeminiVisionHandler;
  private stepHistory: StepResult[] = [];
  private screenshotsDir: string;
  private config: RunnerConfig;

  constructor(config: RunnerConfig) {
    this.handler = new GeminiVisionHandler(config);
    this.config = {
      maxRetries: 2,
      stepDelay: 500,
      saveScreenshots: true,
      verbose: true,
      ...config,
    };
    this.screenshotsDir = config.screenshotsDir || './e2e/artifacts/vision-tests';
    this.ensureDir(this.screenshotsDir);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  // --------------------------------------------------------------------------
  // Core Execution
  // --------------------------------------------------------------------------

  /**
   * Execute a goal-based test with visual feedback loop.
   */
  async executeGoal(
    goal: string,
    options: {
      maxSteps?: number;
      screenshotPrefix?: string;
      onStep?: (step: StepResult) => void;
      onAnalysis?: (analysis: VisionAction) => void;
    } = {}
  ): Promise<GoalResult> {
    const { maxSteps = 20, screenshotPrefix = 'goal', onStep, onAnalysis } = options;
    const startTime = Date.now();

    // Reset for new goal
    this.handler.resetChat();
    await this.handler.startChat();
    this.stepHistory = [];

    this.log(`\n${'='.repeat(60)}`);
    this.log(`🎯 GOAL: ${goal}`);
    this.log(`${'='.repeat(60)}\n`);

    for (let step = 0; step < maxSteps; step++) {
      const stepStartTime = Date.now();
      this.log(`\n📍 Step ${step + 1}/${maxSteps}`);
      this.log('-'.repeat(40));

      // Capture current screen
      const screenshot = await this.captureScreenshot(`${screenshotPrefix}-step-${step + 1}`);

      // Build context from history
      const historyContext = this.stepHistory.slice(-5).map((s) =>
        `Step ${s.stepNumber}: ${s.action.action.type} on "${s.action.action.target}" → ${s.success ? '✅' : '❌'}`
      ).join('\n');

      const prompt = `
GOAL: ${goal}

PROGRESS SO FAR:
${historyContext || 'Just started'}

CURRENT STEP: ${step + 1}

Looking at the current screenshot, determine:
1. Have we achieved the goal? If yes, respond with action type "none" and high confidence
2. If not, what's the next action to take?
3. Are we stuck or going in circles? If so, suggest a recovery action

Remember: Base your decision on what you ACTUALLY SEE in the screenshot.`;

      const response = await this.handler.sendChatMessage(prompt, screenshot.base64);
      const analysis = this.parseVisionResponse(response);

      onAnalysis?.(analysis);

      // Log the analysis
      this.log(`👁️  Observation: ${analysis.observation.substring(0, 100)}...`);
      this.log(`📱 State: ${analysis.currentState}`);
      this.log(`🎬 Action: ${analysis.action.type} → "${analysis.action.target}"`);
      this.log(`💪 Confidence: ${analysis.confidence}`);
      if (analysis.reasoning) {
        this.log(`💭 Reasoning: ${analysis.reasoning}`);
      }
      if (analysis.concerns) {
        this.log(`⚠️  Concerns: ${analysis.concerns}`);
      }

      // Check if goal achieved
      if (analysis.action.type === 'none' && analysis.confidence === 'high') {
        const stepResult: StepResult = {
          stepNumber: step + 1,
          screenshot: screenshot.base64,
          screenshotPath: screenshot.path,
          action: analysis,
          success: true,
          timestamp: Date.now(),
          duration: Date.now() - stepStartTime,
        };
        this.stepHistory.push(stepResult);
        onStep?.(stepResult);

        this.log('\n✅ GOAL ACHIEVED!\n');

        return this.buildResult(true, goal, analysis.currentState, startTime);
      }

      // Execute the action
      const { success, error } = await this.executeAction(analysis);

      const stepResult: StepResult = {
        stepNumber: step + 1,
        screenshot: screenshot.base64,
        screenshotPath: screenshot.path,
        action: analysis,
        success,
        error,
        timestamp: Date.now(),
        duration: Date.now() - stepStartTime,
      };
      this.stepHistory.push(stepResult);
      onStep?.(stepResult);

      if (!success) {
        this.log(`❌ Action failed: ${error}`);

        if (analysis.confidence === 'low') {
          this.log('🔄 Low confidence action failed, attempting recovery...');
          await this.attemptRecovery();
        }
      }

      // Wait for UI to settle
      await this.wait(this.config.stepDelay!);
    }

    this.log('\n❌ MAX STEPS REACHED without achieving goal\n');

    return this.buildResult(false, goal, 'unknown', startTime);
  }

  /**
   * Analyze the current screen without taking action.
   */
  async analyzeCurrentScreen(context?: string): Promise<VisionAction> {
    const screenshot = await this.captureScreenshot('analysis');

    const prompt = context
      ? `Context: ${context}\n\nAnalyze this screenshot. What screen is this? What elements are available?`
      : 'Analyze this screenshot. What screen is this? What elements are available for interaction?';

    const response = await this.handler.runPrompt(prompt, screenshot.base64);
    return this.parseVisionResponse(response);
  }

  /**
   * Verify a visual condition on the current screen.
   */
  async verifyVisualCondition(condition: string): Promise<{
    satisfied: boolean;
    observation: string;
    confidence: string;
  }> {
    const screenshot = await this.captureScreenshot('verify');

    const prompt = `Verify this condition: "${condition}"

Return JSON:
{
  "satisfied": true/false,
  "observation": "what you see related to the condition",
  "confidence": "high | medium | low"
}`;

    const response = await this.handler.runPrompt(prompt, screenshot.base64);

    try {
      const json = response.match(/\{[\s\S]*\}/)?.[0];
      if (json) {
        return JSON.parse(json);
      }
    } catch {}

    return {
      satisfied: false,
      observation: response,
      confidence: 'low',
    };
  }

  // --------------------------------------------------------------------------
  // Action Execution
  // --------------------------------------------------------------------------

  private async executeAction(analysis: VisionAction): Promise<{ success: boolean; error?: string }> {
    const { action } = analysis;

    try {
      switch (action.type) {
        case 'tap':
          await this.executeTap(action);
          break;

        case 'type':
          await this.executeType(action);
          break;

        case 'scroll':
          await this.executeScroll(action);
          break;

        case 'swipe':
          await this.executeSwipe(action);
          break;

        case 'longPress':
          await this.executeLongPress(action);
          break;

        case 'back':
          await this.executeBack();
          break;

        case 'wait':
          await this.wait(parseInt(action.value || '1000'));
          break;

        case 'none':
          break;

        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }

      return { success: true };
    } catch (error: any) {
      // Try fallback targets if available
      if (action.fallbackTargets && action.fallbackTargets.length > 0) {
        for (const fallback of action.fallbackTargets) {
          try {
            this.log(`  ↳ Trying fallback: ${fallback}`);
            await this.executeTapOnTarget(fallback);
            return { success: true };
          } catch {
            continue;
          }
        }
      }

      // Try coordinates as last resort
      if (action.coordinates) {
        try {
          this.log(`  ↳ Trying coordinates: (${action.coordinates.x}, ${action.coordinates.y})`);
          await device.tap(action.coordinates.x, action.coordinates.y);
          return { success: true };
        } catch {}
      }

      return { success: false, error: error.message };
    }
  }

  private async executeTap(action: VisionAction['action']): Promise<void> {
    // Try testID first
    if (this.isTestId(action.target)) {
      await element(by.id(action.target)).tap();
      return;
    }

    // Try by text
    try {
      await element(by.text(action.target)).atIndex(0).tap();
      return;
    } catch {}

    // Try by label
    try {
      await element(by.label(action.target)).atIndex(0).tap();
      return;
    } catch {}

    // Fall back to coordinates if available
    if (action.coordinates) {
      await device.tap(action.coordinates.x, action.coordinates.y);
      return;
    }

    throw new Error(`Could not find element: ${action.target}`);
  }

  private async executeTapOnTarget(target: string): Promise<void> {
    if (this.isTestId(target)) {
      await element(by.id(target)).tap();
    } else {
      await element(by.text(target)).atIndex(0).tap();
    }
  }

  private async executeType(action: VisionAction['action']): Promise<void> {
    const text = action.value || '';

    if (this.isTestId(action.target)) {
      await element(by.id(action.target)).clearText();
      await element(by.id(action.target)).typeText(text);
    } else {
      try {
        await element(by.text(action.target)).atIndex(0).clearText();
        await element(by.text(action.target)).atIndex(0).typeText(text);
      } catch {
        await element(by.label(action.target)).atIndex(0).clearText();
        await element(by.label(action.target)).atIndex(0).typeText(text);
      }
    }
  }

  private async executeScroll(action: VisionAction['action']): Promise<void> {
    const direction = (action.value as 'up' | 'down' | 'left' | 'right') || 'down';
    const pixels = 300;

    if (this.isTestId(action.target)) {
      await element(by.id(action.target)).scroll(pixels, direction);
    } else {
      try {
        await element(by.type('RCTScrollView')).atIndex(0).scroll(pixels, direction);
      } catch {
        try {
          await element(by.type('UIScrollView')).atIndex(0).scroll(pixels, direction);
        } catch {
          await element(by.type('android.widget.ScrollView')).atIndex(0).scroll(pixels, direction);
        }
      }
    }
  }

  private async executeSwipe(action: VisionAction['action']): Promise<void> {
    const direction = (action.value as 'up' | 'down' | 'left' | 'right') || 'up';

    if (this.isTestId(action.target)) {
      await element(by.id(action.target)).swipe(direction);
    } else {
      await element(by.type('RCTView')).atIndex(0).swipe(direction);
    }
  }

  private async executeLongPress(action: VisionAction['action']): Promise<void> {
    if (this.isTestId(action.target)) {
      await element(by.id(action.target)).longPress();
    } else {
      await element(by.text(action.target)).atIndex(0).longPress();
    }
  }

  private async executeBack(): Promise<void> {
    try {
      await device.pressBack();
    } catch {
      // iOS doesn't have back button
      try {
        // Try tapping a back button
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
  // Recovery
  // --------------------------------------------------------------------------

  private async attemptRecovery(): Promise<void> {
    this.log('🔄 Attempting recovery...');

    const screenshot = await this.captureScreenshot('recovery');
    const recovery = await this.handler.runPrompt(
      `The previous action failed. Look at the current screen and suggest how to recover:
       - Is there an error dialog to dismiss?
       - Should we press back?
       - Should we scroll to find the element?
       - Is there a loading state we should wait for?

       What do you see and what should we do to recover?`,
      screenshot.base64
    );

    this.log(`Recovery analysis: ${recovery.substring(0, 200)}...`);

    // Try common recovery actions
    try {
      await device.pressBack();
    } catch {
      try {
        await device.tap(200, 400); // Dismiss potential modals
      } catch {
        await this.wait(2000);
      }
    }
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

    // Copy to our artifacts directory if saving is enabled
    let destPath = screenshotPath;
    if (this.config.saveScreenshots) {
      destPath = path.join(this.screenshotsDir, `${filename}.png`);
      fs.copyFileSync(screenshotPath, destPath);
    }

    return { base64, path: destPath };
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private parseVisionResponse(response: string): VisionAction {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    return {
      observation: response,
      currentState: 'unknown',
      action: { type: 'none', target: '' },
      confidence: 'low',
      concerns: 'Could not parse structured response',
    };
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildResult(
    success: boolean,
    goal: string,
    finalState: string,
    startTime: number
  ): GoalResult {
    const totalDuration = Date.now() - startTime;
    const successfulSteps = this.stepHistory.filter((s) => s.success).length;
    const failedSteps = this.stepHistory.filter((s) => !s.success).length;
    const avgStepDuration =
      this.stepHistory.length > 0
        ? this.stepHistory.reduce((sum, s) => sum + s.duration, 0) / this.stepHistory.length
        : 0;

    return {
      success,
      goal,
      steps: this.stepHistory,
      finalState,
      totalDuration,
      screenshotsDir: this.screenshotsDir,
      summary: {
        totalSteps: this.stepHistory.length,
        successfulSteps,
        failedSteps,
        avgStepDuration: Math.round(avgStepDuration),
      },
    };
  }

  // --------------------------------------------------------------------------
  // Reporting
  // --------------------------------------------------------------------------

  /**
   * Generate a JSON report of the test execution.
   */
  generateReport(): string {
    return JSON.stringify({
      summary: {
        totalSteps: this.stepHistory.length,
        successfulSteps: this.stepHistory.filter((s) => s.success).length,
        failedSteps: this.stepHistory.filter((s) => !s.success).length,
      },
      steps: this.stepHistory.map((s) => ({
        step: s.stepNumber,
        state: s.action.currentState,
        action: `${s.action.action.type} → ${s.action.action.target}`,
        success: s.success,
        error: s.error,
        screenshotPath: s.screenshotPath,
        duration: s.duration,
      })),
    }, null, 2);
  }

  /**
   * Get the step history for external processing.
   */
  getStepHistory(): StepResult[] {
    return [...this.stepHistory];
  }
}

export default VisionTestRunner;
