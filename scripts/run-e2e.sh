#!/bin/bash
#
# Mobile E2E Test Runner
# Complete automation script for Detox E2E testing with video recording and reporting
#
# Usage: ./run-e2e.sh [platform] [mode] [options]
#   platform: ios | android (default: ios)
#   mode: debug | release (default: debug)
#   options:
#     --skip-build    Skip the build step
#     --headless      Run in headless mode
#     --videos        Record all videos (default: failing only)
#     --screenshots   Take all screenshots (default: failing only)
#

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

PLATFORM="${1:-ios}"
MODE="${2:-debug}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARTIFACTS_DIR="e2e/artifacts/$TIMESTAMP"
REPORTS_DIR="e2e/reports"

# Parse additional options
SKIP_BUILD=false
HEADLESS=false
VIDEO_MODE="failing"
SCREENSHOT_MODE="failing"

for arg in "${@:3}"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --headless) HEADLESS=true ;;
    --videos) VIDEO_MODE="all" ;;
    --screenshots) SCREENSHOT_MODE="all" ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

check_dependencies() {
  log_step "Checking Dependencies"
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
  fi
  log_success "Node.js: $(node --version)"
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
  fi
  log_success "npm: $(npm --version)"
  
  # Check Detox CLI
  if ! command -v detox &> /dev/null; then
    log_warning "Detox CLI not found globally, using npx"
    DETOX_CMD="npx detox"
  else
    DETOX_CMD="detox"
    log_success "Detox CLI: $($DETOX_CMD --version)"
  fi
  
  # Platform-specific checks
  if [ "$PLATFORM" = "ios" ]; then
    if ! command -v xcrun &> /dev/null; then
      log_error "Xcode command line tools not installed"
      exit 1
    fi
    log_success "Xcode: $(xcodebuild -version | head -1)"
    
    if ! command -v applesimutils &> /dev/null; then
      log_error "applesimutils not installed. Run: brew tap wix/brew && brew install applesimutils"
      exit 1
    fi
    log_success "applesimutils: installed"
  fi
  
  if [ "$PLATFORM" = "android" ]; then
    if [ -z "$ANDROID_HOME" ]; then
      log_error "ANDROID_HOME environment variable not set"
      exit 1
    fi
    log_success "ANDROID_HOME: $ANDROID_HOME"
    
    if ! command -v adb &> /dev/null; then
      log_error "adb not found in PATH"
      exit 1
    fi
    log_success "adb: $(adb --version | head -1)"
  fi
}

setup_directories() {
  log_step "Setting Up Directories"
  
  mkdir -p "$ARTIFACTS_DIR"
  mkdir -p "$ARTIFACTS_DIR/videos"
  mkdir -p "$ARTIFACTS_DIR/screenshots"
  mkdir -p "$ARTIFACTS_DIR/logs"
  mkdir -p "$REPORTS_DIR"
  
  log_success "Artifacts directory: $ARTIFACTS_DIR"
  log_success "Reports directory: $REPORTS_DIR"
}

discover_tests() {
  log_step "Discovering Test Files"
  
  local test_count=$(find e2e -name "*.test.ts" -o -name "*.test.js" 2>/dev/null | wc -l | tr -d ' ')
  log_info "Found $test_count test file(s)"
  
  find e2e -name "*.test.ts" -o -name "*.test.js" 2>/dev/null | while read file; do
    echo "  📄 $file"
  done
}

build_app() {
  if [ "$SKIP_BUILD" = true ]; then
    log_warning "Skipping build step (--skip-build)"
    return 0
  fi
  
  log_step "Building Application"
  
  local config="${PLATFORM}"
  if [ "$PLATFORM" = "ios" ]; then
    config="${PLATFORM}.sim.${MODE}"
  else
    config="${PLATFORM}.emu.${MODE}"
  fi
  
  log_info "Configuration: $config"
  log_info "Running: $DETOX_CMD build --configuration $config"
  
  $DETOX_CMD build --configuration "$config" 2>&1 | tee "$ARTIFACTS_DIR/logs/build.log"
  
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log_success "Build completed successfully"
  else
    log_error "Build failed. Check $ARTIFACTS_DIR/logs/build.log"
    exit 1
  fi
}

start_device() {
  log_step "Starting Device"
  
  if [ "$PLATFORM" = "ios" ]; then
    # Boot iOS simulator
    local simulator_name=$(grep -A2 "simulator:" .detoxrc.js 2>/dev/null | grep "type:" | head -1 | sed "s/.*'\(.*\)'.*/\1/" || echo "iPhone 15")
    log_info "Booting iOS Simulator: $simulator_name"
    xcrun simctl boot "$simulator_name" 2>/dev/null || true
    log_success "iOS Simulator ready"
  else
    # Start Android emulator
    local avd_name=$(grep "avdName:" .detoxrc.js 2>/dev/null | head -1 | sed "s/.*'\(.*\)'.*/\1/" || echo "Pixel_4_API_33")
    log_info "Starting Android Emulator: $avd_name"
    
    # Check if emulator is already running
    if adb devices | grep -q "emulator"; then
      log_info "Emulator already running"
    else
      $ANDROID_HOME/emulator/emulator -avd "$avd_name" -no-snapshot-load &
      log_info "Waiting for emulator to boot..."
      adb wait-for-device
      sleep 30
    fi
    log_success "Android Emulator ready"
  fi
}

run_tests() {
  log_step "Running E2E Tests"
  
  local config="${PLATFORM}"
  if [ "$PLATFORM" = "ios" ]; then
    config="${PLATFORM}.sim.${MODE}"
  else
    config="${PLATFORM}.emu.${MODE}"
  fi
  
  local headless_flag=""
  if [ "$HEADLESS" = true ]; then
    headless_flag="--headless"
  fi
  
  log_info "Configuration: $config"
  log_info "Video recording: $VIDEO_MODE"
  log_info "Screenshots: $SCREENSHOT_MODE"
  
  local test_cmd="$DETOX_CMD test \
    --configuration $config \
    --record-videos $VIDEO_MODE \
    --take-screenshots $SCREENSHOT_MODE \
    --record-logs all \
    --artifacts-location $ARTIFACTS_DIR \
    --cleanup \
    $headless_flag"
  
  log_info "Running: $test_cmd"
  
  set +e
  $test_cmd 2>&1 | tee "$ARTIFACTS_DIR/logs/test-output.log"
  TEST_EXIT_CODE=${PIPESTATUS[0]}
  set -e
  
  return $TEST_EXIT_CODE
}

organize_artifacts() {
  log_step "Organizing Artifacts"
  
  # Move videos to dedicated folder
  find "$ARTIFACTS_DIR" -maxdepth 2 -name "*.mp4" -exec mv {} "$ARTIFACTS_DIR/videos/" \; 2>/dev/null || true
  
  # Move screenshots to dedicated folder
  find "$ARTIFACTS_DIR" -maxdepth 2 -name "*.png" -exec mv {} "$ARTIFACTS_DIR/screenshots/" \; 2>/dev/null || true
  
  # Move logs to dedicated folder
  find "$ARTIFACTS_DIR" -maxdepth 2 -name "*.log" ! -path "*/logs/*" -exec mv {} "$ARTIFACTS_DIR/logs/" \; 2>/dev/null || true
  
  # Count artifacts
  local video_count=$(find "$ARTIFACTS_DIR/videos" -name "*.mp4" 2>/dev/null | wc -l | tr -d ' ')
  local screenshot_count=$(find "$ARTIFACTS_DIR/screenshots" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
  local log_count=$(find "$ARTIFACTS_DIR/logs" -name "*.log" 2>/dev/null | wc -l | tr -d ' ')
  
  log_success "Videos: $video_count"
  log_success "Screenshots: $screenshot_count"
  log_success "Logs: $log_count"
}

generate_report() {
  log_step "Generating HTML Report"
  
  local script_dir="$(dirname "$0")"
  local report_script="$script_dir/generate-report.js"
  
  if [ -f "$report_script" ]; then
    node "$report_script" "$ARTIFACTS_DIR" "$REPORTS_DIR/report-$TIMESTAMP.html"
    log_success "Report generated: $REPORTS_DIR/report-$TIMESTAMP.html"
  else
    log_warning "Report generator script not found: $report_script"
  fi
  
  # Copy latest report
  if [ -f "$REPORTS_DIR/report-$TIMESTAMP.html" ]; then
    cp "$REPORTS_DIR/report-$TIMESTAMP.html" "$REPORTS_DIR/latest-report.html"
    log_success "Latest report: $REPORTS_DIR/latest-report.html"
  fi
}

print_summary() {
  local exit_code=$1
  
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                    TEST RUN SUMMARY                          ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  if [ $exit_code -eq 0 ]; then
    echo -e "  ${GREEN}✓ All tests passed!${NC}"
  else
    echo -e "  ${RED}✗ Some tests failed${NC}"
  fi
  
  echo ""
  echo -e "  ${BLUE}Platform:${NC}    $PLATFORM"
  echo -e "  ${BLUE}Mode:${NC}        $MODE"
  echo -e "  ${BLUE}Timestamp:${NC}   $TIMESTAMP"
  echo ""
  echo -e "  ${BLUE}Artifacts:${NC}"
  echo "    📁 $ARTIFACTS_DIR"
  echo "    📹 Videos:      $ARTIFACTS_DIR/videos/"
  echo "    📸 Screenshots: $ARTIFACTS_DIR/screenshots/"
  echo "    📋 Logs:        $ARTIFACTS_DIR/logs/"
  echo ""
  echo -e "  ${BLUE}Reports:${NC}"
  echo "    📊 HTML Report: $REPORTS_DIR/latest-report.html"
  echo ""
  
  # Open report in browser (macOS)
  if [ "$(uname)" = "Darwin" ] && [ -f "$REPORTS_DIR/latest-report.html" ]; then
    read -p "Open report in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      open "$REPORTS_DIR/latest-report.html"
    fi
  fi
}

cleanup() {
  log_info "Cleaning up..."
  # Add any cleanup tasks here
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
  echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║           MOBILE E2E TEST RUNNER                             ║${NC}"
  echo -e "${BLUE}║           Detox + Video Recording + Reports                  ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"
  
  log_info "Platform: $PLATFORM"
  log_info "Mode: $MODE"
  log_info "Timestamp: $TIMESTAMP"
  
  # Setup trap for cleanup
  trap cleanup EXIT
  
  # Run pipeline
  check_dependencies
  setup_directories
  discover_tests
  build_app
  start_device
  
  # Run tests and capture exit code
  set +e
  run_tests
  TEST_EXIT_CODE=$?
  set -e
  
  organize_artifacts
  generate_report
  print_summary $TEST_EXIT_CODE
  
  exit $TEST_EXIT_CODE
}

# Run main function
main
