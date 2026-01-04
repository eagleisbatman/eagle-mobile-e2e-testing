# Vision-Enhanced E2E Testing Reference

AI-powered visual testing using Google Gemini models for intelligent mobile app testing.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Module Structure](#module-structure)
4. [Model Selection](#model-selection)
5. [GeminiVisionHandler](#geminivisionhandler)
6. [VisionTestRunner](#visiontestrunner)
7. [VideoTestRunner](#videotestrunner)
8. [AppExplorer](#appexplorer)
9. [VisualRegression](#visualregression)
10. [VisionReportGenerator](#visionreportgenerator)
11. [Wix Pilot Integration](#wix-pilot-integration)
12. [Example Tests](#example-tests)
13. [Best Practices](#best-practices)
14. [Cost Estimation](#cost-estimation)

---

## Overview

### The Problem with Traditional E2E Testing

Traditional Detox tests operate on testIDs and view hierarchy but:
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
- **Detect regressions** through screenshot comparison
- **Audit accessibility** using visual analysis

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Test Orchestrator                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────┐    ┌─────────────────────────────────────┐  │
│  │  GeminiVisionHandler│◄──►│         Analysis Capabilities       │  │
│  │  (3 Flash / 2.5)   │    │  - Screen state detection           │  │
│  │                    │    │  - Element discovery & grounding    │  │
│  │  Implements:       │    │  - Visual validation                │  │
│  │  - PromptHandler   │    │  - Screenshot comparison            │  │
│  │  - Chat sessions   │    │  - Coordinate extraction            │  │
│  └────────┬───────────┘    └─────────────────────────────────────┘  │
│           │                                                           │
│           ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                        Test Runners                              ││
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐   ││
│  │  │ VisionTestRunner│  │ VideoRunner  │  │   AppExplorer    │   ││
│  │  │ - Goal execution│  │ - Video      │  │ - Auto discovery │   ││
│  │  │ - Self-recovery │  │   analysis   │  │ - Issue finding  │   ││
│  │  │ - Step history  │  │ - Regression │  │ - Test generation│   ││
│  │  └─────────────────┘  └──────────────┘  └──────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────┘│
│           │                                                           │
│           ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                         Utilities                                ││
│  │  ┌──────────────────┐     ┌────────────────────────────────┐   ││
│  │  │ VisualRegression │     │    VisionReportGenerator       │   ││
│  │  │ - Baseline mgmt  │     │ - HTML reports                 │   ││
│  │  │ - Diff detection │     │ - Step visualization           │   ││
│  │  │ - CI integration │     │ - Issue tracking               │   ││
│  │  └──────────────────┘     └────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────┘│
│           │                                                           │
│           ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      Detox Executor                              ││
│  │  - Execute via testIDs when available                           ││
│  │  - Fall back to coordinates from vision                         ││
│  │  - Capture screenshots after each action                        ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
# Install the Google Gen AI SDK
npm install --save-dev @google/genai

# Install Wix Pilot packages (optional, for Pilot integration)
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

## Module Structure

The vision testing modules are organized in the `src/` directory:

```
src/
├── index.ts                          # Main exports
├── handlers/
│   └── GeminiVisionHandler.ts        # Vision-enabled prompt handler
├── runners/
│   ├── VisionTestRunner.ts           # Goal-based test execution
│   ├── VideoTestRunner.ts            # Video analysis & regression
│   └── AppExplorer.ts                # Autonomous app exploration
└── utils/
    ├── VisualRegression.ts           # Screenshot baseline comparison
    └── VisionReportGenerator.ts      # HTML report generation
```

### Importing Modules

```typescript
// Import specific modules
import {
  GeminiVisionHandler,
  VisionTestRunner,
  VideoTestRunner,
  AppExplorer,
  VisualRegression,
  VisionReportGenerator
} from '../src';

// Or use convenience aliases
import {
  GeminiHandler,
  TestRunner,
  VideoRunner,
  Explorer,
  Regression,
  ReportGenerator
} from '../src';
```

---

## Model Selection

### Available Gemini Models

| Model | Model ID | Vision | Speed | Cost | Best For |
|-------|----------|--------|-------|------|----------|
| **Gemini 3 Flash** | `gemini-3-flash` | Excellent | Fastest | $0.50/1M | **Recommended** - best balance |
| **Gemini 2.5 Flash** | `gemini-2.5-flash` | Excellent | Fast | $$ | Thinking capabilities |
| **Gemini 2.5 Pro** | `gemini-2.5-pro` | Excellent | Medium | $$$ | Complex reasoning |
| **Gemini 2.0 Flash** | `gemini-2.0-flash` | Good | Fast | $ | Budget option |

### Choosing a Model

```typescript
// For speed-critical testing (recommended for most cases)
const config = { model: 'gemini-3-flash' };

// For complex multi-step reasoning
const config = { model: 'gemini-2.5-pro' };

// For budget-conscious high-volume testing
const config = { model: 'gemini-2.0-flash' };
```

---

## GeminiVisionHandler

The core handler that provides vision capabilities and implements the `PromptHandler` interface.

### Basic Usage

```typescript
import { GeminiVisionHandler } from '../src';

const handler = new GeminiVisionHandler({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash',
  temperature: 0.2,
});

// Analyze a screenshot
const response = await handler.runPrompt(
  'What screen is this? What elements are interactive?',
  screenshotBase64
);
```

### Chat Sessions

For multi-turn conversations with context:

```typescript
// Start a chat session
await handler.startChat();

// Send messages with context preserved
const response1 = await handler.sendChatMessage('Navigate to login', screenshot1);
const response2 = await handler.sendChatMessage('Now enter credentials', screenshot2);

// Reset between tests
handler.resetChat();
```

### Screen Analysis

```typescript
const analysis = await handler.analyzeScreen(screenshot);
// Returns: { screenName, description, elements, issues, suggestedTestCases }
```

### Element Coordinate Extraction

```typescript
const coords = await handler.getElementCoordinates(
  screenshot,
  'the blue submit button'
);
// Returns: { x: 150, y: 400, confidence: 'high' } or null
```

### Screenshot Comparison

```typescript
const comparison = await handler.compareScreenshots(
  baselineScreenshot,
  currentScreenshot,
  'Login screen after update'
);
// Returns: { identical, differences, regressions, improvements }
```

---

## VisionTestRunner

Goal-based test execution with visual feedback loop.

### Basic Usage

```typescript
import { VisionTestRunner } from '../src';

const runner = new VisionTestRunner({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash',
  screenshotsDir: './e2e/artifacts/vision',
  verbose: true,
});

const result = await runner.executeGoal(
  'Log in with email "test@example.com" and password "Test123!"',
  { maxSteps: 15 }
);

expect(result.success).toBe(true);
console.log(`Completed in ${result.steps.length} steps`);
```

### Goal Result Structure

```typescript
interface GoalResult {
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
```

### Visual Verification

```typescript
const verification = await runner.verifyVisualCondition(
  'The user is logged in and on the home screen'
);

expect(verification.satisfied).toBe(true);
expect(verification.confidence).toBe('high');
```

### Step Callbacks

```typescript
const result = await runner.executeGoal(goal, {
  maxSteps: 20,
  onStep: (step) => {
    console.log(`Step ${step.stepNumber}: ${step.action.action.type}`);
  },
  onAnalysis: (analysis) => {
    console.log(`Current state: ${analysis.currentState}`);
  },
});
```

---

## VideoTestRunner

Analyze recorded test videos for issues, regressions, and quality.

### Video Analysis

```typescript
import { VideoTestRunner } from '../src';

const videoRunner = new VideoTestRunner({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-2.5-flash',
  baselinesDir: './e2e/baselines',
});

const analysis = await videoRunner.analyzeVideo(
  './artifacts/test-recording.mp4',
  'Checkout flow test'
);

console.log('Screens visited:', analysis.screensVisited);
console.log('Issues found:', analysis.issues);
console.log('UI Quality:', analysis.uiQuality.rating);
```

### Baseline Comparison

```typescript
// Compare with baseline (auto-creates if none exists)
const comparison = await videoRunner.compareWithBaseline(
  './artifacts/current-test.mp4',
  'checkout-flow'
);

if (comparison.regressions.length > 0) {
  console.log('Regressions detected:', comparison.regressions);
}

expect(comparison.regressions.length).toBe(0);
```

### Accessibility Audit

```typescript
const audit = await videoRunner.auditAccessibility(
  './artifacts/app-walkthrough.mp4'
);

console.log('Accessibility score:', audit.score);
console.log('WCAG level:', audit.wcagLevel);
console.log('Issues:', audit.issues);

expect(audit.score).toBeGreaterThanOrEqual(70);
```

### Multi-Device Comparison

```typescript
const comparison = await videoRunner.compareAcrossDevices([
  { path: './ios-test.mp4', device: 'iPhone 15', platform: 'iOS' },
  { path: './android-test.mp4', device: 'Pixel 8', platform: 'Android' },
]);

console.log('Consistency score:', comparison.consistencyScore);
console.log('Platform differences:', comparison.platformDifferences);
```

---

## AppExplorer

Autonomous app exploration for discovering screens, elements, and issues.

### Basic Exploration

```typescript
import { AppExplorer } from '../src';

const explorer = new AppExplorer({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-2.5-flash',
  maxSteps: 50,
  maxScreens: 15,
  avoidPatterns: ['logout', 'delete account'],
});

const result = await explorer.explore({
  startingContext: 'Explore this e-commerce app thoroughly',
  onScreen: (screen) => {
    console.log(`Discovered: ${screen.screenName}`);
  },
  onIssue: (issue) => {
    console.log(`Issue: [${issue.severity}] ${issue.description}`);
  },
});

console.log(`Discovered ${result.screensDiscovered.length} screens`);
console.log(`Found ${result.issuesFound.length} issues`);
console.log(`Coverage score: ${result.coverageScore}%`);
```

### Focused Exploration

```typescript
// Explore specifically for accessibility issues
const result = await explorer.exploreForIssues('accessibility');

// Or functional issues
const result = await explorer.exploreForIssues('functional');
```

### Generated Report

```typescript
const jsonReport = explorer.generateReport();
fs.writeFileSync('./reports/exploration.json', jsonReport);
```

---

## VisualRegression

Screenshot baseline management and visual diff detection.

### Setup and Basic Usage

```typescript
import { VisualRegression } from '../src';

const regression = new VisualRegression({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash',
  baselinesDir: './e2e/visual-baselines',
  threshold: 90, // 90% similarity required to pass
});

// Compare screenshot against baseline
const { passed, diff } = await regression.compare(
  'login-screen',
  screenshotPath
);

if (!passed) {
  console.log('Visual differences:', diff.differences);
  console.log('Regressions:', diff.regressions);
}

expect(passed).toBe(true);
```

### Batch Comparison

```typescript
const results = await regression.compareAll([
  { name: 'login-screen', path: './screenshots/login.png' },
  { name: 'home-screen', path: './screenshots/home.png' },
  { name: 'settings-screen', path: './screenshots/settings.png' },
]);

console.log(`${results.summary.passed}/${results.summary.total} passed`);
expect(results.passed).toBe(true);
```

### Baseline Management

```typescript
// Save a new baseline
regression.saveBaseline('login-screen', screenshotPath, {
  version: '2.0.0',
  date: new Date().toISOString(),
});

// List all baselines
const baselines = regression.listBaselines();

// Delete a baseline
regression.deleteBaseline('old-screen');
```

### HTML Report

```typescript
regression.generateHtmlReport(results.results, './reports/visual-regression.html');
```

---

## VisionReportGenerator

Generate beautiful HTML reports for vision test results.

### Basic Usage

```typescript
import { VisionReportGenerator, VisionReportData } from '../src';

const reporter = new VisionReportGenerator({
  outputDir: './e2e/reports/vision',
  embedScreenshots: true,
  projectName: 'My App E2E Tests',
});

const data: VisionReportData = {
  title: 'Vision Test Report',
  timestamp: new Date().toISOString(),
  goals: [goalResult1, goalResult2],
  explorations: [explorationResult],
  accessibilityAudits: [accessibilityAudit],
  visualRegressions: [regressionResult],
  summary: {
    totalTests: 10,
    passed: 8,
    failed: 2,
    coverage: 85,
  },
};

const reportPath = reporter.generate(data);
console.log(`Report saved to: ${reportPath}`);
```

### JSON Export

```typescript
// Save as JSON for CI/CD integration
const jsonPath = reporter.saveJson(data, 'test-results.json');
```

---

## Wix Pilot Integration

Use GeminiVisionHandler with Wix Pilot for natural language testing.

### Setup

```typescript
import { Pilot } from '@wix-pilot/core';
import { DetoxFrameworkDriver } from '@wix-pilot/detox';
import { GeminiVisionHandler } from '../src';

const visionHandler = new GeminiVisionHandler({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash',
});

const pilot = new Pilot({
  frameworkDriver: new DetoxFrameworkDriver(),
  promptHandler: visionHandler,
});
```

### Using with Pilot

```typescript
beforeEach(async () => {
  await pilot.start();
});

afterEach(async () => {
  await pilot.end();
});

it('should complete checkout with vision', async () => {
  await pilot.perform(
    'Look at the screen and find the products list',
    'Tap on the first product to view details',
    'Find and tap the Add to Cart button',
    'Navigate to the cart',
    'Verify the product is in the cart'
  );
});
```

### Hybrid Approach

```typescript
// Use Pilot for basic navigation
await pilot.perform('Navigate to settings');

// Use VisionTestRunner for complex goal
const result = await visionRunner.executeGoal(
  'Find and toggle all notification settings',
  { maxSteps: 10 }
);

// Use VisualRegression for verification
const { passed } = await visualRegression.compare(
  'settings-notifications',
  screenshotPath
);
```

---

## Example Tests

### Complete Example: E-commerce Flow

```typescript
import { device } from 'detox';
import {
  VisionTestRunner,
  VideoTestRunner,
  VisualRegression,
  VisionReportGenerator
} from '../src';

describe('E-commerce Vision Tests', () => {
  let runner: VisionTestRunner;
  let videoRunner: VideoTestRunner;
  let regression: VisualRegression;
  let reporter: VisionReportGenerator;
  const results: any[] = [];

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    const config = { apiKey: process.env.GEMINI_API_KEY!, model: 'gemini-3-flash' as const };

    runner = new VisionTestRunner(config);
    videoRunner = new VideoTestRunner(config);
    regression = new VisualRegression(config);
    reporter = new VisionReportGenerator({ projectName: 'E-commerce Tests' });
  });

  it('should add product to cart', async () => {
    const result = await runner.executeGoal(
      'Find a product, view its details, and add it to cart. Goal achieved when cart badge shows 1.',
      { maxSteps: 15 }
    );

    results.push(result);
    expect(result.success).toBe(true);
  });

  it('should complete checkout', async () => {
    const result = await runner.executeGoal(
      'Go to cart, proceed to checkout, fill shipping info, and complete purchase.',
      { maxSteps: 25 }
    );

    results.push(result);
    expect(result.success).toBe(true);
  });

  it('should pass visual regression', async () => {
    const screenshot = await device.takeScreenshot('order-confirmation');
    const { passed, diff } = await regression.compare('order-confirmation', screenshot);

    expect(passed).toBe(true);
  });

  afterAll(async () => {
    // Generate combined report
    reporter.generate({
      title: 'E-commerce Test Report',
      timestamp: new Date().toISOString(),
      goals: results,
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        coverage: 85,
      },
    });
  });
});
```

---

## Best Practices

### 1. Model Selection

```typescript
// Development: Fast iteration
const devConfig = { model: 'gemini-3-flash', thinkingLevel: 'MINIMAL' };

// CI/CD: Thorough testing
const ciConfig = { model: 'gemini-2.5-flash' };

// Complex flows: Maximum reasoning
const complexConfig = { model: 'gemini-2.5-pro' };
```

### 2. Goal Writing

```typescript
// Good: Specific and measurable
'Log in with email "user@test.com", then verify home screen shows "Welcome"'

// Good: Clear success criteria
'Add 3 items to cart and verify total shows correct sum'

// Avoid: Vague goals
'Test the login'
'Check if checkout works'
```

### 3. Error Handling

```typescript
const result = await runner.executeGoal(goal, { maxSteps: 20 });

if (!result.success) {
  // Log failure details
  const failedSteps = result.steps.filter(s => !s.success);
  console.error('Failed at:', failedSteps);

  // Save report for debugging
  reporter.generate({
    title: 'Failed Test Report',
    timestamp: new Date().toISOString(),
    goals: [result],
  });
}
```

### 4. Visual Regression in CI

```typescript
// In CI, fail on regressions but allow baseline updates
const { passed, diff } = await regression.compare('screen-name', screenshot, {
  updateOnDiff: process.env.UPDATE_BASELINES === 'true',
});

if (!passed && process.env.CI) {
  throw new Error(`Visual regression: ${JSON.stringify(diff.regressions)}`);
}
```

---

## Cost Estimation

### Per-Step Costs (approximate)

| Model | Input (image + prompt) | Output | Cost per Step |
|-------|------------------------|--------|---------------|
| Gemini 3 Flash | ~1500 tokens | ~500 tokens | ~$0.002 |
| Gemini 2.5 Flash | ~1500 tokens | ~500 tokens | ~$0.003 |
| Gemini 2.5 Pro | ~1500 tokens | ~500 tokens | ~$0.01 |

### Per-Test Costs

| Test Type | Steps | Gemini 3 Flash | Gemini 2.5 Pro |
|-----------|-------|----------------|----------------|
| Simple flow | 10 | ~$0.02 | ~$0.10 |
| Medium flow | 20 | ~$0.04 | ~$0.20 |
| Exploration | 50 | ~$0.10 | ~$0.50 |

### Video Analysis Costs

| Video Length | Gemini 2.5 Flash |
|--------------|------------------|
| 30 seconds | ~$0.10-0.20 |
| 2 minutes | ~$0.30-0.50 |
| 5 minutes | ~$0.50-1.00 |

### Monthly Estimates (typical usage)

| Usage Level | Tests/Day | Monthly Cost |
|-------------|-----------|--------------|
| Light | 10 | ~$10-20 |
| Medium | 50 | ~$50-100 |
| Heavy | 200 | ~$200-400 |

---

## Sources

- [Google Gen AI SDK (npm)](https://www.npmjs.com/package/@google/genai)
- [Google Gen AI SDK (GitHub)](https://github.com/googleapis/js-genai)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini 3 Flash](https://blog.google/products/gemini/gemini-3-flash/)
- [Wix Pilot](https://github.com/wix-incubator/pilot)
- [Detox Documentation](https://wix.github.io/Detox/)
