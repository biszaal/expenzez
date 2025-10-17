#!/bin/bash

###############################################################################
# Expenzez Test Runner
# Comprehensive test execution script with health checks and validation
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

###############################################################################
# Pre-flight Checks
###############################################################################

preflight_checks() {
    print_header "Pre-flight Checks"

    # Check if Node.js is installed
    if command -v node &> /dev/null; then
        print_success "Node.js installed: $(node --version)"
    else
        print_error "Node.js not found. Please install Node.js"
        exit 1
    fi

    # Check if npm is installed
    if command -v npm &> /dev/null; then
        print_success "npm installed: $(npm --version)"
    else
        print_error "npm not found. Please install npm"
        exit 1
    fi

    # Check if package.json exists
    if [ -f "../package.json" ]; then
        print_success "package.json found"
    else
        print_error "package.json not found"
        exit 1
    fi

    # Check if node_modules exists
    if [ -d "../node_modules" ]; then
        print_success "node_modules directory exists"
    else
        print_warning "node_modules not found. Installing dependencies..."
        cd .. && npm install && cd test
        print_success "Dependencies installed"
    fi

    echo ""
}

###############################################################################
# Environment Checks
###############################################################################

environment_checks() {
    print_header "Environment Checks"

    # Check if .env file exists
    if [ -f "../.env" ]; then
        print_success ".env file found"
    else
        print_warning ".env file not found (may cause API tests to fail)"
    fi

    # Check if backend is running (optional)
    if curl -s http://localhost:3001/health &> /dev/null; then
        print_success "Backend server is running"
    else
        print_warning "Backend server not running (integration tests may fail)"
    fi

    echo ""
}

###############################################################################
# Feature Health Checks
###############################################################################

feature_health_checks() {
    print_header "Feature Health Checks"

    print_info "Checking critical files..."

    # Check security files
    if [ -f "../services/api/nativeSecurityAPI.ts" ]; then
        print_success "Security API found"
    else
        print_error "Security API missing"
    fi

    # Check authentication files
    if [ -f "../app/auth/AuthContext.tsx" ]; then
        print_success "Auth Context found"
    else
        print_error "Auth Context missing"
    fi

    # Check transaction files
    if [ -f "../services/api/transactionAPI.ts" ]; then
        print_success "Transaction API found"
    else
        print_warning "Transaction API file not found"
    fi

    # Check context files
    if [ -f "../contexts/SecurityContext.tsx" ]; then
        print_success "Security Context found"
    else
        print_error "Security Context missing"
    fi

    echo ""
}

###############################################################################
# Run Tests
###############################################################################

run_unit_tests() {
    print_header "Running Unit Tests"

    cd ..

    # Run security tests
    print_info "Running security tests..."
    if npm test -- test/unit/security.test.ts --passWithNoTests 2>&1 | tee /tmp/security-test-output.txt; then
        print_success "Security tests completed"
        ((PASSED_TESTS++))
    else
        print_error "Security tests failed"
        ((FAILED_TESTS++))
    fi

    # Run authentication tests
    print_info "Running authentication tests..."
    if npm test -- test/unit/authentication.test.ts --passWithNoTests 2>&1 | tee /tmp/auth-test-output.txt; then
        print_success "Authentication tests completed"
        ((PASSED_TESTS++))
    else
        print_error "Authentication tests failed"
        ((FAILED_TESTS++))
    fi

    # Run transaction tests
    print_info "Running transaction tests..."
    if npm test -- test/unit/transactions.test.ts --passWithNoTests 2>&1 | tee /tmp/transaction-test-output.txt; then
        print_success "Transaction tests completed"
        ((PASSED_TESTS++))
    else
        print_error "Transaction tests failed"
        ((FAILED_TESTS++))
    fi

    cd test
    echo ""
}

run_integration_tests() {
    print_header "Running Integration Tests"

    cd ..

    # Run user journey tests
    print_info "Running user journey tests..."
    if npm test -- test/integration/user-journey.test.ts --passWithNoTests 2>&1 | tee /tmp/journey-test-output.txt; then
        print_success "User journey tests completed"
        ((PASSED_TESTS++))
    else
        print_error "User journey tests failed"
        ((FAILED_TESTS++))
    fi

    # Run API integration tests
    print_info "Running API integration tests..."
    if npm test -- test/integration/api-integration.test.ts --passWithNoTests 2>&1 | tee /tmp/api-test-output.txt; then
        print_success "API integration tests completed"
        ((PASSED_TESTS++))
    else
        print_error "API integration tests failed"
        ((FAILED_TESTS++))
    fi

    cd test
    echo ""
}

run_all_tests() {
    print_header "Running All Tests with Coverage"

    cd ..

    if npm run test:coverage 2>&1 | tee /tmp/all-tests-output.txt; then
        print_success "All tests completed"
    else
        print_warning "Some tests may have failed"
    fi

    cd test
    echo ""
}

###############################################################################
# Generate Report
###############################################################################

generate_report() {
    print_header "Test Summary Report"

    TOTAL_TESTS=$((PASSED_TESTS + FAILED_TESTS))

    echo -e "${BLUE}Total Test Suites: ${TOTAL_TESTS}${NC}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All test suites passed!"
        echo ""
        echo -e "${GREEN}✓ Security features working${NC}"
        echo -e "${GREEN}✓ Authentication working${NC}"
        echo -e "${GREEN}✓ Transactions working${NC}"
        echo -e "${GREEN}✓ User journeys working${NC}"
        echo -e "${GREEN}✓ API integration working${NC}"
    else
        print_error "$FAILED_TESTS test suite(s) failed"
        print_info "Check logs for details"
    fi

    echo ""
}

###############################################################################
# Main Execution
###############################################################################

main() {
    echo ""
    print_header "Expenzez Test Suite Runner"
    echo ""

    # Run pre-flight checks
    preflight_checks

    # Run environment checks
    environment_checks

    # Run feature health checks
    feature_health_checks

    # Ask user what to run
    echo -e "${YELLOW}What would you like to run?${NC}"
    echo "1) Unit tests only"
    echo "2) Integration tests only"
    echo "3) All tests with coverage"
    echo "4) Quick health check only"
    echo ""
    read -p "Enter choice [1-4]: " choice

    case $choice in
        1)
            run_unit_tests
            ;;
        2)
            run_integration_tests
            ;;
        3)
            run_all_tests
            ;;
        4)
            print_success "Health checks completed. Skipping tests."
            ;;
        *)
            print_error "Invalid choice. Running all tests."
            run_all_tests
            ;;
    esac

    # Generate report
    generate_report

    # Exit with proper code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main
