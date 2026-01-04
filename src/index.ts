/**
 * Eagle Vision - Vision-Enhanced E2E Testing
 *
 * AI-powered visual testing for mobile apps using Google Gemini.
 *
 * @example
 * ```typescript
 * import {
 *   GeminiVisionHandler,
 *   VisionTestRunner,
 *   VideoTestRunner,
 *   AppExplorer,
 *   VisualRegression
 * } from 'eagle-mobile-e2e-testing';
 *
 * // Create a vision handler
 * const handler = new GeminiVisionHandler({
 *   apiKey: process.env.GEMINI_API_KEY!,
 *   model: 'gemini-3-flash',
 * });
 *
 * // Create a test runner
 * const runner = new VisionTestRunner({
 *   apiKey: process.env.GEMINI_API_KEY!,
 *   model: 'gemini-3-flash',
 * });
 *
 * // Execute a goal
 * const result = await runner.executeGoal('Log in with test credentials');
 * ```
 */

// Handlers
export {
  GeminiVisionHandler,
  VisionHandlerConfig,
  VisionAction,
  ScreenAnalysis,
  PromptHandler,
  GeminiModel,
} from './handlers/GeminiVisionHandler';

// Runners
export {
  VisionTestRunner,
  StepResult,
  GoalResult,
  RunnerConfig,
} from './runners/VisionTestRunner';

export {
  VideoTestRunner,
  VideoAnalysis,
  ComparisonResult,
  AccessibilityAudit,
  VideoRunnerConfig,
} from './runners/VideoTestRunner';

export {
  AppExplorer,
  ExplorationResult,
  ExplorerConfig,
} from './runners/AppExplorer';

// Utilities
export {
  VisualRegression,
  VisualDiff,
  BaselineInfo,
  RegressionConfig,
} from './utils/VisualRegression';

export {
  VisionReportGenerator,
  VisionReportData,
  ReportGeneratorConfig,
} from './utils/VisionReportGenerator';

// Convenience re-exports
export { default as GeminiHandler } from './handlers/GeminiVisionHandler';
export { default as TestRunner } from './runners/VisionTestRunner';
export { default as VideoRunner } from './runners/VideoTestRunner';
export { default as Explorer } from './runners/AppExplorer';
export { default as Regression } from './utils/VisualRegression';
export { default as ReportGenerator } from './utils/VisionReportGenerator';
