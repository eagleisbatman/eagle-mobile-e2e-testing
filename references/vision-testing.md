# Vision-Enhanced E2E Testing Reference

AI-powered visual testing using Google Gemini models for intelligent mobile app testing.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Model Selection](#model-selection)
4. [Vision Prompt Handler](#vision-prompt-handler)
5. [Vision Test Runner](#vision-test-runner)
6. [Video Test Runner](#video-test-runner)
7. [Example Tests](#example-tests)
8. [Best Practices](#best-practices)
9. [Cost Estimation](#cost-estimation)

---

## Overview

### The Problem with Traditional E2E Testing

Traditional Detox tests with Wix Pilot operate on testIDs and view hierarchy but:
- **Tests get "lost"** - The AI can't see actual visual state
- **Shallow coverage** - Only tests what it knows exists from code analysis
- **No visual validation** - Tests pass even when UI is visually broken
- **Blind navigation** - Can't adapt when unexpected states occur

### The Solution: Vision-First Testing

Add a visual intelligence layer using Gemini's vision capabilities to:
- **Decide next actions** based on what's visible on screen
- **Validate visual correctness** (not just element presence)
- **Self-correct when lost** by analyzing the current screen
- **Discover elements** without relying solely on testIDs

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Orchestrator                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │  Gemini Model   │◄──►│    Screenshot Analyzer      │    │
│  │  (3 Flash /     │    │  - Screen state detection   │    │
│  │   2.5 Flash /   │    │  - Element discovery        │    │
│  │   2.5 Pro)      │    │  - Visual validation        │    │
│  │                 │    │  - Error detection          │    │
│  └────────┬────────┘    └─────────────────────────────┘    │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Action Decision Engine                  │   │
│  │  - Compare visual state vs expected state            │   │
│  │  - Generate next action (tap, scroll, type)          │   │
│  │  - Self-correct if lost                              │   │
│  └────────┬────────────────────────────────────────────┘   │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Detox Executor                     │   │
│  │  - Execute actions via testIDs when available        │   │
│  │  - Fall back to coordinates when needed              │   │
│  │  - Capture screenshots after each action             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
# Install the new Google Gen AI SDK (replaces @google/generative-ai)
npm install --save-dev @google/genai

# Install Wix Pilot packages
npm install --save-dev @wix-pilot/core @wix-pilot/detox

# Detox (if not already installed)
npm install --save-dev detox jest @types/jest
```

### Environment Setup

```bash
# Add to your .env file
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/).

---

## Model Selection

### Available Gemini Models

| Model | Model ID | Vision | Speed | Cost | Best For |
|-------|----------|--------|-------|------|----------|
| **Gemini 3 Flash** | `gemini-3-flash` | Excellent | Fastest | $0.50/1M input | **Recommended** - Best balance |
| **Gemini 2.5 Flash** | `gemini-2.5-flash` | Excellent | Fast | $$ | Thinking capabilities |
| **Gemini 2.5 Pro** | `gemini-2.5-pro` | Excellent | Medium | $$$ | Complex reasoning |
| **Gemini 2.0 Flash** | `gemini-2.0-flash` | Good | Fast | $ | Budget option |

### Recommended: Gemini 3 Flash

- **3x faster** than 2.5 Pro while matching performance
- Best mobile UI understanding
- Native understanding of touch interfaces
- Lowest cost at scale
- Supports `thinkingLevel` for adaptive reasoning

### Choosing a Model

```typescript
// For speed-critical testing (recommended for most cases)
const model = 'gemini-3-flash';

// For complex multi-step reasoning
const model = 'gemini-2.5-pro';

// For budget-conscious high-volume testing
const model = 'gemini-2.0-flash';
```

---

## Vision Prompt Handler

### GeminiVisionHandler

A vision-first prompt handler that uses Gemini for intelligent screen analysis.

```typescript
// e2e/handlers/GeminiVisionHandler.ts
import { GoogleGenAI, Chat, Content } from '@google/genai';
import { PromptHandler } from '@wix-pilot/core';

export interface VisionHandlerConfig {
  apiKey: string;
  model?: 'gemini-3-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash';
  thinkingLevel?: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiVisionHandler implements PromptHandler {
  private ai: GoogleGenAI;
  private model: string;
  private chat: Chat | null = null;
  private config: VisionHandlerConfig;

  constructor(config: VisionHandlerConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gemini-3-flash';
    this.config = config;
  }

  private getSystemPrompt(): string {
    return `You are an expert mobile app tester with VISION capabilities.

CRITICAL: You can SEE the screenshot. Base your decisions on what you ACTUALLY SEE, not assumptions.

## When Analyzing a Screenshot

1. **DESCRIBE** what you see on screen (UI elements, text, buttons, states)
2. **IDENTIFY** interactive elements (buttons, inputs, tabs, toggles, etc.)
3. **DETECT** loading states, errors, or unexpected conditions
4. **DETERMINE** the current app state/screen

## When Given a Task

1. Look at the screenshot FIRST
2. Find the relevant element VISUALLY
3. If element has a testID, prefer using it
4. If no testID visible, describe element by:
   - Position (top-left, center, bottom, near X element)
   - Appearance (blue button, text field with placeholder "Email")
   - Text content (button says "Submit", label shows "Username")

## Response Format

Always respond with valid JSON:

{
  "observation": "Detailed description of what I see on the screen",
  "currentState": "screen_name or state (e.g., login_screen, home_screen, loading, error, unknown)",
  "elements": [
    {
      "type": "button | input | toggle | tab | list | text | image",
      "identifier": "testID if visible, or visual description",
      "state": "enabled | disabled | selected | loading",
      "position": "top | center | bottom | left | right"
    }
  ],
  "action": {
    "type": "tap | type | scroll | swipe | longPress | wait | none",
    "target": "testID or visual description of element",
    "value": "text to type, scroll direction, or wait duration",
    "coordinates": { "x": 0, "y": 0 },
    "fallbackTargets": ["alternative target 1", "alternative target 2"]
  },
  "confidence": "high | medium | low",
  "reasoning": "Why I chose this action",
  "concerns": "Any issues, uncertainties, or potential problems"
}

## Important Guidelines

- NEVER guess or assume - only report what you can see
- If an element isn't visible, say so and suggest scrolling
- Report loading spinners, skeleton screens, and async states
- Note any visual bugs (overlapping text, cut-off elements, wrong colors)
- Identify both the current screen AND any overlays/modals/alerts`;
  }

  async runPrompt(prompt: string, image?: string): Promise<string> {
    const contents: Content[] = [];
    const parts: any[] = [];

    // Add system prompt context
    parts.push({ text: this.getSystemPrompt() + '\n\n---\n\n' + prompt });

    // Add image if provided
    if (image) {
      parts.unshift({
        inlineData: {
          mimeType: 'image/png',
          data: image,
        },
      });
    }

    contents.push({ role: 'user', parts });

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          temperature: this.config.temperature ?? 0.2,
          maxOutputTokens: this.config.maxOutputTokens ?? 4096,
          // Gemini 3 supports thinkingLevel
          ...(this.model.startsWith('gemini-3') && this.config.thinkingLevel && {
            thinkingConfig: {
              thinkingLevel: this.config.thinkingLevel,
            },
          }),
        },
      });

      return response.text || '';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Start a new chat session for multi-turn conversations
   */
  async startChat(): Promise<void> {
    this.chat = this.ai.chats.create({
      model: this.model,
      config: {
        temperature: this.config.temperature ?? 0.2,
        maxOutputTokens: this.config.maxOutputTokens ?? 4096,
        systemInstruction: this.getSystemPrompt(),
      },
    });
  }

  /**
   * Send a message in an ongoing chat session
   */
  async sendChatMessage(prompt: string, image?: string): Promise<string> {
    if (!this.chat) {
      await this.startChat();
    }

    const parts: any[] = [];

    if (image) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: image,
        },
      });
    }

    parts.push({ text: prompt });

    const response = await this.chat!.sendMessage({ parts });
    return response.text || '';
  }

  /**
   * Reset the chat session (call between tests)
   */
  resetChat(): void {
    this.chat = null;
  }

  isSnapshotImageSupported(): boolean {
    return true;
  }
}
```

---

## Vision Test Runner

### VisionTestRunner

A smart test runner that uses visual analysis for goal-based testing.

```typescript
// e2e/VisionTestRunner.ts
import { device, element, by } from 'detox';
import { GeminiVisionHandler, VisionHandlerConfig } from './handlers/GeminiVisionHandler';
import * as fs from 'fs';
import * as path from 'path';

export interface VisionAction {
  observation: string;
  currentState: string;
  elements?: Array<{
    type: string;
    identifier: string;
    state: string;
    position: string;
  }>;
  action: {
    type: 'tap' | 'type' | 'scroll' | 'swipe' | 'longPress' | 'wait' | 'none';
    target: string;
    value?: string;
    coordinates?: { x: number; y: number };
    fallbackTargets?: string[];
  };
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
  concerns?: string;
}

export interface StepResult {
  stepNumber: number;
  screenshot: string;
  screenshotPath: string;
  action: VisionAction;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface GoalResult {
  success: boolean;
  goal: string;
  steps: StepResult[];
  finalState: string;
  totalDuration: number;
  screenshotsDir: string;
}

export class VisionTestRunner {
  private handler: GeminiVisionHandler;
  private stepHistory: StepResult[] = [];
  private screenshotsDir: string;
  private maxRetries = 2;

  constructor(config: VisionHandlerConfig, screenshotsDir?: string) {
    this.handler = new GeminiVisionHandler(config);
    this.screenshotsDir = screenshotsDir || './e2e/artifacts/vision-tests';
    this.ensureDir(this.screenshotsDir);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Analyze the current screen without taking action
   */
  async analyzeScreen(context?: string): Promise<VisionAction> {
    const screenshot = await this.captureScreenshot();

    const prompt = context
      ? `Current context: ${context}\n\nAnalyze this screenshot and describe what you see. What screen is this? What elements are interactive?`
      : 'Analyze this screenshot. What screen is this? What elements are available for interaction?';

    const response = await this.handler.runPrompt(prompt, screenshot.base64);
    return this.parseVisionResponse(response);
  }

  /**
   * Execute a goal-based test with visual feedback loop
   */
  async executeGoal(
    goal: string,
    options: {
      maxSteps?: number;
      screenshotPrefix?: string;
      onStep?: (step: StepResult) => void;
    } = {}
  ): Promise<GoalResult> {
    const { maxSteps = 20, screenshotPrefix = 'goal', onStep } = options;
    const startTime = Date.now();

    // Reset for new goal
    this.handler.resetChat();
    await this.handler.startChat();
    this.stepHistory = [];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 GOAL: ${goal}`);
    console.log(`${'='.repeat(60)}\n`);

    for (let step = 0; step < maxSteps; step++) {
      console.log(`\n📍 Step ${step + 1}/${maxSteps}`);
      console.log('-'.repeat(40));

      // Capture current screen
      const screenshot = await this.captureScreenshot(`${screenshotPrefix}-step-${step + 1}`);

      // Build context from history
      const historyContext = this.stepHistory.slice(-5).map((s, i) =>
        `Step ${s.stepNumber}: ${s.action.action.type} on "${s.action.action.target}" → ${s.success ? '✅ Success' : '❌ Failed'}`
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

      // Log the analysis
      console.log(`👁️  Observation: ${analysis.observation.substring(0, 100)}...`);
      console.log(`📱 State: ${analysis.currentState}`);
      console.log(`🎬 Action: ${analysis.action.type} → "${analysis.action.target}"`);
      console.log(`💪 Confidence: ${analysis.confidence}`);
      if (analysis.reasoning) {
        console.log(`💭 Reasoning: ${analysis.reasoning}`);
      }
      if (analysis.concerns) {
        console.log(`⚠️  Concerns: ${analysis.concerns}`);
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
        };
        this.stepHistory.push(stepResult);
        onStep?.(stepResult);

        console.log('\n✅ GOAL ACHIEVED!\n');

        return {
          success: true,
          goal,
          steps: this.stepHistory,
          finalState: analysis.currentState,
          totalDuration: Date.now() - startTime,
          screenshotsDir: this.screenshotsDir,
        };
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
      };
      this.stepHistory.push(stepResult);
      onStep?.(stepResult);

      if (!success) {
        console.log(`❌ Action failed: ${error}`);

        if (analysis.confidence === 'low') {
          console.log('🔄 Low confidence action failed, attempting recovery...');
          await this.attemptRecovery();
        }
      }

      // Wait for UI to settle
      await this.wait(500);
    }

    console.log('\n❌ MAX STEPS REACHED without achieving goal\n');

    return {
      success: false,
      goal,
      steps: this.stepHistory,
      finalState: 'unknown',
      totalDuration: Date.now() - startTime,
      screenshotsDir: this.screenshotsDir,
    };
  }

  /**
   * Execute a specific action based on vision analysis
   */
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

        case 'wait':
          await this.wait(parseInt(action.value || '1000'));
          break;

        case 'none':
          // No action needed
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
            console.log(`  ↳ Trying fallback: ${fallback}`);
            await this.executeTapOnTarget(fallback);
            return { success: true };
          } catch {
            continue;
          }
        }
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

    // Fall back to coordinates
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
      // Try to find focused element or by text/label
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
      // Try to find a scrollable container
      try {
        await element(by.type('RCTScrollView')).atIndex(0).scroll(pixels, direction);
      } catch {
        await element(by.type('UIScrollView')).atIndex(0).scroll(pixels, direction);
      }
    }
  }

  private async executeSwipe(action: VisionAction['action']): Promise<void> {
    const direction = (action.value as 'up' | 'down' | 'left' | 'right') || 'up';

    if (this.isTestId(action.target)) {
      await element(by.id(action.target)).swipe(direction);
    } else {
      // Swipe on the screen
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

  private isTestId(target: string): boolean {
    // testIDs are typically kebab-case or camelCase without spaces
    return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(target) && !target.includes(' ');
  }

  private async captureScreenshot(name?: string): Promise<{ base64: string; path: string }> {
    const timestamp = Date.now();
    const filename = name || `screenshot-${timestamp}`;
    const screenshotPath = await device.takeScreenshot(filename);

    // Read and convert to base64
    const buffer = fs.readFileSync(screenshotPath);
    const base64 = buffer.toString('base64');

    // Copy to our artifacts directory
    const destPath = path.join(this.screenshotsDir, `${filename}.png`);
    fs.copyFileSync(screenshotPath, destPath);

    return { base64, path: destPath };
  }

  private parseVisionResponse(response: string): VisionAction {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse vision response as JSON');
    }

    // Fallback response
    return {
      observation: response,
      currentState: 'unknown',
      action: { type: 'none', target: '' },
      confidence: 'low',
      concerns: 'Could not parse structured response',
    };
  }

  private async attemptRecovery(): Promise<void> {
    console.log('🔄 Attempting recovery...');

    const screenshot = await this.captureScreenshot('recovery');
    const recovery = await this.handler.runPrompt(
      `The previous action failed. Look at the current screen and suggest how to recover:
       1. Is there an error dialog to dismiss?
       2. Should we press back?
       3. Should we scroll to find the element?
       4. Is there a loading state we should wait for?

       What do you see and what should we do to recover?`,
      screenshot.base64
    );

    console.log(`Recovery analysis: ${recovery.substring(0, 200)}...`);

    // Simple recovery: try pressing back or dismissing dialogs
    try {
      await device.pressBack();
    } catch {
      try {
        // Try tapping outside a potential modal
        const { width, height } = await device.getUiDevice().getDisplaySize();
        await device.tap(width / 2, height - 50);
      } catch {
        // Last resort: wait for things to settle
        await this.wait(2000);
      }
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a test report
   */
  generateReport(): string {
    const report = {
      summary: {
        totalSteps: this.stepHistory.length,
        successfulSteps: this.stepHistory.filter(s => s.success).length,
        failedSteps: this.stepHistory.filter(s => !s.success).length,
      },
      steps: this.stepHistory.map(s => ({
        step: s.stepNumber,
        state: s.action.currentState,
        action: `${s.action.action.type} → ${s.action.action.target}`,
        success: s.success,
        error: s.error,
        screenshotPath: s.screenshotPath,
      })),
    };

    return JSON.stringify(report, null, 2);
  }
}
```

---

## Video Test Runner

### VideoTestRunner (Experimental)

Analyze recorded test videos for comprehensive visual validation.

```typescript
// e2e/VideoTestRunner.ts
import { GoogleGenAI } from '@google/genai';
import { device } from 'detox';
import * as fs from 'fs';
import * as path from 'path';

export interface VideoAnalysisResult {
  summary: string;
  screensVisited: string[];
  actionsPerformed: string[];
  issuesFound: Array<{
    type: 'error' | 'warning' | 'info';
    timestamp?: string;
    description: string;
  }>;
  visualQuality: {
    rating: number; // 1-10
    notes: string;
  };
  recommendations: string[];
}

export class VideoTestRunner {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    // Note: Video analysis works best with 2.5 Flash or higher
    this.model = model;
  }

  /**
   * Analyze a recorded test video
   */
  async analyzeVideo(videoPath: string, context?: string): Promise<VideoAnalysisResult> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const videoData = fs.readFileSync(videoPath);
    const base64Video = videoData.toString('base64');
    const mimeType = this.getMimeType(videoPath);

    const prompt = `Analyze this mobile app test recording${context ? ` for: ${context}` : ''}.

Provide a detailed analysis in the following JSON format:

{
  "summary": "Brief overview of what happened in the test",
  "screensVisited": ["List of screens/pages visited in order"],
  "actionsPerformed": ["List of user actions observed (taps, types, scrolls, etc.)"],
  "issuesFound": [
    {
      "type": "error | warning | info",
      "timestamp": "approximate time in video if notable",
      "description": "Description of the issue"
    }
  ],
  "visualQuality": {
    "rating": 8,
    "notes": "Assessment of UI quality, animations, transitions"
  },
  "recommendations": ["Suggested improvements or additional tests"]
}

Look for:
1. Navigation flow - Were transitions smooth?
2. Loading states - Were there appropriate loading indicators?
3. Error handling - Were errors shown correctly?
4. Visual bugs - Overlapping elements, cut-off text, wrong colors?
5. Animation quality - Smooth or janky?
6. Responsiveness - Did the app respond to inputs quickly?
7. Accessibility - Visible focus states, readable text?`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Video,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const text = response.text || '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    // Fallback
    return {
      summary: text,
      screensVisited: [],
      actionsPerformed: [],
      issuesFound: [],
      visualQuality: { rating: 0, notes: 'Could not parse structured response' },
      recommendations: [],
    };
  }

  /**
   * Run a test and analyze the recording
   */
  async runAndAnalyze(
    testName: string,
    testFn: () => Promise<void>,
    artifactsDir: string = './e2e/artifacts'
  ): Promise<{
    testPassed: boolean;
    testError?: string;
    videoAnalysis?: VideoAnalysisResult;
  }> {
    let testPassed = false;
    let testError: string | undefined;

    // Run the test
    try {
      await testFn();
      testPassed = true;
    } catch (error: any) {
      testPassed = false;
      testError = error.message;
    }

    // Find the most recent video
    const videos = this.findVideos(artifactsDir);
    if (videos.length === 0) {
      console.warn('No video recording found for analysis');
      return { testPassed, testError };
    }

    const latestVideo = videos[0];
    console.log(`📹 Analyzing video: ${latestVideo}`);

    const videoAnalysis = await this.analyzeVideo(latestVideo, testName);

    return { testPassed, testError, videoAnalysis };
  }

  /**
   * Compare two test recordings
   */
  async compareVideos(
    baselineVideoPath: string,
    currentVideoPath: string
  ): Promise<{
    identical: boolean;
    differences: string[];
    regressions: string[];
    improvements: string[];
  }> {
    const baselineData = fs.readFileSync(baselineVideoPath).toString('base64');
    const currentData = fs.readFileSync(currentVideoPath).toString('base64');
    const mimeType = this.getMimeType(baselineVideoPath);

    const prompt = `Compare these two mobile app test recordings.

Video 1 is the BASELINE (expected behavior).
Video 2 is the CURRENT (actual behavior).

Analyze and report:

{
  "identical": true/false,
  "differences": ["List of notable differences between the two recordings"],
  "regressions": ["Things that got worse or broke in the current version"],
  "improvements": ["Things that improved in the current version"]
}

Look for:
- Different screens or navigation paths
- Missing or new UI elements
- Changed animations or transitions
- Performance differences (faster/slower)
- Visual styling changes
- Error states that appear in one but not the other`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: baselineData,
              },
            },
            {
              inlineData: {
                mimeType,
                data: currentData,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const text = response.text || '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    return {
      identical: false,
      differences: [text],
      regressions: [],
      improvements: [],
    };
  }

  private findVideos(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir, { recursive: true }) as string[];
    return files
      .filter(f => /\.(mp4|mov|webm)$/i.test(f))
      .map(f => path.join(dir, f))
      .sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.mtime.getTime() - statA.mtime.getTime();
      });
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
    };
    return mimeTypes[ext] || 'video/mp4';
  }
}
```

---

## Example Tests

### Basic Vision Test

```typescript
// e2e/vision-tests/login-vision.test.ts
import { device } from 'detox';
import { VisionTestRunner } from '../VisionTestRunner';

describe('Vision-Enhanced Login Tests', () => {
  let runner: VisionTestRunner;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    runner = new VisionTestRunner({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-3-flash',
      thinkingLevel: 'LOW',
    });
  });

  afterEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should complete login flow using vision', async () => {
    const result = await runner.executeGoal(
      'Log into the app using email "test@example.com" and password "Test123!". ' +
      'The goal is achieved when I see the home screen or dashboard.',
      { maxSteps: 15 }
    );

    expect(result.success).toBe(true);
    console.log(`Completed in ${result.steps.length} steps`);
    console.log(`Total duration: ${result.totalDuration}ms`);
  });

  it('should handle invalid credentials', async () => {
    const result = await runner.executeGoal(
      'Attempt to log in with email "wrong@email.com" and password "wrongpassword". ' +
      'The goal is achieved when I see an error message about invalid credentials.',
      { maxSteps: 10 }
    );

    expect(result.success).toBe(true);
    expect(result.finalState).toContain('error');
  });
});
```

### Exploratory Testing

```typescript
// e2e/vision-tests/exploration.test.ts
import { device } from 'detox';
import { VisionTestRunner } from '../VisionTestRunner';
import * as fs from 'fs';

describe('Vision-Enhanced App Exploration', () => {
  let runner: VisionTestRunner;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    runner = new VisionTestRunner({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-2.5-flash', // Use 2.5 for better reasoning
    });
  });

  it('should explore and document all main screens', async () => {
    const result = await runner.executeGoal(
      `Explore this app thoroughly:
       1. Visit each tab in the bottom navigation (if present)
       2. Look for settings, profile, or menu sections
       3. Note any forms, lists, or interactive elements
       4. Report what screens you found

       The goal is achieved when you've visited at least 5 different screens
       or have exhausted navigation options.`,
      { maxSteps: 30 }
    );

    // Save exploration report
    const report = runner.generateReport();
    fs.writeFileSync('./e2e/reports/exploration-report.json', report);

    console.log('Exploration complete!');
    console.log(`Visited ${result.steps.length} states`);
    console.log(`Final state: ${result.finalState}`);
  });

  it('should find and test all forms', async () => {
    const result = await runner.executeGoal(
      `Find all forms in the app and test them:
       1. Look for any input fields, dropdowns, or checkboxes
       2. Fill forms with appropriate test data
       3. Submit forms and observe the results
       4. Note any validation errors or success messages

       The goal is achieved when you've tested at least 2 forms
       or confirmed there are no forms in the app.`,
      { maxSteps: 40 }
    );

    expect(result.steps.some(s => s.action.action.type === 'type')).toBe(true);
  });
});
```

### Video Analysis Test

```typescript
// e2e/vision-tests/video-analysis.test.ts
import { device } from 'detox';
import { VideoTestRunner } from '../VideoTestRunner';

describe('Video-Based Test Analysis', () => {
  let videoRunner: VideoTestRunner;

  beforeAll(() => {
    videoRunner = new VideoTestRunner(
      process.env.GEMINI_API_KEY!,
      'gemini-2.5-flash'
    );
  });

  it('should analyze checkout flow recording', async () => {
    // Assuming video was recorded with --record-videos all
    const result = await videoRunner.runAndAnalyze(
      'Checkout Flow Test',
      async () => {
        await device.launchApp({ newInstance: true });
        // ... perform checkout actions ...
      }
    );

    console.log('Test passed:', result.testPassed);

    if (result.videoAnalysis) {
      console.log('Video Analysis:');
      console.log('- Screens visited:', result.videoAnalysis.screensVisited);
      console.log('- Issues found:', result.videoAnalysis.issuesFound);
      console.log('- UI Quality:', result.videoAnalysis.visualQuality);

      // Assert no critical issues
      const criticalIssues = result.videoAnalysis.issuesFound.filter(
        i => i.type === 'error'
      );
      expect(criticalIssues).toHaveLength(0);
    }
  });

  it('should compare current test with baseline', async () => {
    const comparison = await videoRunner.compareVideos(
      './e2e/baselines/checkout-flow.mp4',
      './e2e/artifacts/latest/checkout-flow.mp4'
    );

    console.log('Comparison Results:');
    console.log('- Identical:', comparison.identical);
    console.log('- Differences:', comparison.differences);
    console.log('- Regressions:', comparison.regressions);

    // Fail if there are regressions
    expect(comparison.regressions).toHaveLength(0);
  });
});
```

---

## Best Practices

### 1. Model Selection

```typescript
// For fast iteration during development
const devConfig = {
  model: 'gemini-3-flash' as const,
  thinkingLevel: 'MINIMAL' as const,
};

// For thorough testing in CI
const ciConfig = {
  model: 'gemini-2.5-flash' as const,
  // 2.5 uses thinkingBudget instead of thinkingLevel
};

// For complex exploratory testing
const explorationConfig = {
  model: 'gemini-2.5-pro' as const,
};
```

### 2. Goal Writing

```typescript
// Good: Specific and measurable
'Log in with email "user@test.com" and password "pass123", then verify the home screen shows "Welcome"'

// Good: Clear success criteria
'Add 3 items to cart, go to checkout, and verify the total shows "$XX.XX"'

// Avoid: Vague goals
'Test the login'
'Check if checkout works'
```

### 3. Step Limits

```typescript
// Short, focused flows
{ maxSteps: 10 }

// Medium complexity flows
{ maxSteps: 20 }

// Exploratory testing
{ maxSteps: 50 }
```

### 4. Error Handling

```typescript
const result = await runner.executeGoal(goal, { maxSteps: 20 });

if (!result.success) {
  // Log failure details
  const failedSteps = result.steps.filter(s => !s.success);
  console.error('Failed steps:', failedSteps);

  // Save screenshots for debugging
  console.log('Screenshots saved to:', result.screenshotsDir);

  // Generate detailed report
  const report = runner.generateReport();
  fs.writeFileSync('./e2e/reports/failure-report.json', report);
}
```

### 5. Parallel Testing

```typescript
// Run multiple goals in parallel
const goals = [
  'Test login flow',
  'Test signup flow',
  'Test password reset',
];

const results = await Promise.all(
  goals.map(goal =>
    new VisionTestRunner(config).executeGoal(goal)
  )
);
```

---

## Cost Estimation

### Per-Step Costs (approximate)

| Model | Input (image + prompt) | Output | Cost per Step |
|-------|----------------------|--------|---------------|
| Gemini 3 Flash | ~1500 tokens | ~500 tokens | ~$0.002 |
| Gemini 2.5 Flash | ~1500 tokens | ~500 tokens | ~$0.003 |
| Gemini 2.5 Pro | ~1500 tokens | ~500 tokens | ~$0.01 |

### Per-Test Costs

| Test Type | Steps | Gemini 3 Flash | Gemini 2.5 Pro |
|-----------|-------|----------------|----------------|
| Simple flow | 10 | ~$0.02 | ~$0.10 |
| Medium flow | 20 | ~$0.04 | ~$0.20 |
| Exploration | 50 | ~$0.10 | ~$0.50 |

### Per-Suite Costs

For a typical test suite (10 test cases, avg 20 steps each):
- **Gemini 3 Flash**: ~$0.40 per run
- **Gemini 2.5 Flash**: ~$0.60 per run
- **Gemini 2.5 Pro**: ~$2.00 per run

### Video Analysis Costs

Video analysis is more expensive due to larger input sizes:
- 30-second video: ~$0.10-0.20
- 2-minute video: ~$0.30-0.50

---

## Troubleshooting

### Common Issues

**1. API Rate Limits**
```typescript
// Add retry logic with exponential backoff
const MAX_RETRIES = 3;
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    return await handler.runPrompt(prompt, image);
  } catch (error) {
    if (error.status === 429) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      continue;
    }
    throw error;
  }
}
```

**2. Low Confidence Actions**
```typescript
// Skip low confidence actions or require confirmation
if (analysis.confidence === 'low') {
  console.warn('Low confidence - skipping action');
  continue;
}
```

**3. Element Not Found**
```typescript
// Use fallback targets
action: {
  target: 'submit-button',
  fallbackTargets: ['Submit', 'Continue', 'Next'],
}
```

**4. Timeout Issues**
```typescript
// Increase wait times for slow devices
await this.wait(1000); // Instead of 500ms
```

---

## Sources

- [Google Gen AI SDK (npm)](https://www.npmjs.com/package/@google/genai)
- [Google Gen AI SDK (GitHub)](https://github.com/googleapis/js-genai)
- [Gemini API Models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 3 Flash Announcement](https://blog.google/products/gemini/gemini-3-flash/)
- [Gemini Thinking Documentation](https://ai.google.dev/gemini-api/docs/thinking)
