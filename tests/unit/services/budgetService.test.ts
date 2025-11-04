import { BudgetService, Budget, BudgetProgress } from '@/services/budgetService';

// Mock the API modules
jest.mock('@/services/api', () => ({
  budgetAPI: {
    getBudgetPreferences: jest.fn(),
  },
  transactionAPI: {
    getTransactions: jest.fn(),
  },
  expenseAPI: {},
}));

describe('BudgetService', () => {
  describe('createBudget', () => {
    it('should create a budget with generated ID and timestamps', async () => {
      const budgetData = {
        name: 'Food Budget',
        category: 'Food & Dining',
        amount: 500,
        period: 'monthly' as const,
        isActive: true,
        alertThreshold: 80,
      };

      const budget = await BudgetService.createBudget(budgetData);

      expect(budget).toMatchObject({
        name: 'Food Budget',
        category: 'Food & Dining',
        amount: 500,
        period: 'monthly',
        isActive: true,
        alertThreshold: 80,
        currentSpent: 0,
      });
      expect(budget.id).toMatch(/^budget_/);
      expect(budget.createdAt).toBeDefined();
      expect(budget.updatedAt).toBeDefined();
    });

    it('should set currentSpent to 0 for new budgets', async () => {
      const budgetData = {
        name: 'Shopping Budget',
        category: 'Shopping',
        amount: 300,
        period: 'monthly' as const,
        isActive: true,
        alertThreshold: 75,
      };

      const budget = await BudgetService.createBudget(budgetData);

      expect(budget.currentSpent).toBe(0);
    });
  });

  describe('calculateBudgetProgress', () => {
    const createTestBudget = (overrides: Partial<Budget> = {}): Budget => ({
      id: 'budget_test_123',
      name: 'Test Budget',
      category: 'Food & Dining',
      amount: 1000,
      period: 'monthly',
      currentSpent: 0,
      isActive: true,
      alertThreshold: 80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    });

    it('should calculate correct percentage for budget within limit', async () => {
      const budget = createTestBudget({ currentSpent: 500 });

      const progress = await BudgetService.calculateBudgetProgress(budget);

      expect(progress.spent).toBe(500);
      expect(progress.remaining).toBe(500);
      expect(progress.percentage).toBe(50);
      expect(progress.isOver).toBe(false);
      expect(progress.status).toBe('on_track');
    });

    it('should detect over-budget scenarios', async () => {
      const budget = createTestBudget({ currentSpent: 1200 });

      const progress = await BudgetService.calculateBudgetProgress(budget);

      expect(progress.spent).toBe(1200);
      expect(progress.remaining).toBe(0); // Remaining is clamped to 0 when over budget
      expect(progress.percentage).toBe(120);
      expect(progress.isOver).toBe(true);
      expect(progress.status).toBe('danger');
    });

    it('should show warning status when threshold is exceeded', async () => {
      const budget = createTestBudget({
        currentSpent: 850,
        alertThreshold: 80
      });

      const progress = await BudgetService.calculateBudgetProgress(budget);

      expect(progress.percentage).toBe(85);
      expect(progress.isOver).toBe(false);
      expect(progress.status).toBe('warning');
    });

    it('should handle zero spending correctly', async () => {
      const budget = createTestBudget({ currentSpent: 0 });

      const progress = await BudgetService.calculateBudgetProgress(budget);

      expect(progress.spent).toBe(0);
      expect(progress.remaining).toBe(1000);
      expect(progress.percentage).toBe(0);
      expect(progress.isOver).toBe(false);
      expect(progress.status).toBe('on_track');
    });

    it('should calculate days left correctly for monthly budget', async () => {
      const budget = createTestBudget({
        currentSpent: 500,
        period: 'monthly'
      });

      const progress = await BudgetService.calculateBudgetProgress(budget);

      expect(progress.daysLeft).toBeGreaterThanOrEqual(0);
      expect(progress.daysLeft).toBeLessThanOrEqual(31);
    });

    it('should calculate daily budget based on remaining amount', async () => {
      const budget = createTestBudget({
        currentSpent: 300,
        amount: 1000
      });

      const progress = await BudgetService.calculateBudgetProgress(budget);

      // Daily budget should be (remaining / daysLeft)
      const expectedDailyBudget = progress.daysLeft > 0
        ? 700 / progress.daysLeft
        : 0;

      expect(progress.dailyBudget).toBeCloseTo(expectedDailyBudget, 2);
    });

    it('should handle budget with undefined values', async () => {
      // Pass a budget with some undefined values
      const partialBudget = createTestBudget({
        currentSpent: undefined as any,
      });

      const progress = await BudgetService.calculateBudgetProgress(partialBudget);

      // Should handle undefined currentSpent gracefully
      expect(progress.spent).toBe(0);
      expect(progress.remaining).toBeGreaterThan(0);
      expect(progress.isOver).toBe(false);
      expect(progress.status).toBe('on_track');
    });
  });

  describe('calculateSpendingByCategory', () => {
    it('should correctly sum spending by category', () => {
      const transactions = [
        { category: 'Food & Dining', amount: -50, type: 'debit' },
        { category: 'Food & Dining', amount: -30, type: 'debit' },
        { category: 'Transportation', amount: -20, type: 'debit' },
        { category: 'Shopping', amount: -100, type: 'debit' },
      ];

      const result = BudgetService.calculateSpendingByCategory(transactions);

      expect(result['Food & Dining']).toBe(80);
      expect(result['Transportation']).toBe(20);
      expect(result['Shopping']).toBe(100);
    });

    it('should ignore credit transactions', () => {
      const transactions = [
        { category: 'Food & Dining', amount: -50, type: 'debit' },
        { category: 'Income', amount: 1000, type: 'credit' },
      ];

      const result = BudgetService.calculateSpendingByCategory(transactions);

      expect(result['Food & Dining']).toBe(50);
      expect(result['Income']).toBeUndefined();
    });

    it('should handle empty transaction list', () => {
      const transactions: any[] = [];

      const result = BudgetService.calculateSpendingByCategory(transactions);

      expect(result).toEqual({});
    });

    it('should handle uncategorized transactions', () => {
      const transactions = [
        { category: 'Uncategorized', amount: -25, type: 'debit' },
        { category: null, amount: -15, type: 'debit' },
        { category: '', amount: -10, type: 'debit' },
      ];

      const result = BudgetService.calculateSpendingByCategory(transactions);

      expect(result['Uncategorized']).toBe(50);
    });
  });

  describe('getSuggestedBudgets', () => {
    it('should return an array of suggested budgets', async () => {
      const suggestions = await BudgetService.getSuggestedBudgets();

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include common budget categories', async () => {
      const suggestions = await BudgetService.getSuggestedBudgets();

      const categories = suggestions.map(s => s.category);

      expect(categories).toContain('Food & Dining');
      expect(categories).toContain('Transportation');
      expect(categories).toContain('Shopping');
    });

    it('should set all suggestions as monthly by default', async () => {
      const suggestions = await BudgetService.getSuggestedBudgets();

      suggestions.forEach(suggestion => {
        expect(suggestion.period).toBe('monthly');
      });
    });

    it('should set reasonable default alert thresholds', async () => {
      const suggestions = await BudgetService.getSuggestedBudgets();

      suggestions.forEach(suggestion => {
        expect(suggestion.alertThreshold).toBeGreaterThanOrEqual(70);
        expect(suggestion.alertThreshold).toBeLessThanOrEqual(90);
      });
    });
  });
});
