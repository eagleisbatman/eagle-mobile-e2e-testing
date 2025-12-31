# Eagle Mobile E2E Testing

A state-of-the-art Claude Code skill for comprehensive end-to-end mobile testing using [Detox](https://wix.github.io/Detox/) with AI-powered test generation via [Wix Pilot](https://github.com/wix-incubator/pilot).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)
![React Native](https://img.shields.io/badge/React%20Native-Expo%20%7C%20CLI-61DAFB)
![Swift](https://img.shields.io/badge/iOS-SwiftUI%20%7C%20UIKit-FA7343)
![Kotlin](https://img.shields.io/badge/Android-Compose%20%7C%20XML-7F52FF)

---

## Overview

This skill enables automated end-to-end testing for mobile applications across multiple platforms and frameworks. It provides:

- **Comprehensive Platform Support** - React Native (Expo/CLI), iOS (SwiftUI/UIKit), Android (Jetpack Compose/XML)
- **AI-Powered Testing** - Generate tests using natural language via Wix Pilot
- **Rich Artifacts** - Video recordings, screenshots, logs, and timeline traces
- **Professional Reports** - HTML reports with embedded media
- **CI/CD Ready** - Pre-built workflows for GitHub Actions, CircleCI, and Bitrise
- **Best Practices** - Enforced naming conventions for discoverable, maintainable tests
- **Advanced Capabilities** - Permissions, biometrics, deep links, offline mode, network mocking

---

## Platform Support

| Platform | Framework | Support Level | testID Method |
|----------|-----------|---------------|---------------|
| React Native | Expo | Full | `testID="id"` |
| React Native | CLI | Full | `testID="id"` |
| iOS | SwiftUI | Full | `.accessibilityIdentifier("id")` |
| iOS | UIKit | Full | `accessibilityIdentifier = "id"` |
| Android | Jetpack Compose | Full | `Modifier.testTag("id")` |
| Android | XML Views | Full | `android:contentDescription="id"` |

---

## Quick Start

### 1. Install as Claude Code Skill

```bash
# Clone to your Claude skills directory
git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git ~/.claude/skills/eagle-mobile-e2e-testing
```

### 2. Restart Claude Code

The skill will automatically load and be available in your conversations.

### 3. Use the Skill

Simply ask Claude Code to help with E2E testing:

```
"Help me set up Detox E2E testing for my React Native Expo app"
"Write E2E tests for my login flow"
"Add testIDs to my SwiftUI views"
"Test push notifications in my app"
"Set up network mocking for offline mode testing"
```

---

## What's Included

```
eagle-mobile-e2e-testing/
├── SKILL.md                      # Main skill definition
├── README.md                     # This file
├── LICENSE                       # MIT License
├── references/
│   ├── detox-config.md          # Complete .detoxrc.js configuration
│   ├── android-setup.md         # Android native code patches
│   ├── pilot-setup.md           # AI-powered testing setup
│   └── ci-workflows.md          # CI/CD configurations
├── scripts/
│   ├── run-e2e.sh               # Automated test runner
│   └── generate-report.js       # HTML report generator
├── examples/
│   ├── login-flow.test.ts       # Authentication tests
│   ├── permissions.test.ts      # Permission testing
│   └── advanced-features.test.ts # Deep links, biometrics, etc.
└── .github/
    └── workflows/
        └── e2e-tests.yml        # GitHub Actions workflow
```

---

## Key Features

### Enforced Naming Conventions

The skill enforces consistent naming for tests that are discoverable and meaningful in reports:

```typescript
// File: e2e/flows/auth/login-flow.test.ts

describe('User Authentication - Login Flow', () => {
  it('should display welcome screen with login and register options', async () => {});
  it('should navigate to login screen when tapping Sign In', async () => {});
  it('should show error banner when credentials are incorrect', async () => {});
  it('should navigate to home screen after successful authentication', async () => {});
});
```

### testID Standards

```typescript
// Pattern: {screen}-{element}-{type}
testID="login-screen"              // Screen container
testID="login-email-input"         // Input field
testID="login-submit-button"       // Button
testID="login-error-banner"        // Error display
testID="user-row-0"                // List item (indexed)
```

### Advanced Testing Capabilities

```typescript
// Device Permissions (iOS)
await device.launchApp({
  permissions: { camera: 'YES', location: 'always' }
});

// Biometric Authentication
await device.setBiometricEnrollment(true);
await device.matchFace();

// Deep Linking
await device.launchApp({ url: 'myapp://profile/123' });

// Push Notifications
await device.sendUserNotification({
  trigger: { type: 'push' },
  title: 'New Message',
  payload: { messageId: '12345' }
});

// Background/Foreground
await device.sendToHome();
await device.launchApp({ newInstance: false });

// Location Mocking
await device.setLocation(37.7749, -122.4194);

// Network Blacklisting
await device.setURLBlacklist(['.*analytics.*']);
```

### Report Output

```
═══════════════════════════════════════════════════════════════
                    E2E TEST REPORT
═══════════════════════════════════════════════════════════════

✅ PASSED: User Authentication - Login Flow (4 tests, 12.3s)
   ✓ should display welcome screen with login and register options (2.3s)
   ✓ should navigate to login screen when tapping Sign In (1.8s)
   ✓ should show error banner when credentials are incorrect (3.2s)
   ✓ should navigate to home screen after successful authentication (5.0s)

═══════════════════════════════════════════════════════════════
SUMMARY: 4 passed, 0 failed | Duration: 12.3s
═══════════════════════════════════════════════════════════════
```

---

## Usage Examples

### Setting Up a New Project

Ask Claude:
```
Set up Detox E2E testing for my React Native Expo project
```

Claude will:
1. Install required dependencies
2. Configure `.detoxrc.js`
3. Set up Jest configuration
4. Create initial test structure
5. Add npm scripts

### Writing Tests

Ask Claude:
```
Write E2E tests for my user registration flow. The screens are:
1. Welcome screen with "Get Started" button
2. Email/password form
3. Profile setup
4. Home screen
```

Claude will generate properly named, comprehensive tests.

### Adding testIDs

Ask Claude:
```
Add testIDs to my LoginScreen component (React Native)
```

Or for native:
```
Add accessibility identifiers to my SwiftUI LoginView
```

### Testing Advanced Features

Ask Claude:
```
Write tests for biometric authentication in my app
Test deep linking to the product detail screen
Set up offline mode testing with network mocking
```

### Running Tests

```bash
# Run all tests with video recording
./scripts/run-e2e.sh ios debug --videos

# Run specific test file
npx detox test e2e/flows/auth/login-flow.test.ts --configuration ios.sim.debug

# Generate HTML report
node scripts/generate-report.js e2e/artifacts e2e/reports/report.html
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [SKILL.md](SKILL.md) | Complete skill reference with advanced capabilities |
| [detox-config.md](references/detox-config.md) | Detox configuration guide |
| [android-setup.md](references/android-setup.md) | Android native setup |
| [pilot-setup.md](references/pilot-setup.md) | AI-powered testing |
| [ci-workflows.md](references/ci-workflows.md) | CI/CD configurations |

---

## Requirements

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

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Wix Detox](https://wix.github.io/Detox/) - The E2E testing framework
- [Wix Pilot](https://github.com/wix-incubator/pilot) - AI-powered testing
- [Detox Instruments](https://github.com/wix-incubator/DetoxInstruments) - Performance profiling
- [Claude Code](https://claude.ai/claude-code) - The AI assistant this skill is built for

---

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Handling Runtime Permissions in Detox](https://brainsandbeards.com/blog/handling-runtime-application-permissions-in-detox/)
- [Mocking Network Requests in Detox](https://brainsandbeards.com/blog/mocking-network-requests-in-detox-e2e-tests/)
- [Firebase DebugView](https://firebase.google.com/docs/analytics/debugview)
- [Detox GitHub Issues](https://github.com/wix/Detox/issues)

---

Made with care for the mobile testing community.
