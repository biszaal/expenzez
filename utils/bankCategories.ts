export type BankCategory = 
  | 'personal' 
  | 'business' 
  | 'commercial' 
  | 'credit-cards' 
  | 'digital' 
  | 'wealth' 
  | 'general';

export interface BankCategoryInfo {
  id: BankCategory;
  name: string;
  icon: string;
  description: string;
  priority: number; // Lower numbers appear first
}

export const BANK_CATEGORIES: Record<BankCategory, BankCategoryInfo> = {
  personal: {
    id: 'personal',
    name: 'Personal Banking',
    icon: '🏦',
    description: 'Personal current accounts and savings',
    priority: 1
  },
  business: {
    id: 'business',
    name: 'Business Banking',
    icon: '🏢',
    description: 'Small business and commercial accounts',
    priority: 2
  },
  digital: {
    id: 'digital',
    name: 'Digital Banks',
    icon: '📱',
    description: 'Modern app-first banking',
    priority: 3
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial & Corporate',
    icon: '🏛️',
    description: 'Large business and corporate banking',
    priority: 4
  },
  'credit-cards': {
    id: 'credit-cards',
    name: 'Credit Cards',
    icon: '💳',
    description: 'Credit cards and store cards',
    priority: 5
  },
  wealth: {
    id: 'wealth',
    name: 'Wealth Management',
    icon: '💰',
    description: 'Private banking and investments',
    priority: 6
  },
  general: {
    id: 'general',
    name: 'General Banking',
    icon: '🏦',
    description: 'Mixed banking services',
    priority: 7
  }
};

// Digital banks that should be categorized as 'digital' regardless of name
const DIGITAL_BANKS = [
  'monzo',
  'revolut', 
  'starling',
  'n26',
  'chase', // Chase UK is digital-first
  'first direct',
  'mettle'
];

/**
 * Categorizes a bank based on its name and ID
 */
export function categorizeBank(bankName: string, bankId?: string): BankCategory {
  const name = bankName.toLowerCase();
  const id = (bankId || '').toLowerCase();
  
  // Check for digital banks first (highest priority)
  if (DIGITAL_BANKS.some(digital => name.includes(digital) || id.includes(digital))) {
    return 'digital';
  }
  
  // Check for specific category keywords in name
  if (name.includes('personal')) {
    return 'personal';
  }
  
  if (name.includes('business')) {
    return 'business';
  }
  
  if (name.includes('commercial') || name.includes('corporate')) {
    return 'commercial';
  }
  
  if (name.includes('wealth') || name.includes('private')) {
    return 'wealth';
  }
  
  // Credit cards and store cards
  if (
    name.includes('card') || 
    name.includes('credit') ||
    name.includes('american express') ||
    name.includes('barclaycard') ||
    name.includes('newday') ||
    name.includes('mbna')
  ) {
    return 'credit-cards';
  }
  
  // Default to general
  return 'general';
}

/**
 * Groups banks by category and sorts categories by priority
 */
export function groupBanksByCategory<T extends { name: string; id?: string }>(
  banks: T[]
): Record<BankCategory, T[]> {
  const grouped: Record<BankCategory, T[]> = {
    personal: [],
    business: [],
    commercial: [],
    'credit-cards': [],
    digital: [],
    wealth: [],
    general: []
  };
  
  banks.forEach(bank => {
    const category = categorizeBank(bank.name, bank.id);
    grouped[category].push(bank);
  });
  
  // Sort banks within each category alphabetically
  Object.keys(grouped).forEach(category => {
    grouped[category as BankCategory].sort((a, b) => a.name.localeCompare(b.name));
  });
  
  return grouped;
}

/**
 * Gets sorted categories (non-empty only)
 */
export function getSortedCategories<T extends { name: string; id?: string }>(
  groupedBanks: Record<BankCategory, T[]>
): BankCategoryInfo[] {
  return Object.values(BANK_CATEGORIES)
    .filter(category => groupedBanks[category.id].length > 0)
    .sort((a, b) => a.priority - b.priority);
}