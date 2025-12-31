# Eagle Mobile E2E Testing

> **For AI Coding Agents** | Human docs: [README.md](README.md) | Full reference: [SKILL.md](SKILL.md)

Production-grade E2E testing skill for mobile apps using **Detox**. Supports React Native (Expo/CLI), iOS native (SwiftUI/UIKit), and Android native (Jetpack Compose/XML).

**Author:** [Gautam Mandewalker](https://www.linkedin.com/in/gautammandewalker) | **License:** MIT

---

**Contents:** [Critical Rules](#critical-rules) | [testID Conventions](#testid-conventions) | [Test Naming](#test-naming) | [Build & Test](#build--test-commands) | [Test Patterns](#common-test-patterns) | [Quick Reference](#quick-reference) | [Setup](#setup-requirements)

---

## Critical Rules

### 1. UI Discovery Before Writing Tests

**NEVER write tests without first discovering the UI structure.**

```bash
# Find existing testIDs
grep -rn "testID=" --include="*.tsx" --include="*.jsx" src/ | head -50

# Find screens/pages
grep -rn "Screen\|Page\|View" --include="*.tsx" src/ | head -30

# iOS Swift projects
grep -rn "accessibilityIdentifier" --include="*.swift" | head -30

# Android Compose
grep -rn "testTag" --include="*.kt" | head -30
```

### 2. Background Execution Required

**Long-running commands MUST run in background** to prevent terminal flooding:

| Command | Why Background |
|---------|----------------|
| `detox build` | 2-10 minutes |
| `detox test` | 5-30+ minutes |
| `npx expo prebuild` | 1-5 minutes |
| `pod install` | 1-3 minutes |

### 3. Output Limiting

**ALWAYS limit output** to prevent crashes:

```bash
# CORRECT
grep -rn "testID" src/ | head -30
head -60 src/screens/LoginScreen.tsx
ls src/screens/ | head -20

# WRONG - can flood terminal
cat src/screens/LoginScreen.tsx
find . -name "*.tsx" -exec cat {} \;
```

## testID Conventions

```typescript
// Pattern: {screen}-{element}-{type}
testID="login-screen"              // Screen container
testID="login-email-input"         // Input field
testID="login-submit-button"       // Button
testID="login-error-banner"        // Error display
testID="product-row-0"             // Indexed list items
```

### Platform-Specific

| Platform | Method |
|----------|--------|
| React Native | `testID="id"` |
| SwiftUI | `.accessibilityIdentifier("id")` |
| UIKit | `accessibilityIdentifier = "id"` |
| Compose | `Modifier.testTag("id")` |
| XML | `android:contentDescription="id"` |

## Test Naming

```typescript
// File: e2e/flows/auth/login-flow.test.ts

describe('User Authentication - Login Flow', () => {
  it('should display welcome screen with login options', async () => {});
  it('should show validation error for invalid email', async () => {});
  it('should navigate to home after successful login', async () => {});
});
```

**Rules:**
- Files: `kebab-case.test.ts` (e.g., `login-flow.test.ts`)
- Describe: `'{Feature} - {Flow}'`
- It: `'should {action} {result}'`

## Build & Test Commands

```bash
# Build (run in background - takes 2-10 min)
npx detox build --configuration ios.sim.debug
npx detox build --configuration android.emu.debug

# Test with artifacts (run in background - takes 5-30+ min)
npx detox test --configuration ios.sim.debug --record-videos all --take-screenshots all

# Test specific file
npx detox test --configuration ios.sim.debug e2e/flows/auth/login-flow.test.ts

# Test with pattern matching
npx detox test --configuration ios.sim.debug --testNamePattern="should login"
```

### Expo Projects

```bash
# Generate native projects first
npx expo prebuild --clean

# Then build and test as normal
npx detox build --configuration ios.sim.debug
```

## Common Test Patterns

### Wait for Elements

```typescript
await waitFor(element(by.id('home-screen')))
  .toBeVisible()
  .withTimeout(10000);
```

### Form Input

```typescript
await element(by.id('email-input')).tap();
await element(by.id('email-input')).typeText('user@example.com');
await element(by.id('submit-button')).tap();
```

### Scrolling

```typescript
await waitFor(element(by.id('item-50')))
  .toBeVisible()
  .whileElement(by.id('list'))
  .scroll(200, 'down');
```

### Permissions (iOS)

```typescript
await device.launchApp({
  permissions: { camera: 'YES', location: 'always' }
});
```

### Biometrics

```typescript
await device.setBiometricEnrollment(true);
await device.matchFace(); // or matchFinger()
```

### Deep Links

```typescript
await device.launchApp({ url: 'myapp://profile/123' });
await device.openURL({ url: 'myapp://settings' });
```

### Push Notifications

```typescript
await device.sendUserNotification({
  trigger: { type: 'push' },
  title: 'New Message',
  body: 'You have a message',
  payload: { messageId: '123' }
});
```

### Background/Foreground

```typescript
await device.sendToHome();  // Background
await device.launchApp({ newInstance: false });  // Foreground
```

### Location Mocking

```typescript
await device.setLocation(37.7749, -122.4194);  // San Francisco
```

## File Structure

```
e2e/
├── flows/
│   ├── auth/
│   │   ├── login-flow.test.ts
│   │   └── registration-flow.test.ts
│   ├── profile/
│   └── settings/
├── utils/
│   ├── test-helpers.ts
│   └── fixtures.ts
└── jest.config.js
```

## Report Generation

```bash
# Standalone report
node scripts/generate-report.js --artifacts ./artifacts --output ./reports

# Consolidated hub (append mode)
node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Login Tests"
```

## Quick Reference

### Matchers

```typescript
by.id('testID')           // By testID (preferred)
by.text('Button Text')    // By visible text
by.label('Accessibility') // By a11y label
```

### Actions

```typescript
.tap()
.longPress()
.typeText('text')
.replaceText('text')
.clearText()
.scroll(100, 'down')
.swipe('left')
```

### Assertions

```typescript
expect(element).toBeVisible()
expect(element).toExist()
expect(element).toHaveText('text')
expect(element).not.toBeVisible()
```

### Device

```typescript
device.launchApp({ newInstance: true })
device.launchApp({ delete: true })  // Clear data
device.takeScreenshot('name')
device.setLocation(37.7749, -122.4194)
device.sendToHome()
device.shake()
```

## References

- `references/detox-config.md` - Configuration guide
- `references/android-setup.md` - Android patches
- `references/pilot-setup.md` - AI test generation
- `references/ci-workflows.md` - CI/CD setup
- `examples/` - 28 comprehensive test examples

## Setup Requirements

**macOS (iOS testing):**
- Xcode 14+ with CLI tools
- `brew tap wix/brew && brew install applesimutils`
- Node.js 18+

**Android:**
- Android SDK with emulator
- Java 17+
- Node.js 18+

**Project dependencies:**
```bash
npm install --save-dev detox jest @types/jest ts-jest
```

**Minimal .detoxrc.js:**
```javascript
module.exports = {
  testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' }, jest: { setupTimeout: 120000 } },
  apps: {
    'ios.debug': { type: 'ios.app', binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app', build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build' },
    'android.debug': { type: 'android.apk', binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk', build: 'cd android && ./gradlew assembleDebug' }
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 15' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_4_API_33' } }
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' }
  }
};
```

See `references/detox-config.md` for complete configuration options.

## Detox Copilot (Natural Language Testing)

Built-in LLM-powered testing - write tests in plain English:

```typescript
await copilot.perform(
  'Navigate to the Products page',
  'Add the first item to cart',
  'Verify cart badge shows 1'
);
```

See SKILL.md for full setup instructions.

## External Links

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox Copilot](https://wix.github.io/Detox/docs/copilot/testing-with-copilot)
- [Agent Skills Specification](https://agentskills.io/specification)
- [AGENTS.md Standard](https://agents.md/)
