# Android Setup Reference

Complete Android native code patches required for Detox E2E testing.

## Table of Contents
1. [Build Script Patches](#build-script-patches)
2. [DetoxTest.java Creation](#detoxtest-java-creation)
3. [Network Security Configuration](#network-security-configuration)
4. [ProGuard Configuration](#proguard-configuration)
5. [Expo-Specific Setup](#expo-specific-setup)

## Build Script Patches

### android/build.gradle

```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        kotlinVersion = "1.9.22"  // Add Kotlin version
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.2")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")  // Add this
    }
}

// Add this section for Detox
allprojects {
    repositories {
        google()
        mavenCentral()
        maven {
            url("$rootDir/../node_modules/detox/Detox-android")  // Add Detox
        }
    }
}
```

### android/app/build.gradle

```gradle
android {
    namespace "com.yourapp"
    compileSdkVersion rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "com.yourapp"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        
        // Add these for Detox
        testBuildType System.getProperty('testBuildType', 'debug')
        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'
    }

    buildTypes {
        debug {
            // Debug configuration
        }
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            // Add Detox ProGuard rules
            proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"
        }
    }
    
    // Packaging options for Detox
    packagingOptions {
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
    }
}

dependencies {
    // Existing dependencies...
    
    // Add Detox
    androidTestImplementation('com.wix:detox:+')
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
```

## DetoxTest.java Creation

Create file at: `android/app/src/androidTest/java/com/yourapp/DetoxTest.java`

```java
package com.yourapp;  // Replace with your package name

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
```

### Kotlin Version (Alternative)

Create file at: `android/app/src/androidTest/java/com/yourapp/DetoxTest.kt`

```kotlin
package com.yourapp

import com.wix.detox.Detox
import com.wix.detox.config.DetoxConfig
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class DetoxTest {
    @get:Rule
    val mActivityRule = ActivityTestRule(MainActivity::class.java, false, false)

    @Test
    fun runDetoxTests() {
        val detoxConfig = DetoxConfig().apply {
            idlePolicyConfig.masterTimeoutSec = 90
            idlePolicyConfig.idleResourceTimeoutSec = 60
            rnContextLoadTimeoutSec = if (BuildConfig.DEBUG) 180 else 60
        }
        Detox.runTests(mActivityRule, detoxConfig)
    }
}
```

## Network Security Configuration

### Create: android/app/src/main/res/xml/network_security_config.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

### Update: android/app/src/main/AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true">
        <!-- ... rest of application config -->
    </application>
</manifest>
```

## ProGuard Configuration

### android/app/proguard-rules.pro

Add these rules for Detox compatibility:

```proguard
# Detox
-keep class com.wix.detox.** { *; }
-dontwarn com.wix.detox.**

# React Native
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# Hermes
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# Keep test classes
-keep class **.DetoxTest { *; }
```

## Expo-Specific Setup

### For Expo Projects

1. Add config plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@config-plugins/detox",
        {
          "skipProguard": false,
          "subdomains": ["10.0.2.2", "localhost", "*"]
        }
      ]
    ]
  }
}
```

2. Run prebuild to generate native code:

```bash
npx expo prebuild --clean
```

3. The plugin automatically:
   - Patches build.gradle files
   - Creates network security config
   - Sets up test instrumentation runner

### EAS Build Configuration

Add to `eas.json`:

```json
{
  "build": {
    "development-detox": {
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug",
        "withoutCredentials": true
      },
      "ios": {
        "simulator": true
      }
    },
    "production-detox": {
      "android": {
        "gradleCommand": ":app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release"
      },
      "ios": {
        "simulator": true
      }
    }
  }
}
```

## Troubleshooting

### Common Build Errors

1. **Kotlin version mismatch**
   ```
   Execution failed for task ':react-native-screens:compileDebugKotlin'
   ```
   Solution: Ensure Kotlin version in build.gradle matches your project

2. **Missing test APK**
   ```
   app binary not found at 'android/app/build/outputs/apk/debug/app-debug.apk'
   ```
   Solution: Run the full build command:
   ```bash
   cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug
   ```

3. **Network connection refused**
   ```
   java.net.ConnectException: Connection refused
   ```
   Solution: Check network_security_config.xml is properly registered

4. **ReactApplication cast error**
   ```
   cannot be cast to com.facebook.react.ReactApplication
   ```
   Solution: Ensure MainApplication extends ReactApplication

### Verifying Setup

```bash
# Check emulator is available
emulator -list-avds

# Build the app
cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug

# Verify APKs exist
ls android/app/build/outputs/apk/debug/
ls android/app/build/outputs/apk/androidTest/debug/
```
