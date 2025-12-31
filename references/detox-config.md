# Detox Configuration Reference

Complete `.detoxrc.js` configuration for mobile E2E testing with video recording and artifacts.

## Table of Contents
1. [Complete Configuration Template](#complete-configuration-template)
2. [Apps Configuration](#apps-configuration)
3. [Devices Configuration](#devices-configuration)
4. [Artifacts Configuration](#artifacts-configuration)
5. [Test Runner Configuration](#test-runner-configuration)

## Complete Configuration Template

```javascript
/** @type {Detox.DetoxConfig} */
module.exports = {
  // Logging configuration
  logger: {
    level: process.env.CI ? 'debug' : 'info',
  },

  // Test runner configuration
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  // Artifacts configuration (videos, screenshots, logs)
  artifacts: {
    rootDir: 'e2e/artifacts',
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: true,
          testDone: true,
          appNotReady: true,
        },
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
        android: {
          bitRate: 4000000,
        },
        simulator: {
          codec: 'hevc',
        },
      },
      instruments: {
        enabled: false,
      },
      uiHierarchy: 'enabled',
      timeline: {
        enabled: true,
      },
    },
  },

  // App configurations
  apps: {
    // iOS Debug
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app',
      build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    // iOS Release
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/YourApp.app',
      build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    // Android Debug
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
    },
    // Android Release
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
    },
  },

  // Device configurations
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_33',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
  },

  // Configuration combinations
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
  },
};
```

## Apps Configuration

### iOS App Types

```javascript
'ios.debug': {
  type: 'ios.app',
  binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/AppName.app',
  build: 'xcodebuild -workspace ios/AppName.xcworkspace -scheme AppName -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
  launchArgs: {
    // Custom launch arguments
    detoxPrintBusyIdleResources: 'YES',
  },
}
```

### Android App Types

```javascript
'android.debug': {
  type: 'android.apk',
  binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
  testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk', // Optional
  build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
}
```

### Product Flavors (Android)

```javascript
'driver.android.debug': {
  type: 'android.apk',
  binaryPath: 'android/app/build/outputs/apk/driver/debug/app-driver-debug.apk',
  build: 'cd android && ./gradlew assembleDriverDebug assembleDriverDebugAndroidTest -DtestBuildType=debug',
},
```

## Devices Configuration

### iOS Simulators

```javascript
simulator: {
  type: 'ios.simulator',
  device: {
    type: 'iPhone 15',        // Device type
    // OR
    name: 'My iPhone 15',     // Specific simulator name
    // OR
    id: 'UDID-HERE',          // Specific UDID
  },
}
```

List available device types:
```bash
xcrun simctl list devicetypes
```

### Android Emulators

```javascript
emulator: {
  type: 'android.emulator',
  device: {
    avdName: 'Pixel_4_API_33',
  },
  utilBinaryPaths: [
    'path/to/custom/test-butler-app.apk',
  ],
}
```

List available AVDs:
```bash
emulator -list-avds
```

### Attached Android Devices

```javascript
attached: {
  type: 'android.attached',
  device: {
    adbName: '.*',              // Any device
    // OR
    adbName: 'emulator-5554',   // Specific device
  },
}
```

## Artifacts Configuration

### Complete Artifacts Setup

```javascript
artifacts: {
  rootDir: 'e2e/artifacts',
  pathBuilder: './e2e/customPathBuilder',  // Optional custom path builder
  plugins: {
    log: {
      enabled: true,
      keepOnlyFailedTestsArtifacts: false,
    },
    screenshot: {
      enabled: true,
      shouldTakeAutomaticSnapshots: true,
      keepOnlyFailedTestsArtifacts: false,
      takeWhen: {
        testStart: true,
        testDone: true,
        appNotReady: true,
      },
    },
    video: {
      enabled: true,
      keepOnlyFailedTestsArtifacts: false,
      android: {
        bitRate: 4000000,        // 4 Mbps
        size: '720x1280',        // Optional resolution
      },
      simulator: {
        codec: 'hevc',           // h264 or hevc
      },
    },
    instruments: {
      enabled: false,            // iOS only, requires Detox Instruments
    },
    uiHierarchy: 'enabled',      // Captures view hierarchy on failure
    timeline: {
      enabled: true,             // Creates trace file for chrome://tracing
    },
  },
}
```

### CLI Artifact Flags

```bash
# Record videos for all tests
--record-videos all

# Record videos only for failing tests
--record-videos failing

# Disable video recording
--record-videos none

# Take screenshots
--take-screenshots all
--take-screenshots failing
--take-screenshots none

# Record logs
--record-logs all
--record-logs failing
--record-logs none

# Custom artifacts location
--artifacts-location ./custom/path/
```

## Test Runner Configuration

### Jest Configuration

```javascript
testRunner: {
  args: {
    '$0': 'jest',
    config: 'e2e/jest.config.js',
  },
  jest: {
    setupTimeout: 120000,        // 2 minutes for app launch
    teardownTimeout: 30000,      // 30 seconds for cleanup
    retryAfterCircusRetries: true,
  },
  forwardEnv: true,              // Forward env vars to test runner
}
```

### Jest Config File (e2e/jest.config.js)

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

## Environment-Specific Configurations

### CI Environment Detection

```javascript
const isCI = process.env.CI === 'true';

module.exports = {
  logger: {
    level: isCI ? 'debug' : 'info',
  },
  artifacts: {
    plugins: {
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: isCI,  // Only keep failures on CI
      },
    },
  },
};
```

### Behavior Configuration

```javascript
behavior: {
  init: {
    exposeGlobals: true,         // Expose device, element, by, etc.
    reinstallApp: true,          // Reinstall app before each test suite
  },
  launchApp: 'auto',             // auto, manual
  cleanup: {
    shutdownDevice: false,       // Don't shutdown device after tests
  },
}
```
