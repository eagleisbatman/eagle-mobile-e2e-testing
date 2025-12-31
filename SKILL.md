---
name: eagle-mobile-e2e-testing
description: Comprehensive end-to-end mobile testing skill for React Native (Expo/CLI), Jetpack Compose, SwiftUI, UIKit, and XML-based Android/iOS apps. CRITICAL - Before writing tests, you MUST first discover the UI structure using targeted grep searches (NOT full file dumps). Run all builds and test suites in BACKGROUND to prevent terminal flooding. Use this skill for (1) Detox E2E setup, (2) Writing test cases after UI discovery, (3) AI test generation via Wix Pilot, (4) Video/screenshot recording, (5) HTML report generation, (6) Testing permissions/biometrics/deep-links/offline, (7) Network mocking, (8) Push notifications, (9) CI/CD pipelines.
---

# Eagle Mobile E2E Testing Skill

A comprehensive, production-ready framework for end-to-end mobile testing using Detox with AI-powered test generation via Wix Pilot. Supports React Native (Expo/CLI), native iOS (SwiftUI/UIKit), and native Android (Jetpack Compose/XML).

## Platform Support Matrix

| Platform | Framework | Support | testID Method | Notes |
|----------|-----------|---------|---------------|-------|
| React Native | Expo | Full | `testID="id"` | Requires prebuild |
| React Native | CLI | Full | `testID="id"` | Direct native access |
| iOS | SwiftUI | Full | `.accessibilityIdentifier("id")` | iOS 13+ |
| iOS | UIKit | Full | `accessibilityIdentifier = "id"` | All iOS versions |
| Android | Jetpack Compose | Full | `Modifier.testTag("id")` | Compose 1.0+ |
| Android | XML Views | Full | `android:contentDescription="id"` | All Android versions |
| Android | Kotlin Views | Full | `view.contentDescription = "id"` | Programmatic views |
| Flutter | - | Not Supported | - | Use flutter_driver instead |

---

## CRITICAL: Codebase Discovery Before Writing Tests

**IMPORTANT:** Before writing ANY test cases, you MUST systematically discover the UI structure. Do NOT flood the terminal with large file dumps.

### Step 1: Identify Screen Components (Targeted Search)

```bash
# Find screen/page components - use grep, don't cat entire files
grep -rn "Screen\|Page\|View" --include="*.tsx" --include="*.jsx" src/ | head -30

# Find existing testIDs in the codebase
grep -rn "testID=" --include="*.tsx" --include="*.jsx" src/ | head -50

# For iOS Swift projects
grep -rn "accessibilityIdentifier" --include="*.swift" | head -30

# For Android Compose
grep -rn "testTag" --include="*.kt" | head -30
```

### Step 2: Map Navigation Structure

```bash
# Find navigation configuration
grep -rn "Stack.Screen\|Tab.Screen\|createNativeStackNavigator" --include="*.tsx" src/

# Find route definitions
grep -rn "routes\|screens\|navigation" --include="*.ts" --include="*.tsx" src/navigation/ 2>/dev/null | head -20
```

### Step 3: Read Components Selectively

**DO NOT** dump entire component files. Read only the sections you need:

```bash
# Read just the first 60 lines to see component structure
head -60 src/screens/LoginScreen.tsx

# Search for specific elements within a file
grep -n "testID\|onPress\|Button\|Input\|Text" src/screens/LoginScreen.tsx
```

### Step 4: Create testID Inventory

Before writing tests, create a mental map of existing testIDs:

```bash
# Export all testIDs to review
grep -rhn "testID=\"[^\"]*\"" --include="*.tsx" src/ | sed 's/.*testID="\([^"]*\)".*/\1/' | sort -u
```

---

## CRITICAL: Background Execution Guidelines

**IMPORTANT:** Long-running commands MUST run in background to prevent terminal flooding and crashes.

### Commands That MUST Run in Background

| Command Type | Why Background | Example |
|--------------|----------------|---------|
| `detox build` | Takes 2-10 minutes | Build iOS/Android app |
| `detox test` | Takes 5-30+ minutes | Run full test suite |
| `npx expo prebuild` | Takes 1-5 minutes | Generate native projects |
| `pod install` | Takes 1-3 minutes | Install iOS dependencies |
| `./gradlew assembleDebug` | Takes 2-10 minutes | Build Android |

### How to Run in Background

```typescript
// When using Bash tool, set run_in_background: true
{
  "command": "npx detox build --configuration ios.sim.debug",
  "run_in_background": true,
  "description": "Build iOS app for testing"
}
```

### Monitoring Background Tasks

```bash
# Check if build is still running
ps aux | grep -E "detox|xcodebuild|gradle" | grep -v grep

# Check background task output periodically (use TaskOutput tool)
# Do NOT repeatedly poll - check every 30-60 seconds
```

### Test Execution Strategy

```bash
# WRONG: Running all tests inline (will flood terminal)
npx detox test --configuration ios.sim.debug

# CORRECT: Run in background, check results later
# Use run_in_background: true, then use TaskOutput to get results
```

---

## CRITICAL: Terminal Efficiency Rules

1. **NEVER** cat/read entire large files - use head, grep, or targeted line ranges
2. **NEVER** run builds inline - always use background execution
3. **NEVER** dump test output to terminal - capture to file or run in background
4. **ALWAYS** use `| head -N` when output might be large
5. **ALWAYS** use targeted searches instead of reading entire directories
6. **LIMIT** grep results with `| head -30` or `| head -50`

### Safe Patterns

```bash
# Safe: Limited output
ls src/screens/ | head -20
grep -rn "testID" src/ | head -30
head -60 src/screens/LoginScreen.tsx

# Unsafe: Can flood terminal
cat src/screens/LoginScreen.tsx          # Could be 500+ lines
find . -name "*.tsx" -exec cat {} \;     # Dumps everything
npx detox test                            # Long output, run in background
```

---

## CRITICAL: Naming Conventions

### 1. Test File Naming

```
e2e/
├── flows/                          # Feature-based organization
│   ├── auth/
│   │   ├── login-flow.test.ts           [OK] Descriptive: "login-flow"
│   │   ├── registration-flow.test.ts    [OK] Descriptive: "registration-flow"
│   │   ├── password-reset.test.ts       [OK] Descriptive: "password-reset"
│   │   ├── biometric-auth.test.ts       [OK] Descriptive: "biometric-auth"
│   │   └── test1.test.ts                [NO] NEVER: Generic names
│   ├── onboarding/
│   │   ├── welcome-carousel.test.ts     [OK] Good
│   │   └── permissions-request.test.ts  [OK] Good
│   ├── profile/
│   │   ├── profile-view.test.ts         [OK] Good
│   │   ├── profile-edit.test.ts         [OK] Good
│   │   └── avatar-upload.test.ts        [OK] Good
│   ├── settings/
│   │   ├── notification-prefs.test.ts   [OK] Good
│   │   └── theme-switching.test.ts      [OK] Good
│   └── search/
│       ├── search-flow.test.ts          [OK] Good
│       └── filter-results.test.ts       [OK] Good
├── smoke/                          # Quick sanity checks
│   └── critical-path.test.ts
├── regression/                     # Full regression suite
│   └── full-suite.test.ts
└── utils/                          # Shared test utilities
    ├── test-helpers.ts
    └── fixtures.ts
```

**File Naming Rules:**
1. Use `kebab-case`: `user-login.test.ts` NOT `userLogin.test.ts`
2. Name after the FLOW: `password-reset.test.ts` NOT `test-auth-3.test.ts`
3. Group by feature: `auth/`, `settings/`, `profile/`
4. NEVER use: `test1.test.ts`, `test-a.test.ts`, `foo.test.ts`

### 2. testID Naming Conventions

```typescript
// PATTERN: {screen}-{element}-{type}

// GOOD testID patterns:
testID="login-screen"                    // Screen identifier
testID="login-email-input"               // Input field
testID="login-password-input"            // Input field
testID="login-submit-button"             // Button
testID="login-forgot-password-link"      // Tappable link
testID="login-error-banner"              // Error display
testID="login-loading-spinner"           // Loading state

// For lists with dynamic content
testID="user-list"                       // List container
testID="user-row-0"                      // List item (by index)
testID="user-row-john-doe"               // List item (by identifier)
testID="user-row-0-delete-button"        // Action in list item

// For modals and overlays
testID="confirmation-modal"              // Modal container
testID="confirmation-modal-title"        // Modal title
testID="confirmation-modal-confirm-btn"  // Modal action
testID="confirmation-modal-cancel-btn"   // Modal dismiss

// For navigation
testID="nav-home-tab"                    // Tab bar item
testID="nav-settings-tab"                // Tab bar item
testID="header-back-button"              // Navigation button
testID="header-menu-button"              // Header action

// BAD testID patterns (avoid):
testID="btn1"                            // Not descriptive
testID="input"                           // Too generic
testID="test"                            // Meaningless
testID="asdf"                            // Random characters
```

### 3. Test Suite & Case Naming

```typescript
// CORRECT: Names that are meaningful in reports
describe('User Authentication - Login Flow', () => {
  it('should display welcome screen with login and register options', async () => {});
  it('should navigate to login screen when tapping Sign In', async () => {});
  it('should show inline validation error for invalid email format', async () => {});
  it('should show error banner when credentials are incorrect', async () => {});
  it('should navigate to home screen after successful authentication', async () => {});
  it('should persist session across app restart', async () => {});
});

describe('User Profile - Edit Profile', () => {
  it('should display current profile information', async () => {});
  it('should allow editing display name', async () => {});
  it('should show validation error for empty required fields', async () => {});
  it('should save changes successfully', async () => {});
});

// WRONG: Useless in reports (avoid)
describe('Tests', () => {
  it('test 1', async () => {});           // What is this testing?
  it('test 2', async () => {});           // Impossible to debug
  it('should work', async () => {});      // Work how?
  it('login', async () => {});            // Missing context
});
```

**Naming Rules:**
1. `describe()` = `'{Feature Area} - {Flow Name}'`
2. `it()` = `'should {action} {expected result}'`
3. Use present tense: `should display`, `should navigate`, `should show`
4. Be specific: `'error banner'` not `'error'`, `'home screen'` not `'next page'`

### 4. How Names Appear in Reports

```
═══════════════════════════════════════════════════════════════
                    E2E TEST REPORT
                    Generated: 2025-01-15 14:32:00
═══════════════════════════════════════════════════════════════

[PASS] User Authentication - Login Flow (4 tests, 12.3s)
   [+] should display welcome screen with login and register options (2.3s)
   [+] should navigate to login screen when tapping Sign In (1.8s)
   [+] should show inline validation error for invalid email format (1.2s)
   [+] should navigate to home screen after successful authentication (7.0s)

[PASS] User Profile - Edit Profile (3 tests, 8.1s)
   [+] should display current profile information (2.1s)
   [+] should allow editing display name (1.5s)
   [+] should save changes successfully (4.5s)

[FAIL] Search - Filter Results (1 test failed)
   [-] should display filtered results matching criteria (3.2s)

     Error: Element not found
     Matcher: by.id("search-results-list")

     Suggestion: Check that testID="search-results-list" is set on the FlatList

═══════════════════════════════════════════════════════════════
SUMMARY: 7 passed, 1 failed | Duration: 23.6s
═══════════════════════════════════════════════════════════════
```

---

## ADVANCED TESTING CAPABILITIES

### 1. Device Permissions Testing

**iOS - Fully Supported:**
```typescript
// Grant or deny permissions BEFORE app launch
await device.launchApp({
  newInstance: true,
  permissions: {
    notifications: 'YES',      // Push notifications
    camera: 'YES',             // Camera access
    photos: 'YES',             // Photo library
    location: 'always',        // Location: 'always', 'inuse', 'never'
    microphone: 'YES',         // Microphone
    contacts: 'NO',            // Contacts (test denial)
    calendar: 'YES',           // Calendar access
    reminders: 'YES',          // Reminders
    faceid: 'YES',             // Face ID enrollment
    medialibrary: 'YES',       // Media library
    motion: 'YES',             // Motion & fitness
    health: 'YES',             // HealthKit
    siri: 'YES',               // Siri
    speech: 'YES',             // Speech recognition
    homekit: 'YES',            // HomeKit
    bluetooth: 'YES',          // Bluetooth
    userTracking: 'YES'        // App tracking transparency
  }
});

// Test permission denial scenario
it('should show permission denied message when camera access denied', async () => {
  await device.launchApp({
    newInstance: true,
    permissions: { camera: 'NO' }
  });

  await element(by.id('scan-qr-button')).tap();
  await expect(element(by.id('camera-permission-denied'))).toBeVisible();
});
```

**Android - Requires ADB Commands:**
```typescript
// Android doesn't support permissions via Detox API
// Use ADB shell commands instead

// In your test setup or beforeEach:
import { execSync } from 'child_process';

const grantPermission = (permission: string) => {
  execSync(`adb shell pm grant com.your.app ${permission}`);
};

const revokePermission = (permission: string) => {
  execSync(`adb shell pm revoke com.your.app ${permission}`);
};

// Usage
beforeEach(async () => {
  // Grant camera permission
  grantPermission('android.permission.CAMERA');
  // Revoke location permission
  revokePermission('android.permission.ACCESS_FINE_LOCATION');
});
```

### 2. Biometric Authentication (Face ID / Touch ID)

```typescript
describe('Biometric Authentication', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should prompt for biometric when enabled', async () => {
    // Enroll biometrics on simulator
    await device.setBiometricEnrollment(true);

    // Navigate to biometric-protected feature
    await element(by.id('secure-area-button')).tap();

    // Simulate successful Face ID
    await device.matchFace();

    // Verify access granted
    await expect(element(by.id('secure-content'))).toBeVisible();
  });

  it('should show error on biometric failure', async () => {
    await device.setBiometricEnrollment(true);
    await element(by.id('secure-area-button')).tap();

    // Simulate failed Face ID
    await device.unmatchFace();

    // Verify error message
    await expect(element(by.id('biometric-failed-message'))).toBeVisible();
  });

  it('should handle no biometric enrollment', async () => {
    await device.setBiometricEnrollment(false);
    await element(by.id('secure-area-button')).tap();

    // Should show alternative auth (PIN/password)
    await expect(element(by.id('pin-input'))).toBeVisible();
  });
});

// Touch ID (for older devices)
await device.matchFinger();
await device.unmatchFinger();
```

### 3. Deep Linking / URL Scheme Testing

```typescript
describe('Deep Linking', () => {
  it('should open specific screen via deep link', async () => {
    // Launch app with deep link
    await device.launchApp({
      newInstance: true,
      url: 'myapp://profile/123'
    });

    // Verify correct screen loaded
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify correct data loaded
    await expect(element(by.id('profile-id'))).toHaveText('123');
  });

  it('should handle deep link while app is running', async () => {
    await device.launchApp({ newInstance: true });

    // Wait for initial screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Send deep link to running app
    await device.openURL({ url: 'myapp://settings/notifications' });

    // Verify navigation occurred
    await expect(element(by.id('notification-settings-screen'))).toBeVisible();
  });

  it('should handle deep link from Safari (iOS)', async () => {
    await device.launchApp({
      newInstance: true,
      url: 'myapp://product/abc',
      sourceApp: 'com.apple.mobilesafari'  // Simulate coming from Safari
    });

    await expect(element(by.id('product-detail-screen'))).toBeVisible();
  });
});
```

### 4. Push Notification Testing

```typescript
describe('Push Notifications', () => {
  it('should launch app from notification', async () => {
    const notification = {
      trigger: {
        type: 'push'
      },
      title: 'New Message',
      body: 'You have a new message from John',
      badge: 1,
      payload: {
        type: 'message',
        messageId: '12345'
      }
    };

    // Launch app via notification tap
    await device.launchApp({
      newInstance: true,
      userNotification: notification
    });

    // Verify app opened to correct screen
    await expect(element(by.id('message-detail-screen'))).toBeVisible();
    await expect(element(by.id('message-id'))).toHaveText('12345');
  });

  it('should handle notification while app is in foreground', async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Send notification to running app
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'Special Offer',
      body: '50% off today!',
      payload: { type: 'promo', promoId: 'SAVE50' }
    });

    // Verify in-app notification banner
    await expect(element(by.id('notification-banner'))).toBeVisible();
  });

  it('should handle notification when app is in background', async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Send app to background
    await device.sendToHome();

    // Send notification
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'Reminder',
      body: 'Check your tasks',
      payload: { type: 'reminder' }
    });

    // Bring app back (simulates tapping notification)
    await device.launchApp({ newInstance: false });

    // Verify app handled the notification
    await expect(element(by.id('tasks-screen'))).toBeVisible();
  });
});
```

### 5. Background / Foreground App State Testing

```typescript
describe('App Lifecycle', () => {
  it('should preserve state when returning from background', async () => {
    await device.launchApp({ newInstance: true });

    // Navigate to a form and fill some data
    await element(by.id('nav-profile-tab')).tap();
    await element(by.id('edit-profile-button')).tap();
    await element(by.id('name-input')).typeText('John Doe');

    // Send app to background
    await device.sendToHome();

    // Wait a moment (simulating user doing something else)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return to app
    await device.launchApp({ newInstance: false });

    // Verify form data persisted
    await expect(element(by.id('name-input'))).toHaveText('John Doe');
  });

  it('should refresh data when returning from background', async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Send to background
    await device.sendToHome();

    // Return from background
    await device.launchApp({ newInstance: false });

    // Verify refresh occurred (e.g., loading indicator or timestamp change)
    await waitFor(element(by.id('last-updated-timestamp')))
      .toExist()
      .withTimeout(5000);
  });
});
```

### 6. Network Mocking & Offline Mode Testing

**Using Launch Arguments:**
```typescript
describe('Offline Mode', () => {
  it('should show offline banner when network unavailable', async () => {
    // Launch app with offline mode flag
    await device.launchApp({
      newInstance: true,
      launchArgs: {
        mockNetworkStatus: 'offline'
      }
    });

    // Verify offline UI
    await expect(element(by.id('offline-banner'))).toBeVisible();
    await expect(element(by.text('No Internet Connection'))).toBeVisible();
  });

  it('should queue actions while offline', async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { mockNetworkStatus: 'offline' }
    });

    // Attempt an action that requires network
    await element(by.id('submit-button')).tap();

    // Verify queued message
    await expect(element(by.id('queued-for-later-message'))).toBeVisible();
  });
});
```

**Using Mock Server:**
```typescript
// In app code, detect test environment and use mock API
const API_URL = process.env.E2E_TEST
  ? 'http://localhost:3001'  // Mock server
  : 'https://api.production.com';

// Test with controlled responses
describe('API Error Handling', () => {
  it('should handle server error gracefully', async () => {
    // Configure mock server to return 500
    await fetch('http://localhost:3001/__mock/set-response', {
      method: 'POST',
      body: JSON.stringify({ statusCode: 500, delay: 0 })
    });

    await device.launchApp({ newInstance: true });
    await element(by.id('fetch-data-button')).tap();

    // Verify error handling
    await expect(element(by.id('server-error-message'))).toBeVisible();
  });

  it('should handle slow network', async () => {
    // Configure mock server with 5 second delay
    await fetch('http://localhost:3001/__mock/set-response', {
      method: 'POST',
      body: JSON.stringify({ statusCode: 200, delay: 5000 })
    });

    await device.launchApp({ newInstance: true });
    await element(by.id('fetch-data-button')).tap();

    // Verify loading state shown
    await expect(element(by.id('loading-spinner'))).toBeVisible();

    // Wait for data to load
    await waitFor(element(by.id('data-loaded')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```

**URL Blacklisting:**
```typescript
// Block specific domains during tests
await device.setURLBlacklist(['.*analytics.*', '.*tracking.*', '.*ads.*']);

// Useful for preventing analytics calls during E2E tests
// or simulating blocked third-party services
```

**Android ADB Airplane Mode:**
```typescript
import { execSync } from 'child_process';

const enableAirplaneMode = () => {
  execSync('adb shell settings put global airplane_mode_on 1');
  execSync('adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true');
};

const disableAirplaneMode = () => {
  execSync('adb shell settings put global airplane_mode_on 0');
  execSync('adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false');
};
```

### 7. Firebase Analytics Testing

**Important:** Detox cannot directly intercept Firebase Analytics events. Use these strategies:

**Strategy 1: Firebase DebugView**
```typescript
// Enable debug mode in app build
// iOS: Add -FIRAnalyticsDebugEnabled to launch arguments
// Android: adb shell setprop debug.firebase.analytics.app <package_name>

// Events will appear in Firebase Console > DebugView in real-time
// Manual verification alongside automated tests
```

**Strategy 2: Test Bridge Pattern**
```typescript
// In app code (test builds only)
if (__DEV__ || process.env.E2E_TEST) {
  const originalLogEvent = analytics.logEvent;
  global.__analyticsEvents = [];

  analytics.logEvent = (name, params) => {
    global.__analyticsEvents.push({ name, params, timestamp: Date.now() });
    return originalLogEvent(name, params);
  };
}

// Expose via native module for test verification
// Create a custom native module that exposes __analyticsEvents
```

**Strategy 3: Mock Analytics**
```typescript
// Create mock analytics module for test builds
// e2e/mocks/analytics.ts
export const mockAnalytics = {
  events: [] as Array<{ name: string; params: object }>,

  logEvent(name: string, params: object) {
    this.events.push({ name, params });
  },

  getEvents() {
    return this.events;
  },

  clearEvents() {
    this.events = [];
  }
};

// Use in tests
it('should log purchase event', async () => {
  await element(by.id('buy-button')).tap();

  // Verify via exposed test interface
  const events = await device.launchApp({
    launchArgs: { getAnalyticsEvents: 'true' }
  });

  // Check events contain expected data
});
```

### 8. Location Mocking

```typescript
describe('Location-Based Features', () => {
  it('should show nearby locations based on GPS', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'always' }
    });

    // Set mock location (San Francisco)
    await device.setLocation(37.7749, -122.4194);

    // Trigger location-based search
    await element(by.id('find-nearby-button')).tap();

    // Verify results for San Francisco area
    await expect(element(by.text('San Francisco'))).toBeVisible();
  });

  it('should update when location changes', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'always' }
    });

    // Start in New York
    await device.setLocation(40.7128, -74.0060);
    await element(by.id('find-nearby-button')).tap();
    await expect(element(by.text('New York'))).toBeVisible();

    // Move to Los Angeles
    await device.setLocation(34.0522, -118.2437);
    await element(by.id('refresh-button')).tap();
    await expect(element(by.text('Los Angeles'))).toBeVisible();
  });
});
```

### 9. Device Orientation Testing

```typescript
describe('Orientation Changes', () => {
  it('should adapt layout for landscape mode', async () => {
    await device.launchApp({ newInstance: true });

    // Start in portrait
    await device.setOrientation('portrait');
    await expect(element(by.id('portrait-layout'))).toBeVisible();

    // Rotate to landscape
    await device.setOrientation('landscape');

    // Verify landscape layout
    await expect(element(by.id('landscape-layout'))).toBeVisible();
  });

  it('should preserve scroll position on rotation', async () => {
    await device.launchApp({ newInstance: true });
    await device.setOrientation('portrait');

    // Scroll down
    await element(by.id('content-list')).scroll(500, 'down');

    // Get visible item
    await expect(element(by.id('item-10'))).toBeVisible();

    // Rotate
    await device.setOrientation('landscape');

    // Item should still be visible
    await expect(element(by.id('item-10'))).toBeVisible();
  });
});
```

### 10. Shake Gesture Testing

```typescript
describe('Shake Gesture', () => {
  it('should show debug menu on shake (dev builds)', async () => {
    await device.launchApp({ newInstance: true });

    // Trigger shake gesture
    await device.shake();

    // Verify debug menu appears
    await expect(element(by.id('debug-menu'))).toBeVisible();
  });
});
```

### 11. Performance Testing with Detox Instruments

Detox Instruments is a separate tool for performance profiling:

```bash
# Install Detox Instruments (macOS only)
# Download from: https://github.com/wix-incubator/DetoxInstruments

# Add to your app (iOS)
pod 'DetoxInstruments', :podspec => 'https://...'
```

```typescript
// Enable in Detox config
artifacts: {
  plugins: {
    instruments: {
      enabled: true  // Records performance data
    },
    timeline: {
      enabled: true  // Creates trace file for chrome://tracing
    }
  }
}
```

**What Detox Instruments Measures:**
- CPU usage
- Memory allocation
- Network activity
- Disk I/O
- JavaScript thread performance (React Native)
- FPS / Frame drops
- App launch time

---

## Core Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ENVIRONMENT    Install Detox, applesimutils, Android SDK    │
├─────────────────────────────────────────────────────────────────┤
│  2. PROJECT        Configure .detoxrc.js, native patches        │
├─────────────────────────────────────────────────────────────────┤
│  3. DISCOVERY      Add testIDs to all interactive elements      │
├─────────────────────────────────────────────────────────────────┤
│  4. WRITE TESTS    Manual tests or AI-powered via Wix Pilot     │
├─────────────────────────────────────────────────────────────────┤
│  5. BUILD          npx detox build --configuration <config>     │
├─────────────────────────────────────────────────────────────────┤
│  6. EXECUTE        npx detox test --record-videos all           │
├─────────────────────────────────────────────────────────────────┤
│  7. REPORT         Generate HTML report with embedded videos    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Setup

### macOS Prerequisites (for iOS)

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install applesimutils (required for iOS simulator control)
brew tap wix/brew
brew install applesimutils

# Verify installation
applesimutils --list
```

### Android Prerequisites

```bash
# Ensure ANDROID_HOME is set
echo $ANDROID_HOME  # Should output path like /Users/you/Library/Android/sdk

# Ensure emulator is available
emulator -list-avds

# Create AVD if needed
avdmanager create avd -n Pixel_4_API_33 -k "system-images;android-33;google_apis;x86_64"
```

### Project Dependencies

```bash
# Core Detox packages
npm install --save-dev detox jest @types/jest ts-jest

# For Expo projects
npm install --save-dev @config-plugins/detox

# For AI-powered testing (optional)
npm install --save-dev @wix-pilot/core @wix-pilot/detox

# For HTML reports
npm install --save-dev jest-html-reporter jest-junit

# Install Detox CLI globally (optional but recommended)
npm install -g detox-cli
```

---

## Adding testIDs by Platform

### React Native (Expo & CLI)

```tsx
import { View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';

// Screen Container
export function LoginScreen() {
  return (
    <SafeAreaView testID="login-screen">
      {/* Form inputs */}
      <TextInput
        testID="login-email-input"
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        testID="login-password-input"
        placeholder="Password"
        secureTextEntry
      />

      {/* Error display */}
      {error && (
        <View testID="login-error-banner">
          <Text testID="login-error-message">{error}</Text>
        </View>
      )}

      {/* Buttons */}
      <TouchableOpacity testID="login-submit-button" onPress={handleLogin}>
        <Text>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="login-forgot-password-link" onPress={handleForgotPassword}>
        <Text>Forgot Password?</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Lists with dynamic testIDs
export function UserList({ users }) {
  return (
    <FlatList
      testID="user-list"
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <View testID={`user-row-${index}`}>
          <Text testID={`user-name-${index}`}>{item.name}</Text>
          <TouchableOpacity testID={`user-delete-${index}`}>
            <Text>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
```

### iOS - SwiftUI

```swift
import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        VStack(spacing: 16) {
            // Email input
            TextField("Email", text: $email)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .accessibilityIdentifier("login-email-input")

            // Password input
            SecureField("Password", text: $password)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("login-password-input")

            // Error banner
            if showError {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .accessibilityIdentifier("login-error-banner")
            }

            // Submit button
            Button("Sign In") {
                handleLogin()
            }
            .buttonStyle(.borderedProminent)
            .accessibilityIdentifier("login-submit-button")

            // Forgot password link
            Button("Forgot Password?") {
                handleForgotPassword()
            }
            .accessibilityIdentifier("login-forgot-password-link")
        }
        .padding()
        .accessibilityIdentifier("login-screen")
    }
}

// Lists in SwiftUI
struct UserListView: View {
    let users: [User]

    var body: some View {
        List(users.indices, id: \.self) { index in
            HStack {
                Text(users[index].name)
                    .accessibilityIdentifier("user-name-\(index)")

                Spacer()

                Button("Delete") {
                    deleteUser(at: index)
                }
                .accessibilityIdentifier("user-delete-\(index)")
            }
            .accessibilityIdentifier("user-row-\(index)")
        }
        .accessibilityIdentifier("user-list")
    }
}
```

### iOS - UIKit

```swift
import UIKit

class LoginViewController: UIViewController {

    @IBOutlet weak var emailTextField: UITextField!
    @IBOutlet weak var passwordTextField: UITextField!
    @IBOutlet weak var errorBanner: UIView!
    @IBOutlet weak var errorLabel: UILabel!
    @IBOutlet weak var loginButton: UIButton!
    @IBOutlet weak var forgotPasswordButton: UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupAccessibilityIdentifiers()
    }

    private func setupAccessibilityIdentifiers() {
        // Screen
        view.accessibilityIdentifier = "login-screen"

        // Inputs
        emailTextField.accessibilityIdentifier = "login-email-input"
        passwordTextField.accessibilityIdentifier = "login-password-input"

        // Error display
        errorBanner.accessibilityIdentifier = "login-error-banner"
        errorLabel.accessibilityIdentifier = "login-error-message"

        // Buttons
        loginButton.accessibilityIdentifier = "login-submit-button"
        forgotPasswordButton.accessibilityIdentifier = "login-forgot-password-link"
    }
}

// UITableView cells
extension UserListViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "UserCell", for: indexPath)

        // Set testID for the row
        cell.accessibilityIdentifier = "user-row-\(indexPath.row)"

        // Set testID for elements within the cell
        cell.textLabel?.accessibilityIdentifier = "user-name-\(indexPath.row)"

        return cell
    }
}
```

### Android - Jetpack Compose

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag

@Composable
fun LoginScreen(
    onLogin: (String, String) -> Unit,
    onForgotPassword: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .testTag("login-screen")
    ) {
        // Email input
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login-email-input")
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Password input
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login-password-input")
        )

        // Error banner
        if (showError) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
                    .testTag("login-error-banner")
            ) {
                Text(
                    text = errorMessage,
                    modifier = Modifier
                        .padding(16.dp)
                        .testTag("login-error-message")
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Submit button
        Button(
            onClick = { onLogin(email, password) },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login-submit-button")
        ) {
            Text("Sign In")
        }

        // Forgot password link
        TextButton(
            onClick = onForgotPassword,
            modifier = Modifier.testTag("login-forgot-password-link")
        ) {
            Text("Forgot Password?")
        }
    }
}

// Lists with LazyColumn
@Composable
fun UserList(
    users: List<User>,
    onDelete: (Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier.testTag("user-list")
    ) {
        itemsIndexed(users) { index, user ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .testTag("user-row-$index")
            ) {
                Text(
                    text = user.name,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("user-name-$index")
                )

                IconButton(
                    onClick = { onDelete(index) },
                    modifier = Modifier.testTag("user-delete-$index")
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete")
                }
            }
        }
    }
}
```

### Android - XML Views

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- res/layout/activity_login.xml -->
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:contentDescription="login-screen">

    <!-- Email input -->
    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content">

        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/emailInput"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:hint="Email"
            android:inputType="textEmailAddress"
            android:contentDescription="login-email-input" />
    </com.google.android.material.textfield.TextInputLayout>

    <!-- Password input -->
    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp">

        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/passwordInput"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:hint="Password"
            android:inputType="textPassword"
            android:contentDescription="login-password-input" />
    </com.google.android.material.textfield.TextInputLayout>

    <!-- Error banner -->
    <com.google.android.material.card.MaterialCardView
        android:id="@+id/errorBanner"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:visibility="gone"
        android:contentDescription="login-error-banner">

        <TextView
            android:id="@+id/errorMessage"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:padding="16dp"
            android:textColor="@color/error"
            android:contentDescription="login-error-message" />
    </com.google.android.material.card.MaterialCardView>

    <!-- Submit button -->
    <Button
        android:id="@+id/loginButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Sign In"
        android:contentDescription="login-submit-button" />

    <!-- Forgot password link -->
    <Button
        android:id="@+id/forgotPasswordButton"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:text="Forgot Password?"
        style="@style/Widget.Material3.Button.TextButton"
        android:contentDescription="login-forgot-password-link" />
</LinearLayout>
```

---

## Writing Tests

### Complete Test File Template

```typescript
// e2e/flows/auth/login-flow.test.ts
import { device, element, by, expect, waitFor } from 'detox';

describe('User Authentication - Login Flow', () => {

  // Runs once before all tests in this file
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  // Runs before each test - ensures clean state
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  // Runs after each test (optional - for cleanup)
  afterEach(async () => {
    // Take screenshot on failure is handled by Detox config
  });

  it('should display welcome screen with login and register options', async () => {
    // Wait for screen to load
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify key elements
    await expect(element(by.id('welcome-login-button'))).toBeVisible();
    await expect(element(by.id('welcome-register-button'))).toBeVisible();
    await expect(element(by.id('welcome-logo'))).toBeVisible();
  });

  it('should navigate to login screen when tapping Sign In', async () => {
    // Wait for welcome screen
    await waitFor(element(by.id('welcome-login-button')))
      .toBeVisible()
      .withTimeout(5000);

    // Navigate to login
    await element(by.id('welcome-login-button')).tap();

    // Verify login screen loaded
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify form elements
    await expect(element(by.id('login-email-input'))).toBeVisible();
    await expect(element(by.id('login-password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  it('should show inline validation error for invalid email format', async () => {
    // Navigate to login
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Enter invalid email
    await element(by.id('login-email-input')).tap();
    await element(by.id('login-email-input')).typeText('invalid-email');

    // Tap elsewhere to trigger validation
    await element(by.id('login-password-input')).tap();

    // Verify error shown
    await waitFor(element(by.id('login-email-error')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show error banner when credentials are incorrect', async () => {
    // Navigate to login
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Enter credentials
    await element(by.id('login-email-input')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');

    await element(by.id('login-password-input')).tap();
    await element(by.id('login-password-input')).typeText('wrongpassword');

    // Submit
    await element(by.id('login-submit-button')).tap();

    // Verify error banner
    await waitFor(element(by.id('login-error-banner')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to home screen after successful authentication', async () => {
    // Navigate to login
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Enter valid credentials
    await element(by.id('login-email-input')).tap();
    await element(by.id('login-email-input')).typeText('test@example.com');

    await element(by.id('login-password-input')).tap();
    await element(by.id('login-password-input')).typeText('correctpassword');

    // Submit
    await element(by.id('login-submit-button')).tap();

    // Verify navigation to home
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```

### Handling Common UI Patterns

```typescript
// Modals and Alerts
describe('Modal Interactions', () => {
  it('should handle confirmation modal', async () => {
    await element(by.id('delete-button')).tap();

    // Wait for modal
    await waitFor(element(by.id('confirmation-modal')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify modal content
    await expect(element(by.id('confirmation-modal-title'))).toHaveText('Confirm Delete');

    // Tap confirm
    await element(by.id('confirmation-modal-confirm-btn')).tap();

    // Verify modal dismissed
    await waitFor(element(by.id('confirmation-modal')))
      .not.toBeVisible()
      .withTimeout(3000);
  });

  it('should handle system alert', async () => {
    // Trigger alert
    await element(by.id('request-permission-button')).tap();

    // Handle iOS system alert
    try {
      await element(by.label('Allow')).tap();
    } catch {
      // Android or alert not shown
    }
  });
});

// Pull to Refresh
describe('Pull to Refresh', () => {
  it('should refresh list when pulling down', async () => {
    await waitFor(element(by.id('content-list'))).toBeVisible().withTimeout(5000);

    // Pull to refresh
    await element(by.id('content-list')).scroll(200, 'down');
    await element(by.id('content-list')).scroll(200, 'up');

    // Wait for refresh to complete
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(5000);
  });
});

// Scrolling Lists
describe('Scrolling', () => {
  it('should scroll to bottom of list', async () => {
    // Scroll down until element visible
    await waitFor(element(by.id('list-footer')))
      .toBeVisible()
      .whileElement(by.id('content-list'))
      .scroll(500, 'down');
  });

  it('should scroll to specific item', async () => {
    // Scroll until target item visible
    await waitFor(element(by.id('item-50')))
      .toBeVisible()
      .whileElement(by.id('item-list'))
      .scroll(200, 'down');

    await element(by.id('item-50')).tap();
  });
});

// Keyboard Handling
describe('Keyboard', () => {
  it('should dismiss keyboard properly', async () => {
    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).typeText('search term');

    // Dismiss keyboard (iOS)
    try {
      await element(by.id('search-input')).tapReturnKey();
    } catch {
      // Fallback: tap outside
      await element(by.id('screen-container')).tap();
    }
  });
});
```

### Test Data Management

```typescript
// e2e/utils/fixtures.ts
export const TEST_USERS = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123!',
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'Admin123!',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};

export const TEST_DATA = {
  sampleItem: {
    name: 'Test Item',
    description: 'A test item for E2E testing',
  },
};

// Usage in tests
import { TEST_USERS } from '../utils/fixtures';

it('should login with valid credentials', async () => {
  await element(by.id('login-email-input')).typeText(TEST_USERS.validUser.email);
  await element(by.id('login-password-input')).typeText(TEST_USERS.validUser.password);
  // ...
});
```

---

## Debugging Failed Tests

### Enable Verbose Logging

```bash
# Run with trace-level logging
npx detox test --configuration ios.sim.debug --loglevel trace

# Run specific test with verbose output
npx detox test --configuration ios.sim.debug -t "should login" --loglevel verbose
```

### View UI Hierarchy

```typescript
// In your test, before failing assertion
it('should find element', async () => {
  // Dump view hierarchy to console
  await device.launchApp({ newInstance: true });

  // Get hierarchy (useful for debugging)
  const hierarchy = await device.getUiHierarchy();
  console.log(JSON.stringify(hierarchy, null, 2));

  // Now your assertion
  await expect(element(by.id('my-element'))).toBeVisible();
});
```

### Take Debug Screenshots

```typescript
it('should debug failing test', async () => {
  await device.takeScreenshot('before-action');

  try {
    await element(by.id('missing-element')).tap();
  } catch (error) {
    await device.takeScreenshot('after-failure');
    throw error;
  }
});
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Element not found | testID not set | Add `testID` prop to component |
| Element not visible | Off-screen or covered | Use `scroll` to bring into view |
| Timeout waiting | Slow animation/network | Increase timeout with `withTimeout()` |
| Flaky tests | Race conditions | Add explicit `waitFor` conditions |
| Keyboard blocking | Input covered | Use `KeyboardAvoidingView` |

---

## Configuration Reference

### .detoxrc.js

See `references/detox-config.md` for complete configuration.

### Jest Config (e2e/jest.config.js)

```javascript
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.{js,ts}'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'E2E Test Report',
      outputPath: 'e2e/reports/test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
    }],
    ['jest-junit', {
      outputDirectory: 'e2e/reports',
      outputName: 'junit.xml',
    }],
  ],
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
```

---

## Build & Run Commands

### Build

```bash
# iOS Debug (development)
npx detox build --configuration ios.sim.debug

# iOS Release (production-like)
npx detox build --configuration ios.sim.release

# Android Debug
npx detox build --configuration android.emu.debug

# Android Release
npx detox build --configuration android.emu.release
```

### Run Tests

```bash
# Run all tests
npx detox test --configuration ios.sim.debug

# Run specific file
npx detox test --configuration ios.sim.debug e2e/flows/auth/login-flow.test.ts

# Run tests matching pattern
npx detox test --configuration ios.sim.debug --testNamePattern="should login"

# Run with all artifacts
npx detox test \
  --configuration ios.sim.debug \
  --record-videos all \
  --take-screenshots all \
  --record-logs all \
  --artifacts-location ./e2e/artifacts

# Run headless (CI mode)
npx detox test --configuration ios.sim.release --headless --cleanup
```

---

## Detox API Quick Reference

### Matchers
```typescript
by.id('testID')           // By testID (RECOMMENDED)
by.text('Button Text')    // By visible text
by.label('Accessibility') // By accessibility label
by.type('RCTTextInput')   // By native type
by.traits(['button'])     // By accessibility traits
```

### Actions
```typescript
.tap()                    // Single tap
.longPress()              // Long press
.multiTap(2)              // Double tap
.typeText('text')         // Type text (appends)
.replaceText('text')      // Replace all text
.clearText()              // Clear input
.scroll(100, 'down')      // Scroll by pixels
.scrollTo('bottom')       // Scroll to edge
.swipe('left')            // Swipe gesture
.pinch(1.5)               // Pinch to zoom
.tapReturnKey()           // Tap keyboard return
```

### Expectations
```typescript
expect(element).toBeVisible()
expect(element).toExist()
expect(element).not.toBeVisible()
expect(element).toHaveText('text')
expect(element).toHaveLabel('label')
expect(element).toHaveId('id')
expect(element).toBeFocused()
```

### waitFor
```typescript
await waitFor(element(by.id('x')))
  .toBeVisible()
  .withTimeout(10000);

await waitFor(element(by.id('x')))
  .toBeVisible()
  .whileElement(by.id('scroll'))
  .scroll(100, 'down');
```

### Device
```typescript
device.launchApp()
device.launchApp({ newInstance: true })
device.launchApp({ delete: true })  // Clear all data
device.reloadReactNative()
device.takeScreenshot('name')
device.shake()
device.setLocation(37.7749, -122.4194)
device.setURLBlacklist(['.*google.*'])
device.enableSynchronization()
device.disableSynchronization()
device.sendToHome()
device.setBiometricEnrollment(true)
device.matchFace()
device.matchFinger()
device.setOrientation('landscape')
device.openURL({ url: 'myapp://path' })
device.sendUserNotification({ ... })
```

---

## Additional References

- `references/detox-config.md` - Complete .detoxrc.js configuration
- `references/android-setup.md` - Android native code patches
- `references/pilot-setup.md` - AI-powered testing with Wix Pilot
- `references/ci-workflows.md` - GitHub Actions, CircleCI, Bitrise
- `scripts/run-e2e.sh` - Automated test runner script
- `scripts/generate-report.js` - Standalone HTML report generator
- `scripts/report-hub.js` - Consolidated dashboard for multiple test sessions

---

## Example Test Files

The skill includes comprehensive example tests covering common app patterns:

### Authentication Examples
| File | Description |
|------|-------------|
| `login-flow.test.ts` | Complete login flow with validation and navigation |
| `registration-flow.test.ts` | User registration with email verification |
| `password-reset.test.ts` | Password reset via email and security questions |
| `two-factor-auth.test.ts` | SMS, TOTP, and backup code verification |

### Navigation Examples
| File | Description |
|------|-------------|
| `tab-navigation.test.ts` | Bottom tab bar, state persistence, badges |
| `drawer-navigation.test.ts` | Hamburger menu, nested sections, logout |
| `deep-linking.test.ts` | URL schemes, universal links, auth-required links |

### Form and Search Examples
| File | Description |
|------|-------------|
| `form-validation.test.ts` | Real-time validation, password strength, submission |
| `search-filter.test.ts` | Search, suggestions, filters, sorting, history |

### Media Examples
| File | Description |
|------|-------------|
| `video-player.test.ts` | Playback controls, fullscreen, quality, subtitles |
| `audio-player.test.ts` | Music player, shuffle/repeat, queue, background |
| `image-gallery.test.ts` | Grid view, zoom, albums, selection mode |

### Productivity Examples
| File | Description |
|------|-------------|
| `calendar-scheduling.test.ts` | Views, events, reminders, recurring |
| `file-management.test.ts` | Browsing, folders, uploads, file actions |
| `notes-editor.test.ts` | Rich text, organization, tags, search |

### Settings Examples
| File | Description |
|------|-------------|
| `user-settings.test.ts` | Profile, account, preferences, privacy |
| `notification-settings.test.ts` | Push, email, DND, sound/vibration |

### Domain-Specific Examples
| File | Description |
|------|-------------|
| `e-commerce.test.ts` | Product browsing, cart, checkout, orders |
| `social-media.test.ts` | Feed, posts, stories, profiles, interactions |
| `messaging-chat.test.ts` | Conversations, real-time, media, typing indicators |
| `onboarding-tutorial.test.ts` | Carousels, permissions, personalization |
| `gaming-entertainment.test.ts` | Menus, IAP, leaderboards, achievements |
| `banking-finance.test.ts` | Accounts, transactions, transfers, bill pay |
| `fitness-tracker.test.ts` | Activity tracking, workouts, goals, health |
| `maps-location.test.ts` | Map views, search, directions, places |

### Special Topics
| File | Description |
|------|-------------|
| `permissions.test.ts` | Camera, location, notifications, biometrics |
| `advanced-features.test.ts` | Deep links, offline mode, background states |
| `accessibility.test.ts` | Screen reader, dynamic type, contrast, focus |

---

## Report Hub - Consolidated Test Dashboard

Instead of generating separate reports for each test run, use the **Report Hub** to create a single dashboard where QAs can browse all test sessions.

### Features

| Feature | Description |
|---------|-------------|
| **Session Navigation** | Side menu lists all test runs by date/feature |
| **Append Mode** | New test runs are added to existing hub |
| **Pass Rate Trends** | Visual chart showing trends across runs |
| **Test Filtering** | Filter by passed/failed/all within sessions |
| **Video Playback** | Embedded video player for recordings |
| **Screenshot Gallery** | Lightbox viewer for all screenshots |
| **Search** | Search across sessions by name |
| **Export** | Export individual sessions as JSON |
| **Dark/Light Mode** | Theme toggle with system preference detection |

### Usage

```bash
# First run - creates new hub
node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Login Flow"

# Subsequent runs - appends to existing hub
node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Checkout Flow"
node scripts/report-hub.js --artifacts ./artifacts --hub ./report-hub --session "Registration"

# Each run adds a new session to the sidebar navigation
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--artifacts` | Path to Detox artifacts directory | `./e2e/artifacts` |
| `--hub` | Path to report hub output directory | `./report-hub` |
| `--session` | Session name (appears in sidebar) | Timestamp |
| `--project` | Project name for dashboard header | "E2E Test Hub" |

### Directory Structure

```
report-hub/
├── index.html          # Main dashboard (auto-regenerated)
├── data/
│   ├── login-flow.json
│   ├── checkout-flow.json
│   └── registration.json
└── assets/
    ├── login-flow_video.mp4
    ├── login-flow_screenshot.png
    └── ...
```

### QA Workflow

1. **Run tests by feature area**: `npx detox test e2e/flows/auth/`
2. **Add to hub**: `node scripts/report-hub.js --session "Auth - Login"`
3. **Run more tests**: `npx detox test e2e/flows/checkout/`
4. **Append to hub**: `node scripts/report-hub.js --session "Checkout - Cart"`
5. **Open hub**: Single `index.html` shows all sessions in sidebar

### CI/CD Integration

```yaml
# Add to your CI workflow
- name: Generate Report Hub
  run: |
    node scripts/report-hub.js \
      --artifacts ./e2e/artifacts \
      --hub ./report-hub \
      --session "${{ github.run_id }}-${{ matrix.test-suite }}" \
      --project "MyApp E2E Tests"

- name: Upload Report Hub
  uses: actions/upload-artifact@v4
  with:
    name: e2e-report-hub
    path: report-hub/
```

---

## Additional Ideas for Enhancement

Future improvements that can be added to this skill:

| Idea | Description | Complexity |
|------|-------------|------------|
| **Test Coverage Map** | Visual diagram showing which screens have E2E coverage | Medium |
| **Flaky Test Detection** | Track tests that intermittently fail across runs | Medium |
| **Performance Trending** | Chart execution times over multiple runs | Low |
| **Screenshot Diff** | Compare screenshots between runs to detect UI regressions | High |
| **Slack Integration** | Send test summaries to Slack/Teams channels | Low |
| **Test Prioritization** | AI-powered suggestions for which tests to run based on code changes | High |
| **Parallel Test Runner** | Split tests across multiple simulators/emulators | Medium |
| **Device Farm Integration** | Connect to AWS Device Farm or Firebase Test Lab | High |

---

## External Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox GitHub](https://github.com/wix/Detox)
- [Wix Pilot (AI Testing)](https://github.com/wix-incubator/pilot)
- [Detox Instruments](https://github.com/wix-incubator/DetoxInstruments)
- [Firebase DebugView](https://firebase.google.com/docs/analytics/debugview)
- [Lucide Icons](https://lucide.dev/) - Icons used in HTML reports
