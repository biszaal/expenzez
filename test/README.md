# Expenzez Test Suite

Comprehensive testing suite for the Expenzez mobile application covering unit tests, integration tests, and end-to-end tests.

## 📁 Test Structure

```
test/
├── unit/                      # Unit tests for individual components
│   ├── security.test.ts       # Security feature tests (PIN, biometric, sync)
│   ├── authentication.test.ts # Auth tests (login, register, verification)
│   └── transactions.test.ts   # Transaction management tests
├── integration/               # Integration tests for workflows
│   ├── user-journey.test.ts   # Complete user journeys
│   └── api-integration.test.ts # API endpoint tests
├── e2e/                       # End-to-end tests (future)
├── jest.config.js            # Jest configuration
├── setup.ts                  # Test environment setup
└── README.md                 # This file
```

## 🧪 Test Coverage

### Unit Tests

1. **Security Tests** (`unit/security.test.ts`)
   - PIN setup and validation
   - Cross-device PIN synchronization
   - Biometric authentication
   - Session management

2. **Authentication Tests** (`unit/authentication.test.ts`)
   - User registration
   - Login/logout
   - Email verification
   - Token management

3. **Transaction Tests** (`unit/transactions.test.ts`)
   - Manual transaction entry
   - CSV import
   - Transaction history filtering
   - Transaction editing and deletion

### Integration Tests

1. **User Journey Tests** (`integration/user-journey.test.ts`)
   - New user onboarding flow
   - Returning user login
   - Cross-device login and PIN sync
   - Complete transaction workflow
   - AI assistant interaction
   - Budget management
   - Profile updates
   - Notification management

2. **API Integration Tests** (`integration/api-integration.test.ts`)
   - Authentication endpoints
   - Security API endpoints
   - Transaction CRUD operations
   - Profile management
   - Notification API
   - AI assistant API
   - Error handling

## 🚀 Running Tests

### Install Dependencies

```bash
# Install Jest and testing libraries
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
```

### Run All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- test/unit/security.test.ts

# Run tests matching pattern
npm test -- --testPathPattern=integration
```

### Test Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "test": "jest --config=test/jest.config.js",
    "test:coverage": "jest --config=test/jest.config.js --coverage",
    "test:watch": "jest --config=test/jest.config.js --watch",
    "test:unit": "jest --config=test/jest.config.js --testPathPattern=unit",
    "test:integration": "jest --config=test/jest.config.js --testPathPattern=integration"
  }
}
```

## 📊 Coverage Goals

- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

- **Preset**: `jest-expo` for React Native testing
- **Test Environment**: Node.js
- **Test Timeout**: 30 seconds
- **Transform Ignore Patterns**: Configured for React Native modules
- **Module Name Mapper**: Path aliases for imports

### Test Setup (`setup.ts`)

Mocks for:
- AsyncStorage
- SecureStore
- expo-crypto
- expo-local-authentication
- React Native Animated
- Reanimated
- Device Manager
- API Client

## 📝 Writing Tests

### Unit Test Example

```typescript
describe('Feature Name', () => {
  test('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Integration Test Example

```typescript
describe('User Flow', () => {
  test('should complete user registration', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test@1234',
    };

    const result = await registerUser(userData);
    expect(result.success).toBe(true);
  });
});
```

## 🐛 Debugging Tests

### Run Single Test

```bash
npm test -- -t "should validate PIN format"
```

### View Test Output

```bash
npm test -- --verbose
```

### Debug in VS Code

Add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--config=test/jest.config.js",
    "--runInBand",
    "--no-cache"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## ✅ Test Checklist

Before deploying to production:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code coverage meets threshold (50%)
- [ ] No console errors or warnings
- [ ] API endpoints tested
- [ ] Security features tested
- [ ] Cross-device functionality tested
- [ ] Error handling tested

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new features:

1. Write unit tests for individual functions
2. Write integration tests for user workflows
3. Ensure all tests pass before committing
4. Update this README if adding new test categories

## 📞 Support

For issues or questions about tests:
- Create an issue in the GitHub repository
- Contact the development team

---

**Last Updated**: 2025-01-17
**Test Framework**: Jest with expo-jest preset
**Coverage Tool**: Istanbul (via Jest)
