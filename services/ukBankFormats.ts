/**
 * UK Bank CSV Format Definitions
 * Used for auto-detection and parsing of CSV exports from major UK banks
 */

export interface BankFormat {
  id: string;
  name: string;
  logo: string; // emoji fallback
  logoUrl?: string; // actual logo URL
  // Column mappings - possible header names
  columns: {
    date: string[];
    amount: string[];
    description: string[];
    debitColumn?: string[];
    creditColumn?: string[];
    balance?: string[];
    category?: string[];
  };
  // Format specifics
  dateFormat: string;
  amountFormat: 'signed' | 'split' | 'positive-debit';
  hasHeader: boolean;
  skipRows?: number;
  // Detection patterns
  detectPatterns: {
    headers?: string[]; // unique headers that identify this bank
    datePattern?: RegExp; // regex for date format
  };
  // Export instructions
  exportGuide: {
    appSteps?: string[];
    webSteps?: string[];
    notes?: string[];
  };
}

// Bank logo URLs using Google's favicon API (reliable, no auth required)
// Size 128 provides good quality for mobile displays
const getBankLogoUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const UK_BANK_FORMATS: Record<string, BankFormat> = {
  monzo: {
    id: 'monzo',
    name: 'Monzo',
    logo: '🟠',
    logoUrl: getBankLogoUrl('monzo.com'),
    columns: {
      date: ['Date', 'Created'],
      amount: ['Amount'],
      description: ['Description', 'Name'],
      category: ['Category'],
      balance: ['Balance'],
    },
    dateFormat: 'ISO', // 2019-02-07T09:33:50Z
    amountFormat: 'signed',
    hasHeader: true,
    detectPatterns: {
      headers: ['Transaction ID', 'Emoji'],
      datePattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    },
    exportGuide: {
      appSteps: [
        'Open Monzo app',
        'Tap the Account tab',
        'Tap the ⋯ menu (top right)',
        'Tap "Bank statements"',
        'Select date range',
        'Choose "CSV" format',
        'Tap "Export" and save file',
      ],
      notes: ['Monzo CSVs include built-in categories'],
    },
  },

  starling: {
    id: 'starling',
    name: 'Starling',
    logo: '🟣',
    logoUrl: getBankLogoUrl('starlingbank.com'),
    columns: {
      date: ['Date'],
      amount: ['Amount (GBP)', 'Amount'],
      description: ['Counter Party', 'Reference'],
      balance: ['Balance (GBP)', 'Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'signed',
    hasHeader: true,
    detectPatterns: {
      headers: ['Counter Party', 'Amount (GBP)'],
    },
    exportGuide: {
      appSteps: [
        'Open Starling app',
        'Go to Account tab',
        'Tap "Account Information"',
        'Tap "Statements"',
        'Select date range',
        'Choose CSV format',
        'Download the file',
      ],
    },
  },

  barclays: {
    id: 'barclays',
    name: 'Barclays',
    logo: '🔵',
    logoUrl: getBankLogoUrl('barclays.co.uk'),
    columns: {
      date: ['Date', 'Transaction Date'],
      amount: ['Amount'],
      description: ['Description', 'Memo'],
      debitColumn: ['Debit Amount', 'Money out'],
      creditColumn: ['Credit Amount', 'Money in'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Subcategory', 'Money out', 'Money in'],
    },
    exportGuide: {
      webSteps: [
        'Log in to Barclays Online Banking',
        'Go to your account',
        'Click "View transactions"',
        'Click "Export All" at bottom',
        'Select "CSV" format',
        'Download the file',
      ],
      notes: [
        'CSV export only available via website (not app)',
        'Limited to ~60 transactions or 6 weeks',
      ],
    },
  },

  hsbc: {
    id: 'hsbc',
    name: 'HSBC',
    logo: '🔴',
    logoUrl: getBankLogoUrl('hsbc.co.uk'),
    columns: {
      date: ['Date', 'Transaction Date'],
      amount: ['Amount'],
      description: ['Description', 'Transaction Description'],
      debitColumn: ['Paid out'],
      creditColumn: ['Paid in'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Paid out', 'Paid in'],
    },
    exportGuide: {
      webSteps: [
        'Log in to HSBC Online Banking',
        'Select your account',
        'Click "Download transactions"',
        'Choose date range',
        'Select CSV format',
        'Download',
      ],
      appSteps: [
        'Open HSBC Mobile app',
        'Tap your account',
        'Tap ⋯ menu',
        'Select "Download statement"',
        'Choose CSV and date range',
      ],
    },
  },

  lloyds: {
    id: 'lloyds',
    name: 'Lloyds',
    logo: '🟢',
    logoUrl: getBankLogoUrl('lloydsbank.com'),
    columns: {
      date: ['Transaction Date', 'Date'],
      amount: ['Debit Amount', 'Credit Amount'],
      description: ['Transaction Description', 'Description'],
      debitColumn: ['Debit Amount'],
      creditColumn: ['Credit Amount'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Transaction Type', 'Sort Code'],
    },
    exportGuide: {
      webSteps: [
        'Log in to Lloyds Internet Banking',
        'Go to your account',
        'Click "Export"',
        'Select date range',
        'Choose CSV format',
        'Download',
      ],
      notes: ['Same format applies to Halifax and Bank of Scotland'],
    },
  },

  natwest: {
    id: 'natwest',
    name: 'NatWest',
    logo: '🟣',
    logoUrl: getBankLogoUrl('natwest.com'),
    columns: {
      date: ['Date'],
      amount: ['Value'],
      description: ['Description'],
      debitColumn: ['Debit'],
      creditColumn: ['Credit'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Account Number', 'Value'],
    },
    exportGuide: {
      webSteps: [
        'Log in to NatWest Online Banking',
        'Select your account',
        'Click "Download/export"',
        'Choose date range',
        'Select CSV format',
        'Download',
      ],
      notes: ['Same format applies to RBS'],
    },
  },

  santander: {
    id: 'santander',
    name: 'Santander',
    logo: '🔴',
    logoUrl: getBankLogoUrl('santander.co.uk'),
    columns: {
      date: ['Date', 'Transaction Date'],
      amount: ['Amount'],
      description: ['Description'],
      debitColumn: ['Money Out', 'Debit'],
      creditColumn: ['Money In', 'Credit'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Money In', 'Money Out'],
    },
    exportGuide: {
      webSteps: [
        'Log in to Santander Online Banking',
        'Go to your account',
        'Click "Download transactions"',
        'Select date range and CSV format',
        'Download',
      ],
    },
  },

  nationwide: {
    id: 'nationwide',
    name: 'Nationwide',
    logo: '🔵',
    logoUrl: getBankLogoUrl('nationwide.co.uk'),
    columns: {
      date: ['Date'],
      amount: ['Paid out', 'Paid in'],
      description: ['Description', 'Transactions'],
      debitColumn: ['Paid out'],
      creditColumn: ['Paid in'],
      balance: ['Balance'],
    },
    dateFormat: 'DD MMM YYYY', // 01 Jan 2024
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Paid out', 'Paid in', 'Transactions'],
    },
    exportGuide: {
      webSteps: [
        'Log in to Nationwide Internet Banking',
        'Select your account',
        'Click "Download transactions"',
        'Choose date range',
        'Select CSV',
        'Download',
      ],
    },
  },

  halifax: {
    id: 'halifax',
    name: 'Halifax',
    logo: '🔵',
    logoUrl: getBankLogoUrl('halifax.co.uk'),
    columns: {
      date: ['Transaction Date', 'Date'],
      amount: ['Debit Amount', 'Credit Amount'],
      description: ['Transaction Description', 'Description'],
      debitColumn: ['Debit Amount'],
      creditColumn: ['Credit Amount'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Transaction Type', 'Account Number'],
    },
    exportGuide: {
      webSteps: [
        'Log in to Halifax Internet Banking',
        'Go to your account',
        'Click "Export"',
        'Select date range',
        'Choose CSV format',
        'Download',
      ],
      notes: ['Uses same format as Lloyds'],
    },
  },

  tsb: {
    id: 'tsb',
    name: 'TSB',
    logo: '🔵',
    logoUrl: getBankLogoUrl('tsb.co.uk'),
    columns: {
      date: ['Date', 'Transaction Date'],
      amount: ['Amount'],
      description: ['Description'],
      debitColumn: ['Debit'],
      creditColumn: ['Credit'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'split',
    hasHeader: true,
    detectPatterns: {
      headers: ['Sort Code', 'Account Number'],
    },
    exportGuide: {
      webSteps: [
        'Log in to TSB Internet Banking',
        'Select your account',
        'Click "Download transactions"',
        'Choose date range and CSV',
        'Download',
      ],
    },
  },

  revolut: {
    id: 'revolut',
    name: 'Revolut',
    logo: '🟣',
    logoUrl: getBankLogoUrl('revolut.com'),
    columns: {
      date: ['Completed Date', 'Started Date'],
      amount: ['Amount'],
      description: ['Description'],
      balance: ['Balance'],
    },
    dateFormat: 'DD/MM/YYYY', // or YYYY-MM-DD depending on version
    amountFormat: 'signed',
    hasHeader: true,
    detectPatterns: {
      headers: ['Completed Date', 'Product', 'Started Date'],
    },
    exportGuide: {
      appSteps: [
        'Open Revolut app',
        'Tap the account/wallet',
        'Tap ⋯ menu',
        'Tap "Statements"',
        'Select date range',
        'Choose "Excel" (CSV compatible)',
        'Download',
      ],
      notes: ['Revolut exports may use Excel format but import as CSV'],
    },
  },

  chase: {
    id: 'chase',
    name: 'Chase UK',
    logo: '🔵',
    logoUrl: getBankLogoUrl('chase.co.uk'),
    columns: {
      // Chase UK CSV format: Date, Time, Transaction Type, Transaction Description, Amount, Currency, Balance
      date: ['Date', 'Transaction Date', 'Trans. Date', 'Trans Date', 'Posting Date', 'Post Date'],
      amount: ['Amount', 'Transaction Amount', 'Value'],
      description: ['Transaction Description', 'Description', 'Merchant', 'Details', 'Narrative'],
      category: ['Transaction Type', 'Category', 'Type'],
      balance: ['Balance', 'Running Balance'],
    },
    dateFormat: 'DD MMM YYYY', // Chase UK uses "24 Sep 2025" format
    amountFormat: 'signed',
    hasHeader: true,
    skipRows: 1, // Chase UK CSV has a title row before headers: "Transactions for period..."
    detectPatterns: {
      // Detect Chase UK by looking for their unique patterns
      headers: ['Transaction Description', 'Transaction Type', 'Transactions for period'],
    },
    exportGuide: {
      appSteps: [
        'Open Chase UK app',
        'Tap your account',
        'Tap ⋯ menu',
        'Select "Export transactions"',
        'Choose date range',
        'Select CSV format',
        'Download',
      ],
    },
  },

  // Generic fallback format for unrecognized banks
  generic: {
    id: 'generic',
    name: 'Other Bank',
    logo: '🏦',
    columns: {
      date: ['Date', 'Transaction Date', 'Trans Date', 'Trans. Date', 'Posting Date', 'Post Date', 'Value Date', 'Txn Date'],
      amount: ['Amount', 'Value', 'Sum', 'Total', 'Debit', 'Credit', 'Transaction Amount', 'Amt', 'Money Out', 'Money In', 'Paid Out', 'Paid In', 'Withdrawal', 'Deposit'],
      description: ['Description', 'Details', 'Narrative', 'Reference', 'Memo', 'Transaction', 'Particulars', 'Name', 'Payee', 'Merchant', 'Counter Party', 'Counterparty', 'Transaction Description', 'Trans Description'],
      debitColumn: ['Debit', 'Money Out', 'Paid Out', 'Withdrawal', 'Debit Amount', 'Out'],
      creditColumn: ['Credit', 'Money In', 'Paid In', 'Deposit', 'Credit Amount', 'In'],
      category: ['Category', 'Type', 'Class', 'Transaction Type'],
      balance: ['Balance', 'Running Balance', 'Account Balance', 'Available Balance'],
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'signed',
    hasHeader: true,
    detectPatterns: {},
    exportGuide: {
      webSteps: [
        'Log in to your bank\'s website or app',
        'Navigate to your account transactions',
        'Look for "Export" or "Download" option',
        'Select CSV format',
        'Choose date range and download',
      ],
    },
  },
};

/**
 * Get list of all supported banks for UI display
 */
export const getSupportedBanks = (): BankFormat[] => {
  return Object.values(UK_BANK_FORMATS);
};

/**
 * Get bank format by ID
 */
export const getBankFormat = (bankId: string): BankFormat | null => {
  return UK_BANK_FORMATS[bankId] || null;
};

/**
 * Detect which bank a CSV file is from based on headers
 */
export const detectBankFromCSV = (csvText: string): BankFormat | null => {
  const lines = csvText.split('\n');
  if (lines.length === 0) return null;

  // Check first few lines for patterns (some banks have title rows before headers)
  const linesToCheck = lines.slice(0, Math.min(3, lines.length)).map(l => l.toLowerCase());
  const combinedLines = linesToCheck.join(' ');

  for (const bank of Object.values(UK_BANK_FORMATS)) {
    // Skip generic format in detection
    if (bank.id === 'generic') continue;

    // Check for unique header patterns across first few lines
    if (bank.detectPatterns.headers) {
      const matchCount = bank.detectPatterns.headers.filter((h) =>
        combinedLines.includes(h.toLowerCase())
      ).length;

      // If majority of unique headers match, it's likely this bank
      if (matchCount >= Math.ceil(bank.detectPatterns.headers.length / 2)) {
        console.log(`[BankDetect] Detected ${bank.name} with ${matchCount} pattern matches`);
        return bank;
      }
    }

    // Check date pattern in data rows
    if (bank.detectPatterns.datePattern) {
      const dataStartIdx = bank.skipRows ? bank.skipRows + 1 : 1;
      const dataLine = lines[dataStartIdx] || '';
      const dateMatch = dataLine.match(bank.detectPatterns.datePattern);
      if (dateMatch) {
        console.log(`[BankDetect] Detected ${bank.name} by date pattern`);
        return bank;
      }
    }
  }

  return null;
};

/**
 * Parse date based on bank format
 */
export const parseBankDate = (
  dateStr: string,
  format: string
): Date | null => {
  try {
    if (format === 'ISO') {
      return new Date(dateStr);
    }

    // Handle DD/MM/YYYY
    if (format === 'DD/MM/YYYY') {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
      }
    }

    // Handle DD MMM YYYY (e.g., 01 Jan 2024)
    if (format === 'DD MMM YYYY') {
      return new Date(dateStr);
    }

    return new Date(dateStr);
  } catch {
    return null;
  }
};

/**
 * Parse amount based on bank format (handles split debit/credit columns)
 */
export const parseBankAmount = (
  row: Record<string, string>,
  bank: BankFormat
): number | null => {
  try {
    if (bank.amountFormat === 'signed') {
      // Single signed amount column
      for (const col of bank.columns.amount) {
        if (row[col] !== undefined && row[col] !== '') {
          const amount = parseFloat(row[col].replace(/[£,]/g, ''));
          return isNaN(amount) ? null : amount;
        }
      }
    } else if (bank.amountFormat === 'split') {
      // Separate debit/credit columns
      let debit = 0;
      let credit = 0;

      if (bank.columns.debitColumn) {
        for (const col of bank.columns.debitColumn) {
          if (row[col] !== undefined && row[col] !== '') {
            debit = parseFloat(row[col].replace(/[£,]/g, '')) || 0;
            break;
          }
        }
      }

      if (bank.columns.creditColumn) {
        for (const col of bank.columns.creditColumn) {
          if (row[col] !== undefined && row[col] !== '') {
            credit = parseFloat(row[col].replace(/[£,]/g, '')) || 0;
            break;
          }
        }
      }

      // Return negative for debits, positive for credits
      if (debit > 0) return -debit;
      if (credit > 0) return credit;
      return 0;
    }

    return null;
  } catch {
    return null;
  }
};
