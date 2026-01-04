/**
 * Vision-Enhanced Login Flow Tests
 *
 * Uses Gemini's vision capabilities to intelligently navigate
 * and test login flows without relying solely on testIDs.
 *
 * Setup:
 *   npm install --save-dev @google/genai @wix-pilot/core @wix-pilot/detox
 *   export GEMINI_API_KEY=your_api_key
 *
 * Run:
 *   npx detox test -c ios.sim.debug e2e/vision-login.test.ts
 */

import { device, element, by, expect } from 'detox';
import { GoogleGenAI, Chat } from '@google/genai';
import { PromptHandler } from '@wix-pilot/core';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

interface VisionConfig {
  apiKey: string;
  model: 'gemini-3-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro';
  thinkingLevel?: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  screenshotsDir?: string;
}

// ============================================================================
// Vision Handler
// ============================================================================

interface VisionAction {
  observation: string;
  currentState: string;
  action: {
    type: 'tap' | 'type' | 'scroll' | 'swipe' | 'wait' | 'none';
    target: string;
    value?: string;
    coordinates?: { x: number; y: number };
  };
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
  concerns?: string;
}

class GeminiVisionHandler implements PromptHandler {
  private ai: GoogleGenAI;
  private model: string;
  private chat: Chat | null = null;

  constructor(private config: VisionConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  private getSystemPrompt(): string {
    return `You are an expert mobile app tester with VISION capabilities.

CRITICAL: Base decisions on what you ACTUALLY SEE in screenshots.

When given a task, respond with JSON:
{
  "observation": "What you see on screen",
  "currentState": "screen_name (login_screen, home_screen, error, etc.)",
  "action": {
    "type": "tap | type | scroll | none",
    "target": "testID or visual description",
    "value": "text to type if applicable"
  },
  "confidence": "high | medium | low",
  "reasoning": "Why this action",
  "concerns": "Any issues"
}`;
  }

  async runPrompt(prompt: string, image?: string): Promise<string> {
    const parts: any[] = [];

    if (image) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: image,
        },
      });
    }

    parts.push({ text: this.getSystemPrompt() + '\n\n' + prompt });

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts }],
      config: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    return response.text || '';
  }

  async startChat(): Promise<void> {
    this.chat = this.ai.chats.create({
      model: this.model,
      config: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        systemInstruction: this.getSystemPrompt(),
      },
    });
  }

  async sendMessage(prompt: string, image?: string): Promise<string> {
    if (!this.chat) await this.startChat();

    const parts: any[] = [];
    if (image) {
      parts.push({ inlineData: { mimeType: 'image/png', data: image } });
    }
    parts.push({ text: prompt });

    const response = await this.chat!.sendMessage({ parts });
    return response.text || '';
  }

  resetChat(): void {
    this.chat = null;
  }

  isSnapshotImageSupported(): boolean {
    return true;
  }
}

// ============================================================================
// Vision Test Runner
// ============================================================================

class VisionTestRunner {
  private handler: GeminiVisionHandler;
  private screenshotsDir: string;

  constructor(config: VisionConfig) {
    this.handler = new GeminiVisionHandler(config);
    this.screenshotsDir = config.screenshotsDir || './e2e/artifacts/vision';
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  async executeGoal(goal: string, maxSteps = 20): Promise<{
    success: boolean;
    steps: number;
    finalState: string;
  }> {
    this.handler.resetChat();
    await this.handler.startChat();

    console.log(`\n🎯 Goal: ${goal}\n`);

    for (let step = 0; step < maxSteps; step++) {
      console.log(`📍 Step ${step + 1}/${maxSteps}`);

      const screenshot = await this.captureScreenshot(`step-${step + 1}`);

      const prompt = `
GOAL: ${goal}
STEP: ${step + 1}

Look at the screenshot. Have we achieved the goal?
If yes, respond with action type "none" and high confidence.
If not, what's the next action?`;

      const response = await this.handler.sendMessage(prompt, screenshot);
      const action = this.parseResponse(response);

      console.log(`  State: ${action.currentState}`);
      console.log(`  Action: ${action.action.type} → ${action.action.target}`);
      console.log(`  Confidence: ${action.confidence}`);

      if (action.action.type === 'none' && action.confidence === 'high') {
        console.log('\n✅ Goal achieved!\n');
        return { success: true, steps: step + 1, finalState: action.currentState };
      }

      await this.executeAction(action);
      await this.wait(500);
    }

    console.log('\n❌ Max steps reached\n');
    return { success: false, steps: maxSteps, finalState: 'unknown' };
  }

  private async executeAction(analysis: VisionAction): Promise<void> {
    const { action } = analysis;

    try {
      switch (action.type) {
        case 'tap':
          if (this.isTestId(action.target)) {
            await element(by.id(action.target)).tap();
          } else {
            await element(by.text(action.target)).atIndex(0).tap();
          }
          break;

        case 'type':
          if (this.isTestId(action.target)) {
            await element(by.id(action.target)).clearText();
            await element(by.id(action.target)).typeText(action.value || '');
          }
          break;

        case 'scroll':
          await element(by.type('RCTScrollView')).atIndex(0).scroll(300, 'down');
          break;

        case 'wait':
          await this.wait(parseInt(action.value || '1000'));
          break;
      }
    } catch (error: any) {
      console.log(`  ⚠️ Action failed: ${error.message}`);
    }
  }

  private isTestId(target: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(target) && !target.includes(' ');
  }

  private async captureScreenshot(name: string): Promise<string> {
    const screenshotPath = await device.takeScreenshot(name);
    const buffer = fs.readFileSync(screenshotPath);
    return buffer.toString('base64');
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
      action: { type: 'none', target: '' },
      confidence: 'low',
    };
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Vision-Enhanced Login Flow', () => {
  let runner: VisionTestRunner;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    runner = new VisionTestRunner({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-3-flash',
    });
  });

  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should complete login with valid credentials using vision', async () => {
    const result = await runner.executeGoal(
      'Log into the app using email "test@example.com" and password "Test123!". ' +
      'Goal is achieved when you see the home screen or dashboard.',
      15
    );

    expect(result.success).toBe(true);
    console.log(`Completed in ${result.steps} steps`);
  });

  it('should show error for invalid credentials', async () => {
    const result = await runner.executeGoal(
      'Try to log in with email "invalid@test.com" and password "wrongpass". ' +
      'Goal is achieved when you see an error message about invalid credentials.',
      10
    );

    expect(result.success).toBe(true);
    expect(result.finalState).toMatch(/error|invalid/i);
  });

  it('should navigate to forgot password', async () => {
    const result = await runner.executeGoal(
      'Find and tap on "Forgot Password" or "Reset Password" link. ' +
      'Goal is achieved when you see a password reset screen or form.',
      8
    );

    expect(result.success).toBe(true);
  });

  it('should navigate to signup from login', async () => {
    const result = await runner.executeGoal(
      'Find a link to create a new account or sign up. ' +
      'Goal is achieved when you see a registration or signup form.',
      8
    );

    expect(result.success).toBe(true);
  });

  it('should handle empty form submission', async () => {
    const result = await runner.executeGoal(
      'Try to submit the login form without entering any credentials. ' +
      'Goal is achieved when you see validation errors for required fields.',
      8
    );

    expect(result.success).toBe(true);
  });
});
