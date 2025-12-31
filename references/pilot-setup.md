# Wix Pilot Setup Reference

AI-powered natural language testing with Wix Pilot for Detox.

## Table of Contents
1. [Installation](#installation)
2. [Prompt Handler Implementations](#prompt-handler-implementations)
3. [Basic Usage](#basic-usage)
4. [Autopilot Mode](#autopilot-mode)
5. [Advanced Configuration](#advanced-configuration)

## Installation

```bash
# Install Wix Pilot packages
npm install --save-dev @wix-pilot/core @wix-pilot/detox

# For specific LLM providers
npm install --save-dev @anthropic-ai/sdk   # Claude
npm install --save-dev openai              # OpenAI
npm install --save-dev @google/generative-ai  # Gemini
```

## Prompt Handler Implementations

### Claude (Anthropic) Handler

```typescript
// e2e/handlers/ClaudePromptHandler.ts
import Anthropic from '@anthropic-ai/sdk';
import { PromptHandler } from '@wix-pilot/core';

export class ClaudePromptHandler implements PromptHandler {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async runPrompt(prompt: string, image?: string): Promise<string> {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    if (image) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: image,
        },
      });
    }

    content.push({
      type: 'text',
      text: prompt,
    });

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock?.text || '';
  }

  isSnapshotImageSupported(): boolean {
    return true;
  }
}
```

### OpenAI Handler

```typescript
// e2e/handlers/OpenAIPromptHandler.ts
import OpenAI from 'openai';
import { PromptHandler } from '@wix-pilot/core';

export class OpenAIPromptHandler implements PromptHandler {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async runPrompt(prompt: string, image?: string): Promise<string> {
    const content: OpenAI.ChatCompletionContentPart[] = [];

    if (image) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${image}`,
        },
      });
    }

    content.push({
      type: 'text',
      text: prompt,
    });

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    });

    return response.choices[0]?.message?.content || '';
  }

  isSnapshotImageSupported(): boolean {
    return true;
  }
}
```

### Gemini Handler

```typescript
// e2e/handlers/GeminiPromptHandler.ts
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PromptHandler } from '@wix-pilot/core';

export class GeminiPromptHandler implements PromptHandler {
  private model: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async runPrompt(prompt: string, image?: string): Promise<string> {
    const systemPrompt = 'You are a test automation assistant for mobile app testing.\n\n';

    if (image) {
      const visionModel = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        .getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await visionModel.generateContent([
        {
          inlineData: {
            mimeType: 'image/png',
            data: image,
          },
        },
        { text: systemPrompt + prompt },
      ]);

      return result.response.text();
    }

    const result = await this.model.generateContent(systemPrompt + prompt);
    return result.response.text();
  }

  isSnapshotImageSupported(): boolean {
    return true;
  }
}
```

## Basic Usage

### Test Setup

```typescript
// e2e/pilot.test.ts
import { device } from 'detox';
import { Pilot } from '@wix-pilot/core';
import { DetoxFrameworkDriver } from '@wix-pilot/detox';
import { ClaudePromptHandler } from './handlers/ClaudePromptHandler';

describe('AI-Powered Tests', () => {
  let pilot: Pilot;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    pilot = new Pilot({
      frameworkDriver: new DetoxFrameworkDriver(),
      promptHandler: new ClaudePromptHandler(process.env.ANTHROPIC_API_KEY!),
    });
  });

  beforeEach(async () => {
    await pilot.start();
  });

  afterEach(async () => {
    await pilot.end();
  });

  it('should complete login flow', async () => {
    await pilot.perform(
      'Find the email input field and tap on it',
      'Type "user@example.com" into the focused field',
      'Find the password input field and tap on it',
      'Type "password123" into the focused field',
      'Tap the Login button',
      'Verify that the home screen is visible'
    );
  });

  it('should navigate to settings', async () => {
    await pilot.perform(
      'Tap on the menu icon or hamburger button',
      'Find and tap on Settings option',
      'Verify the Settings screen is displayed',
      'Check that notification toggle is visible'
    );
  });
});
```

### Writing Effective Prompts

```typescript
// Good: Specific and actionable
await pilot.perform(
  'Tap the blue "Sign Up" button at the bottom of the screen',
  'Enter "john.doe@email.com" in the email text field',
  'Tap the "Submit" button',
  'Wait for the success message to appear',
  'Verify text "Account created" is visible'
);

// Avoid: Vague or ambiguous
await pilot.perform(
  'Do the signup thing',  // Too vague
  'Click somewhere',       // Not specific
);
```

## Autopilot Mode

### Autonomous Flow Discovery

```typescript
it('should autonomously test the app', async () => {
  const report = await pilot.autopilot(
    'Explore this mobile app and test all visible features. ' +
    'Start from the current screen and navigate through: ' +
    '1. Any authentication flows (login, signup) ' +
    '2. Main navigation tabs or menu items ' +
    '3. Settings and profile sections ' +
    '4. Any forms or data entry screens ' +
    'Report any errors, crashes, or unexpected behavior.'
  );

  console.log('Autopilot Test Report:');
  console.log(JSON.stringify(report, null, 2));

  // Assert no critical errors
  expect(report.errors).toHaveLength(0);
});
```

### Comprehensive App Testing

```typescript
it('should test complete user journey', async () => {
  const report = await pilot.autopilot(`
    Test the complete user journey for this app:
    
    1. ONBOARDING: If there's an onboarding flow, complete it
    2. AUTHENTICATION: Test login with credentials user@test.com / Test123!
    3. MAIN FEATURES: Navigate to each main section and interact with key features
    4. DATA ENTRY: Fill any forms with realistic test data
    5. NAVIGATION: Test all navigation paths (tabs, menus, back buttons)
    6. ERROR HANDLING: Try invalid inputs and verify error messages
    7. SETTINGS: Check all settings options
    
    Take screenshots at each major screen.
    Report detailed findings for each section.
  `);

  // Save report
  const fs = require('fs');
  fs.writeFileSync(
    'e2e/reports/autopilot-report.json',
    JSON.stringify(report, null, 2)
  );
});
```

## Advanced Configuration

### Extending API Catalog

```typescript
// Add custom actions to Pilot's knowledge
pilot.extendAPICatalog([
  {
    name: 'Custom Actions',
    actions: [
      {
        name: 'waitForNetworkIdle',
        description: 'Wait for all network requests to complete',
        example: 'await waitFor(1000);',
      },
      {
        name: 'takeCustomScreenshot',
        description: 'Take a screenshot with custom name',
        example: 'await device.takeScreenshot("custom-name");',
      },
    ],
  },
]);
```

### Caching Configuration

```typescript
const pilot = new Pilot({
  frameworkDriver: new DetoxFrameworkDriver(),
  promptHandler: new ClaudePromptHandler(apiKey),
  options: {
    cacheEnabled: true,           // Cache LLM responses
    cacheDirectory: './e2e/.cache',
    snapshotEnabled: true,        // Enable visual analysis
  },
});
```

### Error Handling

```typescript
it('should handle test failures gracefully', async () => {
  try {
    await pilot.perform(
      'Tap on non-existent button',
      'Verify impossible state'
    );
  } catch (error) {
    // Take screenshot on failure
    await device.takeScreenshot('failure-screenshot');
    
    // Log the error details
    console.error('Test failed:', error.message);
    
    // Re-throw for Jest to handle
    throw error;
  }
});
```

### Multi-Language Support

```typescript
// Tests can be written in any language the LLM understands
await pilot.perform(
  'Klicken Sie auf die Schaltfläche "Anmelden"',  // German
  '入力フィールドにテキストを入力してください',      // Japanese
  'Vérifiez que le message de succès est visible'  // French
);
```

## Best Practices

1. **Use clear, specific language** - Describe exactly what element to interact with
2. **One action per step** - Break complex flows into individual steps
3. **Include verification steps** - Add assertions after important actions
4. **Handle async operations** - Account for loading states and animations
5. **Use visual context** - Enable snapshot support for better element identification
6. **Cache responses** - Enable caching to speed up repeated test runs
7. **Log autopilot reports** - Save detailed reports for analysis
