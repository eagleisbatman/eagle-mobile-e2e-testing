<div align="center">

# 🦅 Eagle Mobile E2E Testing

### *The Ultimate Claude Code Skill for Mobile Testing Excellence*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue?style=for-the-badge)](/)
[![Detox](https://img.shields.io/badge/Powered%20by-Detox-orange?style=for-the-badge)](https://wix.github.io/Detox/)

<br />

**Production-grade E2E testing for mobile apps with AI-powered test generation**

*React Native (Expo/CLI) • SwiftUI • UIKit • Jetpack Compose • XML Views*

<br />

[Getting Started](#-quick-start) •
[Features](#-features) •
[Examples](#-examples) •
[Documentation](#-documentation) •
[Advanced Testing](#-advanced-capabilities)

---

</div>

## ✨ What Makes Eagle Special?

| | Feature | Description |
|:---:|---------|-------------|
| 🎯 | **Universal Platform Support** | Single skill for React Native, iOS native, and Android native apps |
| 🤖 | **AI-Powered Testing** | Generate tests from natural language using Wix Pilot |
| 🎬 | **Rich Artifacts** | Video recordings, screenshots, logs, and timeline traces for every test |
| 📊 | **Beautiful Reports** | Modern HTML reports with dark/light mode and video playback |
| 🔐 | **Advanced Scenarios** | Biometrics, deep links, permissions, offline mode, network mocking |
| 🔄 | **CI/CD Ready** | Pre-configured workflows for GitHub Actions, CircleCI, and Bitrise |

---

## 🚀 Quick Start

### 1️⃣ Install the Skill

```bash
# Clone to your Claude Code skills directory
git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git ~/.claude/skills/eagle-mobile-e2e-testing
```

### 2️⃣ Restart Claude Code

The skill loads automatically and becomes available in your conversations.

### 3️⃣ Start Testing!

Just ask Claude:

> *"Help me set up Detox E2E testing for my React Native Expo app"*

> *"Write E2E tests for my checkout flow"*

> *"Test biometric authentication in my iOS app"*

---

## 🎯 Platform Support Matrix

| Platform | Framework | Support | testID Method |
|:--------:|:---------:|:-------:|---------------|
| 📱 React Native | Expo | ✅ Full | `testID="id"` |
| 📱 React Native | CLI | ✅ Full | `testID="id"` |
| 🍎 iOS | SwiftUI | ✅ Full | `.accessibilityIdentifier("id")` |
| 🍎 iOS | UIKit | ✅ Full | `accessibilityIdentifier = "id"` |
| 🤖 Android | Compose | ✅ Full | `Modifier.testTag("id")` |
| 🤖 Android | XML | ✅ Full | `android:contentDescription="id"` |

---

## 🏆 Features

### 📝 Enforced Best Practices

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

### 🏷️ Standardized testID Patterns

```typescript
// Pattern: {screen}-{element}-{type}
testID="login-screen"              // Screen container
testID="login-email-input"         // Input field
testID="login-submit-button"       // Button
testID="login-error-banner"        // Error display
testID="product-row-0"             // Indexed list items
```

### 📊 Stunning HTML Reports

The included report generator creates beautiful, interactive reports with:

- 🌓 **Dark/Light mode toggle** with system preference detection
- 📺 **Two-column layout** - Video playback alongside test details
- 🖼️ **Screenshot gallery** with lightbox viewer
- ⏱️ **Timeline visualization** of test steps
- 🔍 **Filtering** by passed/failed status
- ⌨️ **Keyboard navigation** (↑↓ arrows, j/k keys)

```bash
# Generate a report
node scripts/generate-report.js --artifacts ./artifacts --output ./reports --project "My App"
```

---

## 🛠️ Advanced Capabilities

<details>
<summary><b>🔐 Device Permissions</b></summary>

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
<summary><b>👆 Biometric Authentication</b></summary>

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
<summary><b>🔗 Deep Linking</b></summary>

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
<summary><b>📲 Push Notifications</b></summary>

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
<summary><b>🌐 Network Mocking & Offline Mode</b></summary>

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
<summary><b>📍 Location Mocking</b></summary>

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
<summary><b>🔄 Background/Foreground</b></summary>

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

---

## 📁 Examples Library

The skill includes comprehensive example tests for various app types:

| Example | Description | Key Patterns |
|---------|-------------|--------------|
| **E-Commerce** | Shopping cart, checkout, payments | Product browsing, cart management, order flow |
| **Social Media** | Feeds, posts, stories, profiles | Infinite scroll, media upload, interactions |
| **Messaging** | Chat, group chats, media sharing | Real-time updates, voice messages, video calls |
| **Onboarding** | Welcome flows, tutorials, permissions | Carousels, progress indicators, skip functionality |
| **Gaming** | Menus, purchases, leaderboards | In-app purchases, achievements, multiplayer |
| **Login/Auth** | Email, social login, biometrics | Form validation, error handling, session management |
| **Permissions** | Camera, location, notifications | Permission requests, fallback flows |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [📘 SKILL.md](SKILL.md) | Complete skill reference with all advanced capabilities |
| [⚙️ detox-config.md](references/detox-config.md) | Detox configuration deep-dive |
| [🤖 android-setup.md](references/android-setup.md) | Android native code patches |
| [🧠 pilot-setup.md](references/pilot-setup.md) | AI-powered test generation setup |
| [🔄 ci-workflows.md](references/ci-workflows.md) | CI/CD workflow configurations |

---

## 📂 Project Structure

```
eagle-mobile-e2e-testing/
├── 📘 SKILL.md                      # Main skill definition (1600+ lines!)
├── 📖 README.md                     # You are here
├── 📄 LICENSE                       # MIT License
├── 📁 references/
│   ├── detox-config.md              # Complete .detoxrc.js guide
│   ├── android-setup.md             # Android native patches
│   ├── pilot-setup.md               # Wix Pilot AI testing
│   └── ci-workflows.md              # CI/CD configurations
├── 📁 scripts/
│   ├── run-e2e.sh                   # Automated test runner
│   └── generate-report.js           # Beautiful HTML report generator
├── 📁 examples/
│   ├── login-flow.test.ts           # Authentication tests
│   ├── permissions.test.ts          # Permission testing
│   ├── advanced-features.test.ts    # Deep links, biometrics
│   ├── e-commerce.test.ts           # Shopping app patterns
│   ├── social-media.test.ts         # Social networking patterns
│   ├── messaging-chat.test.ts       # Chat app patterns
│   ├── onboarding-tutorial.test.ts  # Onboarding flows
│   └── gaming-entertainment.test.ts # Gaming & media patterns
└── 📁 .github/
    └── workflows/
        └── e2e-tests.yml            # GitHub Actions workflow
```

---

## 💻 System Requirements

### macOS (for iOS testing)
- Xcode 14+ with Command Line Tools
- applesimutils (`brew install applesimutils`)
- Node.js 18+

### Android
- Android SDK with emulator
- Java 17+
- Node.js 18+

---

## 🤝 Contributing

Contributions are welcome! Whether it's:

- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions

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

## 📚 Resources

| Resource | Link |
|----------|------|
| Detox Documentation | [wix.github.io/Detox](https://wix.github.io/Detox/) |
| Wix Pilot (AI Testing) | [github.com/wix-incubator/pilot](https://github.com/wix-incubator/pilot) |
| Detox GitHub | [github.com/wix/Detox](https://github.com/wix/Detox) |
| Firebase DebugView | [firebase.google.com/docs/analytics/debugview](https://firebase.google.com/docs/analytics/debugview) |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Made with ❤️ by [Gautam Mandewalker](https://www.linkedin.com/in/gautammandewalker)

*For the mobile testing community*

<br />

**[⬆ Back to Top](#-eagle-mobile-e2e-testing)**

</div>
