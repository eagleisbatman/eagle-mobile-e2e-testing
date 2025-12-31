# Eagle Mobile E2E Testing

> **For AI Coding Agents** | Human docs: [README.md](README.md)

Production-grade end-to-end mobile testing skill using **Detox**. Covers the complete workflow: setup, configuration, test writing, execution, and HTML report generation.

**Author:** [Gautam Mandewalker](https://www.linkedin.com/in/gautammandewalker) | **License:** MIT

---

## How to Use This Skill

### Scenario A: You Cloned This Repo

If you cloned this repo directly, **read the full skill file**:

```
→ Read: SKILL.md (in this directory)
```

SKILL.md contains:
- Complete Detox setup instructions
- testID conventions for all platforms
- Handling missing testIDs (adding them to components)
- Test patterns and examples
- Background execution guidelines
- HTML report generation
- CI/CD workflows
- 28 example test files

### Scenario B: Adding to Existing AGENTS.md

If you already have an `AGENTS.md` in your project, add this section:

```markdown
## Mobile E2E Testing (Detox)

For comprehensive mobile E2E testing, this project uses the Eagle Mobile E2E Testing skill.

Skill location: [.skills/mobile-e2e/SKILL.md] or [path/to/eagle-mobile-e2e-testing/SKILL.md]

When asked to write E2E tests, set up Detox, or generate test reports:
1. Read the SKILL.md file at the path above
2. Follow the guidelines for UI discovery, testID handling, and background execution
3. Use the test patterns and examples provided

Installation:
git clone https://github.com/eagleisbatman/eagle-mobile-e2e-testing.git .skills/mobile-e2e
```

---

## End-to-End Prompt Template

When users request E2E testing, they should provide this context for the **complete workflow**:

```
Set up and run complete E2E testing for my mobile app.

PROJECT CONTEXT:
- App name: [MyApp]
- Framework: [React Native Expo / CLI / SwiftUI / UIKit / Jetpack Compose]
- Language: [TypeScript / JavaScript / Swift / Kotlin]
- Project root: [/path/to/project]
- Screens folder: [src/screens/ or src/features/*/screens/]
- Navigation: [React Navigation / Expo Router / Native]

WHAT I NEED:
1. [ ] Set up Detox from scratch (install, configure .detoxrc.js)
2. [ ] Discover existing UI structure and testIDs
3. [ ] Add missing testIDs to components
4. [ ] Write E2E tests for: [list features/flows]
5. [ ] Run tests on: [iOS Simulator / Android Emulator / Both]
6. [ ] Generate HTML report with videos and screenshots

FEATURES TO TEST:
- [Feature 1]: User flow description
- [Feature 2]: User flow description
- [Feature 3]: User flow description

TARGET DEVICES:
- iOS: [iPhone 15 / iPhone 14 Pro]
- Android: [Pixel 4 API 33 / etc.]

SPECIAL REQUIREMENTS:
- [ ] Biometric authentication
- [ ] Deep links
- [ ] Offline mode
- [ ] Network mocking
- [ ] CI/CD setup for [GitHub Actions / CircleCI]
```

---

## Quick Reference (Critical Rules Only)

For full details, **read SKILL.md**. Here are the critical rules:

### 1. Always Discover Before Writing
```bash
grep -rn "testID=" --include="*.tsx" src/ | head -50
```

### 2. Add Missing testIDs First
```bash
# Find elements WITHOUT testIDs
grep -rn "onPress=\|<Button\|<TextInput" --include="*.tsx" src/ | grep -v "testID" | head -20
```
Then add testIDs to components before writing tests.

### 3. Run Long Commands in Background
- `detox build` → background (2-10 min)
- `detox test` → background (5-30+ min)
- `npx expo prebuild` → background (1-5 min)

### 4. Generate Reports After Tests
```bash
node scripts/generate-report.js --artifacts ./artifacts --output ./reports
```

---

## Full Documentation

**Read SKILL.md for complete coverage of:**

| Section | What You'll Learn |
|---------|-------------------|
| Prompt Templates | 5 detailed templates for different scenarios |
| Platform Support | React Native, SwiftUI, UIKit, Compose, XML |
| Handling Missing testIDs | How to add testIDs to all platforms |
| Test Patterns | Forms, scrolling, permissions, biometrics, deep links |
| Background Execution | Why and how to run builds/tests in background |
| Report Generation | HTML reports with videos, screenshots, dark/light mode |
| CI/CD Workflows | GitHub Actions, CircleCI, Bitrise templates |
| Detox Copilot | Natural language testing with LLMs |

---

## External Links

- [Detox Documentation](https://wix.github.io/Detox/)
- [Full SKILL.md Reference](SKILL.md)
- [Example Tests](examples/)
