# CI/CD Workflows Reference

Continuous Integration and Deployment configurations for mobile E2E testing.

## Table of Contents
1. [GitHub Actions](#github-actions)
2. [CircleCI](#circleci)
3. [Bitrise](#bitrise)
4. [Artifact Management](#artifact-management)

## GitHub Actions

### Complete iOS + Android Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DETOX_CONFIGURATION: ${{ matrix.platform }}.sim.release

jobs:
  e2e-ios:
    name: iOS E2E Tests
    runs-on: macos-14
    timeout-minutes: 60

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Install Detox CLI
        run: npm install -g detox-cli

      - name: Install applesimutils
        run: |
          brew tap wix/brew
          brew install applesimutils

      - name: Install CocoaPods
        run: |
          cd ios
          pod install

      - name: Build iOS App
        run: npx detox build --configuration ios.sim.release

      - name: Run iOS E2E Tests
        run: |
          npx detox test \
            --configuration ios.sim.release \
            --record-videos failing \
            --take-screenshots failing \
            --record-logs failing \
            --cleanup \
            --headless

      - name: Upload iOS Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: detox-ios-artifacts
          path: |
            e2e/artifacts/
            e2e/reports/
          retention-days: 14

  e2e-android:
    name: Android E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Build Android App
        run: npx detox build --configuration android.emu.release

      - name: Run Android E2E Tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          arch: x86_64
          profile: pixel_4
          script: |
            npx detox test \
              --configuration android.emu.release \
              --record-videos failing \
              --take-screenshots failing \
              --record-logs failing \
              --cleanup \
              --headless

      - name: Upload Android Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: detox-android-artifacts
          path: |
            e2e/artifacts/
            e2e/reports/
          retention-days: 14

  report:
    name: Generate Test Report
    runs-on: ubuntu-latest
    needs: [e2e-ios, e2e-android]
    if: always()

    steps:
      - name: Download iOS Artifacts
        uses: actions/download-artifact@v4
        with:
          name: detox-ios-artifacts
          path: ios-artifacts

      - name: Download Android Artifacts
        uses: actions/download-artifact@v4
        with:
          name: detox-android-artifacts
          path: android-artifacts

      - name: Publish Test Results
        uses: dorny/test-reporter@v1
        with:
          name: E2E Test Results
          path: '**/junit.xml'
          reporter: jest-junit
```

### Expo EAS Build Workflow

```yaml
# .github/workflows/eas-e2e.yml
name: EAS E2E Tests

on:
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install Dependencies
        run: npm ci

      - name: Build iOS Simulator Binary
        run: eas build --platform ios --profile development-detox --non-interactive

      - name: Build Android APK
        run: eas build --platform android --profile development-detox --non-interactive

      # Continue with test execution...
```

## CircleCI

### Complete Configuration

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.1
  android: circleci/android@2.3
  macos: circleci/macos@2.4

executors:
  ios-executor:
    macos:
      xcode: "15.2.0"
    resource_class: macos.m1.large.gen1

  android-executor:
    docker:
      - image: cimg/android:2024.01
    resource_class: large

commands:
  install-detox-deps:
    steps:
      - run:
          name: Install Detox CLI
          command: npm install -g detox-cli
      - run:
          name: Install applesimutils
          command: brew tap wix/brew && brew install applesimutils

jobs:
  ios-e2e:
    executor: ios-executor
    steps:
      - checkout
      - node/install:
          node-version: '20'
      - run: npm ci
      - install-detox-deps
      - run:
          name: Install CocoaPods
          command: cd ios && pod install
      - run:
          name: Build iOS App
          command: npx detox build --configuration ios.sim.release
      - run:
          name: Run iOS E2E Tests
          command: |
            npx detox test \
              --configuration ios.sim.release \
              --record-videos failing \
              --take-screenshots failing \
              --cleanup
      - store_artifacts:
          path: e2e/artifacts
          destination: ios-e2e-artifacts
      - store_test_results:
          path: e2e/reports

  android-e2e:
    executor: android-executor
    steps:
      - checkout
      - node/install:
          node-version: '20'
      - run: npm ci
      - run:
          name: Install Detox CLI
          command: npm install -g detox-cli
      - android/create-avd:
          avd-name: test_avd
          system-image: system-images;android-33;google_apis;x86_64
          install: true
      - android/start-emulator:
          avd-name: test_avd
          no-window: true
          post-emulator-launch-assemble-command: ""
      - run:
          name: Build Android App
          command: npx detox build --configuration android.emu.release
      - run:
          name: Run Android E2E Tests
          command: |
            npx detox test \
              --configuration android.emu.release \
              --record-videos failing \
              --take-screenshots failing \
              --cleanup --headless
      - store_artifacts:
          path: e2e/artifacts
          destination: android-e2e-artifacts
      - store_test_results:
          path: e2e/reports

workflows:
  e2e-tests:
    jobs:
      - ios-e2e
      - android-e2e
```

## Bitrise

### Complete Configuration

```yaml
# bitrise.yml
format_version: "13"
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git

workflows:
  ios-e2e:
    steps:
      - git-clone@8: {}
      - npm@1:
          inputs:
            - command: ci
      - npm@1:
          title: Install Detox CLI
          inputs:
            - command: install -g detox-cli
      - script@1:
          title: Install applesimutils
          inputs:
            - content: |
                brew tap wix/brew
                brew install applesimutils
      - cocoapods-install@2: {}
      - script@1:
          title: Build iOS App
          inputs:
            - content: npx detox build --configuration ios.sim.release
      - script@1:
          title: Run iOS E2E Tests
          inputs:
            - content: |
                npx detox test \
                  --configuration ios.sim.release \
                  --record-videos all \
                  --take-screenshots all \
                  --artifacts-location $BITRISE_DEPLOY_DIR/e2e-artifacts \
                  --cleanup
      - deploy-to-bitrise-io@2:
          inputs:
            - deploy_path: $BITRISE_DEPLOY_DIR/e2e-artifacts

  android-e2e:
    steps:
      - git-clone@8: {}
      - npm@1:
          inputs:
            - command: ci
      - npm@1:
          title: Install Detox CLI
          inputs:
            - command: install -g detox-cli
      - avd-manager@1:
          inputs:
            - api_level: 33
            - profile: pixel_4
      - wait-for-android-emulator@1: {}
      - script@1:
          title: Build Android App
          inputs:
            - content: npx detox build --configuration android.emu.release
      - script@1:
          title: Run Android E2E Tests
          inputs:
            - content: |
                npx detox test \
                  --configuration android.emu.release \
                  --record-videos all \
                  --take-screenshots all \
                  --artifacts-location $BITRISE_DEPLOY_DIR/e2e-artifacts \
                  --cleanup --headless
      - deploy-to-bitrise-io@2:
          inputs:
            - deploy_path: $BITRISE_DEPLOY_DIR/e2e-artifacts

app:
  envs:
    - DETOX_CONFIGURATION: ios.sim.release
```

## Artifact Management

### Upload Artifacts Script

```bash
#!/bin/bash
# scripts/upload-artifacts.sh

ARTIFACTS_DIR="e2e/artifacts"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="e2e-artifacts-${TIMESTAMP}.tar.gz"

# Create archive
tar -czvf "$ARCHIVE_NAME" "$ARTIFACTS_DIR"

# Upload to S3 (example)
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp "$ARCHIVE_NAME" "s3://${AWS_S3_BUCKET}/e2e-reports/${ARCHIVE_NAME}"
fi

# Upload to GCS (example)
if [ -n "$GCS_BUCKET" ]; then
  gsutil cp "$ARCHIVE_NAME" "gs://${GCS_BUCKET}/e2e-reports/${ARCHIVE_NAME}"
fi

echo "Artifacts uploaded: $ARCHIVE_NAME"
```

### Slack Notification

```yaml
# Add to GitHub Actions workflow
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "❌ E2E Tests Failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*E2E Tests Failed*\n*Branch:* ${{ github.ref_name }}\n*Commit:* ${{ github.sha }}\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Test Report Publishing

```yaml
# Publish HTML report to GitHub Pages
- name: Deploy Report to GitHub Pages
  if: always()
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./e2e/reports
    destination_dir: e2e-reports/${{ github.run_number }}
```
