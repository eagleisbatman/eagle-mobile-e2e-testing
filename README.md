<div align="center">

# Eagle Mobile E2E Testing

### *Universal Agent Skill for Mobile Testing Excellence*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue?style=for-the-badge)](/)
[![Detox](https://img.shields.io/badge/Powered%20by-Detox-orange?style=for-the-badge)](https://wix.github.io/Detox/)

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Ready-blueviolet?style=flat-square)](https://claude.ai)
[![OpenAI Codex](https://img.shields.io/badge/OpenAI%20Codex-Ready-green?style=flat-square)](https://openai.com/codex)
[![Cursor](https://img.shields.io/badge/Cursor-Ready-blue?style=flat-square)](https://cursor.com)
[![GitHub Copilot](https://img.shields.io/badge/Copilot-Ready-black?style=flat-square)](https://github.com/features/copilot)

<br />

**Production-grade E2E testing for mobile apps with AI-powered test generation**

*React Native (Expo/CLI) · SwiftUI · UIKit · Jetpack Compose · XML Views*

<br />

[Getting Started](#quick-start) ·
[Features](#features) ·
[Examples](#examples-library) ·
[Documentation](#documentation) ·
[Advanced Testing](#advanced-capabilities)

---

</div>

## What Makes Eagle Special?

| | Feature | Description |
|:---:|---------|-------------|
| ◉ | **Universal Platform Support** | Single skill for React Native, iOS native, and Android native apps |
| ◉ | **Multi-Agent Compatible** | Works with Claude Code, Codex, Cursor, Copilot, and 20+ AI tools |
| ◉ | **AI-Powered Testing** | Generate tests from natural language using Wix Pilot |
| ◉ | **Vision-Enhanced Testing** | Goal-based testing with Gemini vision - self-correcting and testID-independent |
| ◉ | **Rich Artifacts** | Video recordings, screenshots, logs, and timeline traces for every test |
| ◉ | **Beautiful Reports** | Modern HTML reports with dark/light mode and video playback |
| ◉ | **Advanced Scenarios** | Biometrics, deep links, permissions, offline mode, network mocking |
| ◉ | **CI/CD Ready** | Pre-configured workflows for GitHub Actions, CircleCI, and Bitrise |

---

## Multi-Platform Compatibility

Eagle follows two open standards, making it work across 25+ AI coding assistants:

| Standard | File | Supported Tools |
|----------|------|-----------------|
| **[Agent Skills](https://agentskills.io)** | `SKILL.md` | Claude Code, OpenAI Codex, GitHub Copilot, VS Code |
| **[AGENTS.md](https://agents.md)** | `AGENTS.md` | Cursor, Codex, Copilot, Windsurf, Aider, Jules, and 20+ more |

Both files are included — use whichever your tool supports.

---

## Important: How AI Agents Use This Skill

When writing E2E tests, AI agents follow these critical guidelines:

| Guideline | Why It Matters |
|-----------|----------------|
| **UI Discovery First** | Before writing tests, search for existing testIDs using targeted grep — never dump entire files |
| **Background Execution** | All builds (`detox build`) and test runs (`detox test`) execute in background to prevent terminal flooding |
| **Selective Reading** | Read only relevant code sections (first 60 lines, specific patterns) — not entire components |
| **Output Limiting** | All search results are limited with `head -N` to prevent terminal crashes |

These practices ensure smooth, efficient test development without overwhelming your terminal.

---

## Quick Start

Choose the installation method for your AI coding tool:

### Claude Code

```bash
# Option 1: Clone to skills directory (Recommended)
git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git ~/.claude/skills/eagle-mobile-e2e-testing

# Option 2: One-liner
mkdir -p ~/.claude/skills && git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git ~/.claude/skills/eagle-mobile-e2e-testing
```

Restart Claude Code. Verify by asking: *"What mobile testing capabilities do you have?"*

### OpenAI Codex

```bash
# Option 1: Clone to skills directory
git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git ~/.codex/skills/eagle-mobile-e2e-testing

# Option 2: Use built-in installer
# In Codex, type: $skill-installer
# Then: Install from github.com/eagleisbatman/eagle-mobile-e2e-testing
```

### Cursor

Cursor reads `AGENTS.md` from your project root:

```bash
# Option 1: Copy AGENTS.md to your project
curl -o AGENTS.md https://raw.githubusercontent.com/eagleisbatman/eagle-mobile-e2e-testing/main/AGENTS.md

# Option 2: Clone entire repo for full examples
git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git
# Then open the folder in Cursor
```

### GitHub Copilot

```bash
# Clone to your project's skills directory
git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git .github/skills/eagle-mobile-e2e-testing
```

### Other Tools (Windsurf, Aider, etc.)

Most AI coding tools read `AGENTS.md` from the project root:

```bash
curl -o AGENTS.md https://raw.githubusercontent.com/eagleisbatman/eagle-mobile-e2e-testing/main/AGENTS.md
```

---

## Start Testing

Once installed, use these prompt templates to get the best results from your AI assistant.

### Quick Start Prompts

> *"Help me set up Detox E2E testing for my React Native Expo app. My screens are in src/features/*/screens/"*

> *"Write E2E tests for my login flow in src/screens/LoginScreen.tsx"*

> *"Test biometric authentication in my iOS SwiftUI app"*

### Recommended Prompt Template (Complete E2E Workflow)

For the **full workflow** (setup → write → run → report), use this template:

> Set up complete E2E testing for my mobile app and run tests with reports.
>
> **PROJECT:**
> - App: [MyApp]
> - Framework: [React Native Expo / CLI / SwiftUI / Compose]
> - Project root: [/path/to/project]
> - Screens: [src/screens/ or src/features/*/screens/]
> - Navigation: [React Navigation / Expo Router / Native]
>
> **WHAT I NEED:**
> 1. Set up Detox (install, configure)
> 2. Discover UI and existing testIDs
> 3. Add missing testIDs to components
> 4. Write tests for: [list features]
> 5. Build and run tests
> 6. Generate HTML report with videos
>
> **FEATURES TO TEST:**
> - [Feature 1]: User flow description
> - [Feature 2]: User flow description
>
> **DEVICES:** [iPhone 15 / Pixel 4 API 33]
> **SPECIAL:** [biometrics / deep links / CI setup / none]

### Example Prompt (Complete Workflow)

> Set up complete E2E testing for my e-commerce app and run tests with reports.
>
> **PROJECT:**
> - App: ShopApp
> - Framework: React Native Expo with TypeScript
> - Project root: /Users/me/projects/shopapp
> - Screens: src/features/*/screens/
> - Navigation: Expo Router with bottom tabs
>
> **WHAT I NEED:**
> 1. Set up Detox from scratch
> 2. Discover all screens and testIDs
> 3. Add missing testIDs to components
> 4. Write tests for login, products, cart, checkout
> 5. Run tests on iOS simulator with video recording
> 6. Generate HTML report
>
> **FEATURES TO TEST:**
> - Login: User enters email/password → taps Login → sees Home
> - Products: User browses products → taps item → sees details
> - Cart: User adds to cart → views cart → sees items
> - Checkout: User proceeds to checkout → enters address → completes order
>
> **DEVICES:** iPhone 15 Simulator
> **SPECIAL:** Set up GitHub Actions CI after tests pass

See [SKILL.md](SKILL.md) for 5 detailed templates covering different scenarios.

---

## Platform Support Matrix

| Platform | Framework | Support | testID Method |
|:--------:|:---------:|:-------:|---------------|
| React Native | Expo | Full | `testID="id"` |
| React Native | CLI | Full | `testID="id"` |
| iOS | SwiftUI | Full | `.accessibilityIdentifier("id")` |
| iOS | UIKit | Full | `accessibilityIdentifier = "id"` |
| Android | Compose | Full | `Modifier.testTag("id")` |
| Android | XML | Full | `android:contentDescription="id"` |

---

## Features

### Enforced Best Practices

Tests that are readable, maintainable, and produce meaningful reports:

```typescript
// File: e2e/flows/auth/login-flow.test.ts

describe('User Authentication - Login Flow', () => {
  it('should display welcome screen with login and register options', async () => {});
  it('should navigate to login screen when tapping Sign In', async () => {});
  it('should show validation error for invalid email format', async () => {});
  it('should navigate to home screen after successful authentication', async () => {});
});
```

### Standardized testID Patterns

```typescript
// Pattern: {screen}-{element}-{type}
testID="login-screen"              // Screen container
testID="login-email-input"         // Input field
testID="login-submit-button"       // Button
testID="login-error-banner"        // Error display
testID="product-row-0"             // Indexed list items
```

### Professional HTML Reports

The included report generator creates beautiful, interactive reports with:

- **Dark/Light mode toggle** — with system preference detection
- **Two-column layout** — Video playback alongside test details
- **Screenshot gallery** — with lightbox viewer
- **Timeline visualization** — of test steps
- **Filtering** — by passed/failed status
- **Keyboard navigation** — arrow keys and j/k support
- **Professional icons** — using Lucide icon library (open source)

```bash
# Generate a standalone report
node scripts/generate-report.js --artifacts ./artifacts --output ./reports --project "My App"
```

### Report Hub — Consolidated Test Dashboard

For QA teams running multiple test sessions, the **Report Hub** creates a single dashboard with side navigation to browse all test runs:

```bash
# First run - creates hub
node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Login Flow"

# Subsequent runs - appends to existing hub
node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Checkout"
node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Registration"
```

| Feature | Description |
|---------|-------------|
| Session Navigation | Side menu lists all test runs |
| Append Mode | New runs added to existing hub |
| Pass Rate Trends | Visual chart across runs |
| Test Filtering | Filter by passed/failed |
| Video Playback | Embedded player |
| Dark/Light Mode | Theme toggle |

---

## Advanced Capabilities

<details>
<summary><b>Device Permissions</b></summary>

```typescript
// iOS - Full permission control
await device.launchApp({
  permissions: {
    camera: 'YES',
    photos: 'YES',
    location: 'always',
    notifications: 'YES',
    microphone: 'YES'
  }
});

// Android - ADB commands for permissions
await device.launchApp({
  launchArgs: {
    'GRANT_CAMERA': 'true'
  }
});
```
</details>

<details>
<summary><b>Biometric Authentication</b></summary>

```typescript
// Enable biometrics
await device.setBiometricEnrollment(true);

// Simulate Face ID success
await device.matchFace();

// Simulate Touch ID success
await device.matchFinger();

// Simulate failure
await device.unmatchFace();
```
</details>

<details>
<summary><b>Deep Linking</b></summary>

```typescript
// Launch with deep link
await device.launchApp({
  url: 'myapp://products/12345'
});

// Open URL while app is running
await device.openURL({
  url: 'myapp://checkout?promo=SAVE20'
});
```
</details>

<details>
<summary><b>Push Notifications</b></summary>

```typescript
await device.sendUserNotification({
  trigger: { type: 'push' },
  title: 'New Message!',
  body: 'You have a new message from John',
  payload: {
    messageId: '12345',
    senderId: 'john-doe'
  }
});
```
</details>

<details>
<summary><b>Network Mocking and Offline Mode</b></summary>

```typescript
// Block analytics/tracking URLs
await device.setURLBlacklist([
  '.*analytics.*',
  '.*tracking.*'
]);

// Disable network entirely
await device.disableSynchronization();
await device.setURLBlacklist(['.*']);

// Re-enable
await device.enableSynchronization();
await device.setURLBlacklist([]);
```
</details>

<details>
<summary><b>Location Mocking</b></summary>

```typescript
// San Francisco
await device.setLocation(37.7749, -122.4194);

// Tokyo
await device.setLocation(35.6762, 139.6503);

// Moving location (GPS simulation)
await device.setLocation(37.7749, -122.4194);
await new Promise(r => setTimeout(r, 2000));
await device.setLocation(37.7751, -122.4180);
```
</details>

<details>
<summary><b>Background/Foreground States</b></summary>

```typescript
// Send app to background
await device.sendToHome();

// Wait for some time
await new Promise(r => setTimeout(r, 5000));

// Bring app back to foreground
await device.launchApp({ newInstance: false });

// Verify app state restored correctly
await expect(element(by.id('home-screen'))).toBeVisible();
```
</details>

<details>
<summary><b>Vision-Enhanced Testing with Gemini</b></summary>

Use AI vision to intelligently navigate and test your app. See the dedicated **[Vision Testing](#vision-testing)** section below for complete documentation.

```typescript
import { VisionTestRunner, GeminiVisionHandler } from 'eagle-mobile-e2e-testing';

// Goal-based testing - AI figures out how to achieve the goal
const runner = new VisionTestRunner({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash',
});

const result = await runner.executeGoal(
  'Log in with email "test@example.com" and password "Test123!"',
  { maxSteps: 15 }
);

expect(result.success).toBe(true);
```
</details>

---

## Vision Testing

Eagle includes a powerful vision testing system powered by **Google Gemini** models. This enables intelligent, self-correcting tests that can navigate apps visually without relying solely on testIDs.

### Why Vision Testing?

| Problem | Vision Solution |
|---------|-----------------|
| Tests break when testIDs change | Visual element detection works regardless of IDs |
| Tests get "lost" after navigation | Self-correcting: analyzes screen and recovers |
| Shallow test coverage | Autonomous exploration discovers all screens |
| No visual validation | Screenshot comparison detects regressions |
| Accessibility is an afterthought | Built-in WCAG compliance auditing |

### Quick Start

```bash
# Install dependencies
npm install @google/genai

# Set your Gemini API key
export GEMINI_API_KEY=your_api_key
```

### Core Modules

Import from the `src/` directory:

```typescript
import {
  // Handlers
  GeminiVisionHandler,

  // Runners
  VisionTestRunner,
  VideoTestRunner,
  AppExplorer,

  // Utilities
  VisualRegression,
  VisionReportGenerator,
} from './src';
```

### Usage Examples

#### Goal-Based Testing

```typescript
import { VisionTestRunner } from './src';

const runner = new VisionTestRunner({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash', // Fast and cost-effective
});

// AI figures out how to achieve the goal
const result = await runner.executeGoal(
  'Navigate to Settings and enable dark mode',
  { maxSteps: 10 }
);

expect(result.success).toBe(true);
```

#### Visual Regression Testing

```typescript
import { VisualRegression } from './src';

const regression = new VisualRegression({
  apiKey: process.env.GEMINI_API_KEY!,
  baselinesDir: './e2e/baselines',
  threshold: 95, // 95% similarity required
});

// Compare screenshot against baseline
const { passed, diff } = await regression.compare(
  'login-screen',
  await device.takeScreenshot('login')
);

expect(passed).toBe(true);
```

#### Autonomous App Exploration

```typescript
import { AppExplorer } from './src';

const explorer = new AppExplorer({
  apiKey: process.env.GEMINI_API_KEY!,
  maxSteps: 50,
  maxScreens: 15,
});

// Discover screens and find issues
const result = await explorer.explore();

console.log(`Discovered ${result.screensDiscovered.length} screens`);
console.log(`Found ${result.issuesFound.length} issues`);
```

#### Wix Pilot Integration

```typescript
import { Pilot } from '@wix-pilot/core';
import { DetoxFrameworkDriver } from '@wix-pilot/detox';
import { GeminiVisionHandler } from './src';

const visionHandler = new GeminiVisionHandler({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-3-flash',
});

const pilot = new Pilot({
  frameworkDriver: new DetoxFrameworkDriver(),
  promptHandler: visionHandler, // Use Gemini for decisions
});

await pilot.perform(
  'Find the login button and tap it',
  'Enter test@example.com in the email field',
  'Verify the home screen is visible'
);
```

### Available Gemini Models

| Model | Best For | Speed | Cost |
|-------|----------|-------|------|
| `gemini-3-flash` | Most testing (recommended) | Fastest | $0.50/1M tokens |
| `gemini-2.5-flash` | Complex reasoning with thinking | Fast | $0.15/1M tokens |
| `gemini-2.5-pro` | Highest accuracy tasks | Slower | $1.25/1M tokens |

### Complete Documentation

See **[references/vision-testing.md](references/vision-testing.md)** for:
- Detailed API reference for all modules
- Advanced configuration options
- Multi-device testing patterns
- Accessibility auditing
- Video analysis
- Integration patterns

---

## Examples Library

The skill includes comprehensive example tests for various app types:

| Category | Examples | Key Patterns |
|----------|----------|--------------|
| **Authentication** | Login, Registration, Password Reset, Social Login, Biometrics, 2FA | Form validation, error handling, session management |
| **E-Commerce** | Product Browsing, Cart, Checkout, Payments, Orders, Wishlist | Product catalog, cart operations, payment flows |
| **Social Media** | Feeds, Posts, Stories, Profiles, Following, DMs | Infinite scroll, media upload, interactions |
| **Messaging** | Chat, Group Chats, Media Sharing, Voice/Video Calls | Real-time updates, media handling, call states |
| **Onboarding** | Welcome Flows, Tutorials, Permissions, Personalization | Carousels, progress indicators, skip logic |
| **Gaming** | Menus, In-App Purchases, Leaderboards, Achievements | IAP flows, score tracking, multiplayer |
| **Media** | Video Player, Audio Player, Streaming, Downloads | Playback controls, quality selection, offline |
| **Productivity** | Forms, File Management, Calendar, Notes | Data entry, file operations, scheduling |
| **Navigation** | Tab Navigation, Drawer, Stack, Deep Links | Navigation patterns, state preservation |
| **Settings** | Preferences, Account, Privacy, Notifications | Toggle states, data management |

---

## Documentation

| Document | Description |
|----------|-------------|
| [SKILL.md](SKILL.md) | Full skill reference (Claude Code, Codex, Copilot) |
| [AGENTS.md](AGENTS.md) | Condensed reference (Cursor, Windsurf, Aider, 20+ tools) |
| [vision-testing.md](references/vision-testing.md) | **Vision testing with Gemini** — complete API reference |
| [detox-config.md](references/detox-config.md) | Detox configuration deep-dive |
| [android-setup.md](references/android-setup.md) | Android native code patches |
| [pilot-setup.md](references/pilot-setup.md) | AI-powered test generation setup |
| [ci-workflows.md](references/ci-workflows.md) | CI/CD workflow configurations |

---

## Project Structure

```
eagle-mobile-e2e-testing/
├── SKILL.md                      # Agent Skills format (Claude Code, Codex, Copilot)
├── AGENTS.md                     # AGENTS.md format (Cursor, Windsurf, Aider, 20+ tools)
├── README.md                     # This file
├── LICENSE                       # MIT License
│
├── src/                          # Vision testing modules (import from here)
│   ├── index.ts                  # Main exports
│   ├── handlers/
│   │   └── GeminiVisionHandler.ts    # Core vision handler (PromptHandler interface)
│   ├── runners/
│   │   ├── VisionTestRunner.ts       # Goal-based test execution
│   │   ├── VideoTestRunner.ts        # Video analysis & comparison
│   │   └── AppExplorer.ts            # Autonomous app exploration
│   └── utils/
│       ├── VisualRegression.ts       # Screenshot baseline comparison
│       └── VisionReportGenerator.ts  # HTML report generation
│
├── references/
│   ├── vision-testing.md         # Complete vision testing documentation
│   ├── detox-config.md           # Complete .detoxrc.js guide
│   ├── android-setup.md          # Android native patches
│   ├── pilot-setup.md            # Wix Pilot AI testing
│   └── ci-workflows.md           # CI/CD configurations
│
├── scripts/
│   ├── run-e2e.sh                # Automated test runner
│   ├── generate-report.js        # Standalone HTML report generator
│   └── report-hub.js             # Consolidated dashboard (multi-session)
│
├── examples/                     # Comprehensive test examples
│   ├── vision-pilot-integration.test.ts  # Vision + Wix Pilot patterns
│   ├── vision-login.test.ts              # Vision-based login testing
│   ├── vision-exploration.test.ts        # App exploration examples
│   ├── vision-video-analysis.test.ts     # Video analysis examples
│   ├── login-flow.test.ts                # Authentication patterns
│   ├── e-commerce.test.ts                # Shopping cart, checkout
│   ├── social-media.test.ts              # Feed, posts, stories
│   ├── accessibility.test.ts             # A11y testing patterns
│   └── ...                               # More examples
│
└── .github/
    └── workflows/
        └── e2e-tests.yml.template  # GitHub Actions template
```

---

## System Requirements

### macOS (for iOS testing)
- Xcode 14+ with Command Line Tools
- applesimutils (`brew install applesimutils`)
- Node.js 18+

### Android
- Android SDK with emulator
- Java 17+
- Node.js 18+

---

## Contributing

Contributions are welcome! Whether it's:

- Bug reports
- Feature suggestions
- Documentation improvements
- Code contributions

Please feel free to open an issue or submit a PR.

```bash
# Fork, clone, create branch
git checkout -b feature/amazing-feature

# Make changes, commit
git commit -m 'Add amazing feature'

# Push and open PR
git push origin feature/amazing-feature
```

---

## Resources

| Resource | Link |
|----------|------|
| Detox Documentation | [wix.github.io/Detox](https://wix.github.io/Detox/) |
| Wix Pilot (AI Testing) | [github.com/wix-incubator/pilot](https://github.com/wix-incubator/pilot) |
| Detox GitHub | [github.com/wix/Detox](https://github.com/wix/Detox) |
| Google Gemini AI | [ai.google.dev](https://ai.google.dev/) |
| @google/genai SDK | [npmjs.com/package/@google/genai](https://www.npmjs.com/package/@google/genai) |
| Agent Skills Specification | [agentskills.io](https://agentskills.io/) |
| AGENTS.md Standard | [agents.md](https://agents.md/) |
| Lucide Icons | [lucide.dev](https://lucide.dev/) |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Made with care by [Gautam Mandewalker](https://www.linkedin.com/in/gautammandewalker)

*For the mobile testing community*

<br />

**[Back to Top](#eagle-mobile-e2e-testing)**

</div>
