/**
 * Vision-Enhanced Wix Pilot Integration
 *
 * Shows how to use GeminiVisionHandler with Wix Pilot for
 * natural language testing with visual intelligence.
 *
 * This combines Pilot's ease-of-use with vision capabilities
 * for more robust and self-correcting tests.
 *
 * Setup:
 *   npm install --save-dev @google/genai @wix-pilot/core @wix-pilot/detox
 *   export GEMINI_API_KEY=your_api_key
 *
 * Run:
 *   npx detox test -c ios.sim.debug e2e/vision-pilot.test.ts
 */

import { device, element, by, expect } from 'detox';
import { Pilot } from '@wix-pilot/core';
import { DetoxFrameworkDriver } from '@wix-pilot/detox';
import { GeminiVisionHandler } from '../src/handlers/GeminiVisionHandler';
import { VisionTestRunner } from '../src/runners/VisionTestRunner';
import { VisualRegression } from '../src/utils/VisualRegression';
import * as fs from 'fs';

// ============================================================================
// Setup
// ============================================================================

describe('Vision-Enhanced Pilot Tests', () => {
  let pilot: Pilot;
  let visionHandler: GeminiVisionHandler;
  let visionRunner: VisionTestRunner;
  let visualRegression: VisualRegression;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Create vision handler
    visionHandler = new GeminiVisionHandler({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-3-flash',
    });

    // Initialize Pilot with vision handler
    pilot = new Pilot({
      frameworkDriver: new DetoxFrameworkDriver(),
      promptHandler: visionHandler,
    });

    // Create vision runner for fallback/recovery
    visionRunner = new VisionTestRunner({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-3-flash',
    });

    // Create visual regression checker
    visualRegression = new VisualRegression({
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-3-flash',
      baselinesDir: './e2e/visual-baselines',
      threshold: 90,
    });
  });

  beforeEach(async () => {
    await pilot.start();
  });

  afterEach(async () => {
    await pilot.end();
  });

  // ==========================================================================
  // Pattern 1: Standard Pilot with Vision Handler
  // ==========================================================================

  describe('Standard Pilot Usage', () => {
    it('should complete login flow with visual verification', async () => {
      // Use Pilot's natural language interface
      await pilot.perform(
        'Look at the screen and find the login form',
        'Enter "test@example.com" in the email field',
        'Enter "Password123" in the password field',
        'Tap the login button',
        'Verify that the home screen is visible'
      );

      // Take screenshot and verify visually
      const screenshot = await device.takeScreenshot('login-complete');
      const verification = await visionHandler.runPrompt(
        'Verify this is the home screen after a successful login. Is the user logged in?',
        fs.readFileSync(screenshot).toString('base64')
      );

      expect(verification.toLowerCase()).toContain('home');
    });

    it('should navigate settings with visual awareness', async () => {
      await pilot.perform(
        'Look for a settings icon or menu option',
        'Tap on Settings or the gear icon',
        'Verify the settings screen is displayed',
        'Look for notification settings and tap on it'
      );

      // Visual assertion using vision handler
      const analysis = await visionRunner.analyzeCurrentScreen('Settings > Notifications');
      expect(analysis.currentState.toLowerCase()).toMatch(/settings|notification/);
    });
  });

  // ==========================================================================
  // Pattern 2: Pilot + Vision Runner Fallback
  // ==========================================================================

  describe('Pilot with Vision Fallback', () => {
    it('should recover from navigation issues', async () => {
      try {
        // Try with Pilot first
        await pilot.perform(
          'Navigate to the profile section',
          'Tap on edit profile button'
        );
      } catch (error) {
        // If Pilot fails, use VisionTestRunner for recovery
        console.log('Pilot encountered an issue, using vision runner...');

        const result = await visionRunner.executeGoal(
          'Find and navigate to the profile editing screen',
          { maxSteps: 10 }
        );

        expect(result.success).toBe(true);
      }
    });

    it('should handle dynamic content with vision', async () => {
      // Pilot for basic navigation
      await pilot.perform('Navigate to the feed or home screen');

      // Vision runner for dynamic content
      const result = await visionRunner.executeGoal(
        'Scroll through the feed and interact with the first post that has a like button',
        { maxSteps: 8 }
      );

      // Verify the action was taken
      const verification = await visionRunner.verifyVisualCondition(
        'A post has been liked or interacted with'
      );

      expect(verification.satisfied).toBe(true);
    });
  });

  // ==========================================================================
  // Pattern 3: Visual Regression with Pilot
  // ==========================================================================

  describe('Visual Regression Testing', () => {
    it('should verify login screen matches baseline', async () => {
      // Navigate to a specific screen
      await pilot.perform('Navigate to the login screen');

      // Take screenshot
      const screenshot = await device.takeScreenshot('login-screen');

      // Compare against baseline
      const { passed, diff } = await visualRegression.compare(
        'login-screen',
        screenshot
      );

      if (!passed) {
        console.log('Visual differences found:', diff.differences);
      }

      expect(passed).toBe(true);
    });

    it('should detect visual regressions in settings', async () => {
      await pilot.perform(
        'Navigate to settings screen',
        'Scroll to see all settings options'
      );

      const screenshot = await device.takeScreenshot('settings-screen');

      const { passed, diff } = await visualRegression.compare(
        'settings-screen',
        screenshot,
        { context: 'Settings screen after scrolling' }
      );

      // Log any regressions
      if (diff.regressions.length > 0) {
        console.log('Regressions detected:', diff.regressions);
      }

      expect(diff.regressions.length).toBe(0);
    });
  });

  // ==========================================================================
  // Pattern 4: Autopilot with Visual Constraints
  // ==========================================================================

  describe('Autopilot with Visual Validation', () => {
    it('should explore app while checking for visual issues', async () => {
      const visualIssues: string[] = [];

      // Run autopilot with visual checking
      const report = await pilot.autopilot(
        'Explore the main sections of this app. Visit the home, profile, and settings screens.',
        {
          // After each step, check for visual issues
          onStepComplete: async () => {
            const screenshot = await device.takeScreenshot(`autopilot-${Date.now()}`);
            const analysis = await visionHandler.analyzeScreen(
              fs.readFileSync(screenshot).toString('base64')
            );

            for (const issue of analysis.issues) {
              if (issue.severity === 'high') {
                visualIssues.push(`${analysis.screenName}: ${issue.description}`);
              }
            }
          },
        }
      );

      console.log('Autopilot report:', report);
      console.log('Visual issues found:', visualIssues);

      // Should have no high-severity visual issues
      expect(visualIssues.length).toBe(0);
    });
  });

  // ==========================================================================
  // Pattern 5: Custom Vision-Enhanced Steps
  // ==========================================================================

  describe('Custom Vision Steps', () => {
    it('should find and interact with elements visually', async () => {
      // Ask vision to find an element
      const screenshot = await device.takeScreenshot('find-element');
      const coords = await visionHandler.getElementCoordinates(
        fs.readFileSync(screenshot).toString('base64'),
        'the main call-to-action button'
      );

      if (coords) {
        console.log(`Found element at (${coords.x}, ${coords.y}) with ${coords.confidence} confidence`);

        // Tap using coordinates
        await device.tap(coords.x, coords.y);

        // Verify the tap worked
        const verification = await visionRunner.verifyVisualCondition(
          'The screen has changed after tapping the button'
        );

        expect(verification.satisfied).toBe(true);
      } else {
        console.log('Element not found, skipping tap');
      }
    });

    it('should compare two screens visually', async () => {
      // Take before screenshot
      const before = await device.takeScreenshot('before-action');

      // Perform action
      await pilot.perform('Toggle dark mode or any visible toggle');

      // Take after screenshot
      const after = await device.takeScreenshot('after-action');

      // Compare
      const comparison = await visionHandler.compareScreenshots(
        fs.readFileSync(before).toString('base64'),
        fs.readFileSync(after).toString('base64'),
        'Before and after toggling a setting'
      );

      console.log('Comparison result:', comparison);

      // Should have at least one difference after toggle
      expect(comparison.identical).toBe(false);
    });
  });

  // ==========================================================================
  // Pattern 6: Extended API Catalog with Vision
  // ==========================================================================

  describe('Extended API Catalog', () => {
    beforeAll(() => {
      // Extend Pilot's knowledge with vision capabilities
      pilot.extendAPICatalog([
        {
          name: 'Vision Actions',
          actions: [
            {
              name: 'findElementVisually',
              description: 'Use AI vision to find an element by description',
              example: 'Find the blue submit button and tap it',
            },
            {
              name: 'verifyScreenState',
              description: 'Visually verify the current screen state',
              example: 'Verify the user is logged in and on the home screen',
            },
            {
              name: 'detectIssues',
              description: 'Scan the screen for visual issues',
              example: 'Check for any visual bugs or accessibility issues',
            },
          ],
        },
      ]);
    });

    it('should use extended catalog for vision tasks', async () => {
      await pilot.perform(
        'Navigate to the home screen',
        'Find the blue submit button and tap it',
        'Verify the action completed successfully'
      );

      const screenshot = await device.takeScreenshot('extended-api-test');
      const analysis = await visionHandler.analyzeScreen(
        fs.readFileSync(screenshot).toString('base64')
      );

      expect(analysis.issues.filter((i) => i.severity === 'high')).toHaveLength(0);
    });
  });
});

// ============================================================================
// Utility Functions for Integration
// ============================================================================

/**
 * Helper to run Pilot step with vision verification
 */
async function pilotWithVision(
  pilot: Pilot,
  visionHandler: GeminiVisionHandler,
  steps: string[],
  verifyCondition?: string
): Promise<{ success: boolean; verification?: any }> {
  try {
    await pilot.perform(...steps);

    if (verifyCondition) {
      const screenshot = await device.takeScreenshot(`verify-${Date.now()}`);
      const response = await visionHandler.runPrompt(
        `Verify: ${verifyCondition}. Return JSON: { "satisfied": true/false, "observation": "what you see" }`,
        fs.readFileSync(screenshot).toString('base64')
      );

      try {
        const verification = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
        return { success: verification.satisfied, verification };
      } catch {
        return { success: false, verification: { observation: response } };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, verification: { error: String(error) } };
  }
}
