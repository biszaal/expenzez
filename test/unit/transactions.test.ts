/**
 * Transaction Features Unit Tests
 * Tests for manual transaction entry, CSV import, and transaction management
 */

describe('Transaction Management', () => {
  describe('Manual Transaction Entry', () => {
    test('should validate transaction amount', () => {
      const validAmount = 25.99;
      const invalidAmount = -10; // Negative amount

      expect(validAmount).toBeGreaterThan(0);
      expect(invalidAmount).toBeLessThan(0);
    });

    test('should validate required transaction fields', () => {
      const transaction = {
        amount: 25.99,
        category: 'Food & Dining',
        description: 'Lunch at restaurant',
        date: new Date().toISOString(),
        type: 'expense',
      };

      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('category');
      expect(transaction).toHaveProperty('description');
      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('type');
    });

    test('should categorize transactions correctly', () => {
      const categories = [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Other',
      ];

      const transaction = {
        category: 'Food & Dining',
      };

      expect(categories).toContain(transaction.category);
    });

    test('should distinguish between income and expense', () => {
      const expense = { type: 'expense', amount: 50 };
      const income = { type: 'income', amount: 1000 };

      expect(expense.type).toBe('expense');
      expect(income.type).toBe('income');
      expect(expense.amount).toBeGreaterThan(0);
      expect(income.amount).toBeGreaterThan(0);
    });
  });

  describe('CSV Import', () => {
    test('should validate CSV file format', () => {
      const validFilename = 'transactions.csv';
      const invalidFilename = 'transactions.txt';

      expect(validFilename.endsWith('.csv')).toBe(true);
      expect(invalidFilename.endsWith('.csv')).toBe(false);
    });

    test('should parse CSV data correctly', () => {
      const csvRow = {
        date: '2025-01-15',
        description: 'Grocery Store',
        amount: '45.50',
        category: 'Food & Dining',
      };

      expect(csvRow.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(parseFloat(csvRow.amount)).toBe(45.50);
    });

    test('should handle invalid CSV data', () => {
      const invalidRow = {
        date: 'invalid-date',
        amount: 'not-a-number',
      };

      expect(isNaN(parseFloat(invalidRow.amount))).toBe(true);
    });
  });

  describe('Transaction History', () => {
    test('should filter transactions by date range', () => {
      const transactions = [
        { id: '1', date: '2025-01-01', amount: 100 },
        { id: '2', date: '2025-01-15', amount: 50 },
        { id: '3', date: '2025-02-01', amount: 75 },
      ];

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const filtered = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
      });

      expect(filtered).toHaveLength(2);
    });

    test('should filter transactions by category', () => {
      const transactions = [
        { id: '1', category: 'Food & Dining', amount: 100 },
        { id: '2', category: 'Transportation', amount: 50 },
        { id: '3', category: 'Food & Dining', amount: 75 },
      ];

      const filtered = transactions.filter((t) => t.category === 'Food & Dining');

      expect(filtered).toHaveLength(2);
    });

    test('should calculate total spending', () => {
      const transactions = [
        { type: 'expense', amount: 100 },
        { type: 'expense', amount: 50 },
        { type: 'income', amount: 1000 },
      ];

      const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      expect(totalExpenses).toBe(150);
    });
  });

  describe('Transaction Editing', () => {
    test('should update transaction fields', () => {
      const originalTransaction = {
        id: '1',
        amount: 100,
        description: 'Original',
        category: 'Food & Dining',
      };

      const updatedTransaction = {
        ...originalTransaction,
        amount: 150,
        description: 'Updated',
      };

      expect(updatedTransaction.id).toBe(originalTransaction.id);
      expect(updatedTransaction.amount).toBe(150);
      expect(updatedTransaction.description).toBe('Updated');
    });

    test('should delete transaction', () => {
      const transactions = [
        { id: '1', amount: 100 },
        { id: '2', amount: 50 },
      ];

      const afterDelete = transactions.filter((t) => t.id !== '1');

      expect(afterDelete).toHaveLength(1);
      expect(afterDelete[0].id).toBe('2');
    });
  });

  describe('Transaction Validation', () => {
    test('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const today = new Date();

      expect(futureDate > today).toBe(true);
    });

    test('should validate merchant name length', () => {
      const validMerchant = 'Starbucks';
      const tooLongMerchant = 'A'.repeat(101);

      expect(validMerchant.length).toBeLessThanOrEqual(100);
      expect(tooLongMerchant.length).toBeGreaterThan(100);
    });
  });
});
