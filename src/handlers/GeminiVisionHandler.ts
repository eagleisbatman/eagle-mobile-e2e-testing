/**
 * GeminiVisionHandler - Vision-first prompt handler for mobile app testing
 *
 * Implements the PromptHandler interface from @wix-pilot/core, enabling
 * integration with Wix Pilot while providing advanced vision capabilities.
 *
 * Supports Gemini 3 Flash, 2.5 Flash, and 2.5 Pro models.
 */

import { GoogleGenAI, Chat, Content } from '@google/genai';

// ============================================================================
// Types
// ============================================================================

export type GeminiModel = 'gemini-3-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash';

export interface VisionHandlerConfig {
  apiKey: string;
  model?: GeminiModel;
  /** Thinking level for Gemini 3 models */
  thinkingLevel?: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  /** Temperature for response generation (0.0-1.0) */
  temperature?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Custom system prompt (appended to default) */
  customSystemPrompt?: string;
}

export interface VisionAction {
  observation: string;
  currentState: string;
  elements?: Array<{
    type: string;
    identifier: string;
    state: string;
    position: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  action: {
    type: 'tap' | 'type' | 'scroll' | 'swipe' | 'longPress' | 'wait' | 'back' | 'none';
    target: string;
    value?: string;
    coordinates?: { x: number; y: number };
    fallbackTargets?: string[];
  };
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
  concerns?: string;
}

export interface ScreenAnalysis {
  screenName: string;
  description: string;
  elements: Array<{
    type: string;
    identifier: string;
    text?: string;
    position: string;
    interactable: boolean;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  issues: Array<{
    type: 'visual' | 'functional' | 'accessibility' | 'performance';
    severity: 'low' | 'medium' | 'high';
    description: string;
    element?: string;
  }>;
  suggestedTestCases: string[];
}

// ============================================================================
// PromptHandler Interface (from @wix-pilot/core)
// ============================================================================

export interface PromptHandler {
  runPrompt(prompt: string, image?: string): Promise<string>;
  isSnapshotImageSupported(): boolean;
}

// ============================================================================
// GeminiVisionHandler
// ============================================================================

export class GeminiVisionHandler implements PromptHandler {
  private ai: GoogleGenAI;
  private model: string;
  private chat: Chat | null = null;
  private config: VisionHandlerConfig;
  private conversationHistory: Content[] = [];

  constructor(config: VisionHandlerConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gemini-3-flash';
    this.config = config;
  }

  // --------------------------------------------------------------------------
  // System Prompts
  // --------------------------------------------------------------------------

  private getDefaultSystemPrompt(): string {
    return `You are an expert mobile app tester with VISION capabilities.

CRITICAL: You can SEE the screenshot. Base your decisions on what you ACTUALLY SEE, not assumptions.

## When Analyzing a Screenshot

1. **DESCRIBE** what you see on screen (UI elements, text, buttons, states)
2. **IDENTIFY** interactive elements (buttons, inputs, tabs, toggles, etc.)
3. **DETECT** loading states, errors, modals, or unexpected conditions
4. **DETERMINE** the current app state/screen

## When Given a Task

1. Look at the screenshot FIRST
2. Find the relevant element VISUALLY
3. If element has a testID, prefer using it
4. If no testID visible, describe element by:
   - Position (top-left, center, bottom, near X element)
   - Appearance (blue button, text field with placeholder "Email")
   - Text content (button says "Submit", label shows "Username")

## Response Format for Actions

Always respond with valid JSON:

{
  "observation": "Detailed description of what I see on the screen",
  "currentState": "screen_name (e.g., login_screen, home_screen, loading, error, unknown)",
  "elements": [
    {
      "type": "button | input | toggle | tab | list | text | image",
      "identifier": "testID if visible, or visual description",
      "state": "enabled | disabled | selected | loading",
      "position": "top | center | bottom | left | right",
      "boundingBox": { "x": 100, "y": 200, "width": 80, "height": 40 }
    }
  ],
  "action": {
    "type": "tap | type | scroll | swipe | longPress | wait | back | none",
    "target": "testID or visual description of element",
    "value": "text to type, scroll direction, or wait duration",
    "coordinates": { "x": 150, "y": 220 },
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
- Identify both the current screen AND any overlays/modals/alerts
- When providing bounding boxes, estimate based on visual position`;
  }

  private getScreenAnalysisPrompt(): string {
    return `Analyze this mobile app screen comprehensively.

Return JSON:
{
  "screenName": "unique identifier for this screen",
  "description": "what this screen is for",
  "elements": [
    {
      "type": "button | input | toggle | tab | list | text | image | icon",
      "identifier": "testID or description",
      "text": "visible text if any",
      "position": "top-left | top-center | top-right | center-left | center | center-right | bottom-left | bottom-center | bottom-right",
      "interactable": true/false,
      "boundingBox": { "x": 0, "y": 0, "width": 0, "height": 0 }
    }
  ],
  "issues": [
    {
      "type": "visual | functional | accessibility | performance",
      "severity": "low | medium | high",
      "description": "what's wrong",
      "element": "which element if applicable"
    }
  ],
  "suggestedTestCases": [
    "Test case 1 description",
    "Test case 2 description"
  ]
}`;
  }

  private getFullSystemPrompt(): string {
    let prompt = this.getDefaultSystemPrompt();
    if (this.config.customSystemPrompt) {
      prompt += '\n\n## Additional Instructions\n\n' + this.config.customSystemPrompt;
    }
    return prompt;
  }

  // --------------------------------------------------------------------------
  // PromptHandler Interface Implementation
  // --------------------------------------------------------------------------

  async runPrompt(prompt: string, image?: string): Promise<string> {
    const parts: any[] = [];

    // Add image first if provided
    if (image) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: image,
        },
      });
    }

    // Add system prompt + user prompt
    parts.push({ text: this.getFullSystemPrompt() + '\n\n---\n\n' + prompt });

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts }],
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
    } catch (error: any) {
      console.error('Gemini API error:', error.message);
      throw error;
    }
  }

  isSnapshotImageSupported(): boolean {
    return true;
  }

  // --------------------------------------------------------------------------
  // Chat Session Management
  // --------------------------------------------------------------------------

  /**
   * Start a new chat session for multi-turn conversations.
   * Use this for goal-based testing where context matters.
   */
  async startChat(): Promise<void> {
    this.conversationHistory = [];
    this.chat = this.ai.chats.create({
      model: this.model,
      config: {
        temperature: this.config.temperature ?? 0.2,
        maxOutputTokens: this.config.maxOutputTokens ?? 4096,
        systemInstruction: this.getFullSystemPrompt(),
      },
    });
  }

  /**
   * Send a message in an ongoing chat session.
   * Maintains conversation context for better reasoning.
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
   * Reset the chat session. Call between tests.
   */
  resetChat(): void {
    this.chat = null;
    this.conversationHistory = [];
  }

  // --------------------------------------------------------------------------
  // High-Level Vision Methods
  // --------------------------------------------------------------------------

  /**
   * Analyze a screenshot and return structured action recommendation.
   */
  async analyzeForAction(
    screenshot: string,
    goal: string,
    context?: string
  ): Promise<VisionAction> {
    const prompt = context
      ? `GOAL: ${goal}\n\nCONTEXT: ${context}\n\nAnalyze the screenshot and determine the next action.`
      : `GOAL: ${goal}\n\nAnalyze the screenshot and determine the next action.`;

    const response = await this.sendChatMessage(prompt, screenshot);
    return this.parseVisionAction(response);
  }

  /**
   * Perform comprehensive screen analysis.
   */
  async analyzeScreen(screenshot: string): Promise<ScreenAnalysis> {
    const response = await this.runPrompt(this.getScreenAnalysisPrompt(), screenshot);
    return this.parseScreenAnalysis(response);
  }

  /**
   * Compare two screenshots and describe differences.
   */
  async compareScreenshots(
    baseline: string,
    current: string,
    context?: string
  ): Promise<{
    identical: boolean;
    differences: string[];
    regressions: string[];
    improvements: string[];
  }> {
    // Send both images in one request
    const parts: any[] = [
      {
        inlineData: { mimeType: 'image/png', data: baseline },
      },
      {
        inlineData: { mimeType: 'image/png', data: current },
      },
      {
        text: `Compare these two mobile app screenshots.

IMAGE 1 = BASELINE (expected state)
IMAGE 2 = CURRENT (actual state)

${context ? `Context: ${context}\n\n` : ''}Return JSON:
{
  "identical": true/false,
  "differences": ["List of visual differences"],
  "regressions": ["Things that got worse or broke"],
  "improvements": ["Things that improved"]
}

Look for:
- Layout changes
- Missing or new elements
- Text changes
- Color/styling differences
- Positioning shifts
- State differences (selected, disabled, etc.)`,
      },
    ];

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts }],
      config: { temperature: 0.1 },
    });

    return this.parseComparisonResult(response.text || '');
  }

  /**
   * Get element coordinates using Gemini's spatial understanding.
   */
  async getElementCoordinates(
    screenshot: string,
    elementDescription: string
  ): Promise<{ x: number; y: number; confidence: string } | null> {
    const prompt = `Find the element: "${elementDescription}"

Return JSON:
{
  "found": true/false,
  "coordinates": { "x": 0, "y": 0 },
  "confidence": "high | medium | low",
  "description": "what you found"
}

Provide the CENTER point of the element in pixel coordinates.
If the element is not visible, set found to false.`;

    const response = await this.runPrompt(prompt, screenshot);

    try {
      const json = response.match(/\{[\s\S]*\}/)?.[0];
      if (json) {
        const result = JSON.parse(json);
        if (result.found && result.coordinates) {
          return {
            x: result.coordinates.x,
            y: result.coordinates.y,
            confidence: result.confidence,
          };
        }
      }
    } catch {}

    return null;
  }

  // --------------------------------------------------------------------------
  // Parsing Helpers
  // --------------------------------------------------------------------------

  private parseVisionAction(response: string): VisionAction {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse vision action response');
    }

    return {
      observation: response,
      currentState: 'unknown',
      action: { type: 'none', target: '' },
      confidence: 'low',
      concerns: 'Could not parse structured response',
    };
  }

  private parseScreenAnalysis(response: string): ScreenAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    return {
      screenName: 'unknown',
      description: response,
      elements: [],
      issues: [],
      suggestedTestCases: [],
    };
  }

  private parseComparisonResult(response: string): {
    identical: boolean;
    differences: string[];
    regressions: string[];
    improvements: string[];
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    return {
      identical: false,
      differences: [response],
      regressions: [],
      improvements: [],
    };
  }
}

export default GeminiVisionHandler;
