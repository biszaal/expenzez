import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for merchant information
export interface MerchantInfo {
  name: string;
  logo: string;
  domain?: string;
  category?: string;
  color?: string;
}

// Merchant logo mappings based on the screenshots
const MERCHANT_LOGOS: Record<string, MerchantInfo> = {
  // Mobile/Telecoms
  'three': {
    name: 'Three',
    logo: '📱',
    domain: 'three.co.uk',
    category: 'telecoms',
    color: '#333333'
  },
  'o2': {
    name: 'O2',
    logo: '📱',
    domain: 'o2.co.uk',
    category: 'telecoms',
    color: '#0019A5'
  },
  'ee': {
    name: 'EE',
    logo: '📱',
    domain: 'ee.co.uk',
    category: 'telecoms',
    color: '#FFB900'
  },
  'vodafone': {
    name: 'Vodafone',
    logo: '📱',
    domain: 'vodafone.co.uk',
    category: 'telecoms',
    color: '#E60000'
  },

  // Shopping/Retail
  'aliexpress': {
    name: 'AliExpress',
    logo: '🛒',
    domain: 'aliexpress.com',
    category: 'shopping',
    color: '#FF6A00'
  },
  'ali express': {
    name: 'AliExpress',
    logo: '🛒',
    domain: 'aliexpress.com',
    category: 'shopping',
    color: '#FF6A00'
  },
  'ebay': {
    name: 'eBay',
    logo: '🏪',
    domain: 'ebay.co.uk',
    category: 'shopping',
    color: '#0064D2'
  },
  'amazon': {
    name: 'Amazon',
    logo: '📦',
    domain: 'amazon.co.uk',
    category: 'shopping',
    color: '#FF9900'
  },
  'home bargains': {
    name: 'Home Bargains',
    logo: '🏠',
    domain: 'homebargains.co.uk',
    category: 'shopping',
    color: '#E31837'
  },
  'tesco': {
    name: 'Tesco',
    logo: '🛒',
    domain: 'tesco.com',
    category: 'shopping',
    color: '#00539F'
  },
  'asda': {
    name: 'ASDA',
    logo: '🛒',
    domain: 'asda.com',
    category: 'shopping',
    color: '#63B74C'
  },
  'sainsburys': {
    name: "Sainsbury's",
    logo: '🛒',
    domain: 'sainsburys.co.uk',
    category: 'shopping',
    color: '#EC8500'
  },
  'morrisons': {
    name: 'Morrisons',
    logo: '🛒',
    domain: 'morrisons.com',
    category: 'shopping',
    color: '#0B6838'
  },

  // Food & Dining
  'greggs': {
    name: 'Greggs',
    logo: '🥖',
    domain: 'greggs.co.uk',
    category: 'food',
    color: '#00A0E4'
  },
  'mcdonalds': {
    name: "McDonald's",
    logo: '🍟',
    domain: 'mcdonalds.com',
    category: 'food',
    color: '#FFC72C'
  },
  'kfc': {
    name: 'KFC',
    logo: '🍗',
    domain: 'kfc.co.uk',
    category: 'food',
    color: '#F40027'
  },
  'subway': {
    name: 'Subway',
    logo: '🥪',
    domain: 'subway.com',
    category: 'food',
    color: '#009639'
  },
  'dominos': {
    name: "Domino's",
    logo: '🍕',
    domain: 'dominos.co.uk',
    category: 'food',
    color: '#E31837'
  },
  'pizza hut': {
    name: 'Pizza Hut',
    logo: '🍕',
    domain: 'pizzahut.co.uk',
    category: 'food',
    color: '#FF0000'
  },
  'costa': {
    name: 'Costa Coffee',
    logo: '☕',
    domain: 'costa.co.uk',
    category: 'food',
    color: '#8B2635'
  },
  'starbucks': {
    name: 'Starbucks',
    logo: '☕',
    domain: 'starbucks.com',
    category: 'food',
    color: '#00704A'
  },

  // Banking/Finance
  'revolut': {
    name: 'Revolut',
    logo: '💳',
    domain: 'revolut.com',
    category: 'finance',
    color: '#0075EB'
  },
  'monzo': {
    name: 'Monzo',
    logo: '💳',
    domain: 'monzo.com',
    category: 'finance',
    color: '#FF6B83'
  },
  'starling': {
    name: 'Starling Bank',
    logo: '💳',
    domain: 'starlingbank.com',
    category: 'finance',
    color: '#6C2C91'
  },
  'natwest': {
    name: 'NatWest',
    logo: '🏦',
    domain: 'natwest.com',
    category: 'finance',
    color: '#5A287A'
  },
  'barclays': {
    name: 'Barclays',
    logo: '🏦',
    domain: 'barclays.co.uk',
    category: 'finance',
    color: '#00AEEF'
  },
  'lloyds': {
    name: 'Lloyds',
    logo: '🏦',
    domain: 'lloydsbank.com',
    category: 'finance',
    color: '#006837'
  },
  'halifax': {
    name: 'Halifax',
    logo: '🏦',
    domain: 'halifax.co.uk',
    category: 'finance',
    color: '#0F4C81'
  },
  'santander': {
    name: 'Santander',
    logo: '🏦',
    domain: 'santander.co.uk',
    category: 'finance',
    color: '#EC0000'
  },

  // Transport
  'uber': {
    name: 'Uber',
    logo: '🚗',
    domain: 'uber.com',
    category: 'transport',
    color: '#000000'
  },
  'tfl': {
    name: 'TfL',
    logo: '🚇',
    domain: 'tfl.gov.uk',
    category: 'transport',
    color: '#003688'
  },
  'national rail': {
    name: 'National Rail',
    logo: '🚂',
    domain: 'nationalrail.co.uk',
    category: 'transport',
    color: '#004225'
  },

  // Utilities
  'british gas': {
    name: 'British Gas',
    logo: '🔥',
    domain: 'britishgas.co.uk',
    category: 'utilities',
    color: '#003087'
  },
  'eon': {
    name: 'E.ON',
    logo: '⚡',
    domain: 'eonenergy.com',
    category: 'utilities',
    color: '#E20613'
  },
  'edf': {
    name: 'EDF Energy',
    logo: '⚡',
    domain: 'edfenergy.com',
    category: 'utilities',
    color: '#FF6600'
  },

  // Investment/Trading
  'trading 212': {
    name: 'Trading 212',
    logo: '📊',
    domain: 'trading212.com',
    category: 'finance',
    color: '#55acee'
  },

  // Food & Services
  'my ithaas limited': {
    name: 'MY Ithaas Limited',
    logo: '🍽️',
    category: 'food',
    color: '#8B4513'
  },
  'motor fuel group': {
    name: 'Motor Fuel Group',
    logo: '⛽',
    category: 'transport',
    color: '#FF6B35'
  },
  'tesco petrol': {
    name: 'Tesco Petrol',
    logo: '⛽',
    domain: 'tesco.com',
    category: 'transport',
    color: '#00539F'
  },
  'shell': {
    name: 'Shell',
    logo: '⛽',
    domain: 'shell.co.uk',
    category: 'transport',
    color: '#FFD500'
  },
  'bp': {
    name: 'BP',
    logo: '⛽',
    domain: 'bp.com',
    category: 'transport',
    color: '#009900'
  },

  // Entertainment/Streaming
  'netflix': {
    name: 'Netflix',
    logo: '📺',
    domain: 'netflix.com',
    category: 'entertainment',
    color: '#E50914'
  },
  'spotify': {
    name: 'Spotify',
    logo: '🎵',
    domain: 'spotify.com',
    category: 'entertainment',
    color: '#1DB954'
  },
  'apple': {
    name: 'Apple',
    logo: '🍎',
    domain: 'apple.com',
    category: 'shopping',
    color: '#000000'
  },
  'sky': {
    name: 'Sky',
    logo: '📺',
    domain: 'sky.com',
    category: 'entertainment',
    color: '#0072C9'
  },

  // Miscellaneous
  'paypal': {
    name: 'PayPal',
    logo: '💸',
    domain: 'paypal.com',
    category: 'finance',
    color: '#003087'
  },
  'cash deposit': {
    name: 'Cash Deposit',
    logo: '💰',
    category: 'finance',
    color: '#4CAF50'
  },
  'round-up': {
    name: 'Round-Up',
    logo: '🔄',
    category: 'finance',
    color: '#2196F3'
  },
  'interest': {
    name: 'Interest',
    logo: '📈',
    category: 'finance',
    color: '#4CAF50'
  },
  'refund': {
    name: 'Refund',
    logo: '↩️',
    category: 'finance',
    color: '#4CAF50'
  },

  // ── Common brands (added for real-logo coverage). Keys are lowercase and
  // matched as substrings of the cleaned description, so e.g. "UBERTRIP"
  // resolves via "uber" and "ALIPAY UK" via "alipay". ──

  // Ride-hailing / transport / travel
  // (uber + tfl already defined above with domains.)
  'ubereats': { name: 'Uber Eats', logo: '🥡', domain: 'ubereats.com', category: 'food', color: '#06C167' },
  'bolt': { name: 'Bolt', logo: '🚕', domain: 'bolt.eu', category: 'transport', color: '#34D186' },
  'trainline': { name: 'Trainline', logo: '🚆', domain: 'thetrainline.com', category: 'transport', color: '#00B0B9' },
  'ryanair': { name: 'Ryanair', logo: '✈️', domain: 'ryanair.com', category: 'travel', color: '#073590' },
  'easyjet': { name: 'easyJet', logo: '✈️', domain: 'easyjet.com', category: 'travel', color: '#FF6600' },
  'airbnb': { name: 'Airbnb', logo: '🏠', domain: 'airbnb.com', category: 'travel', color: '#FF5A5F' },
  'booking': { name: 'Booking.com', logo: '🏨', domain: 'booking.com', category: 'travel', color: '#003580' },

  // Payments / finance  (paypal already defined above.)
  'alipay': { name: 'Alipay', logo: '💳', domain: 'alipay.com', category: 'finance', color: '#1677FF' },
  'klarna': { name: 'Klarna', logo: '💳', domain: 'klarna.com', category: 'finance', color: '#FFB3C7' },
  'wise': { name: 'Wise', logo: '💳', domain: 'wise.com', category: 'finance', color: '#9FE870' },

  // Streaming / subscriptions / gaming  (netflix + spotify already defined above.)
  'disney': { name: 'Disney+', logo: '📺', domain: 'disneyplus.com', category: 'entertainment', color: '#113CCF' },
  'youtube': { name: 'YouTube', logo: '📺', domain: 'youtube.com', category: 'entertainment', color: '#FF0000' },
  'audible': { name: 'Audible', logo: '🎧', domain: 'audible.co.uk', category: 'entertainment', color: '#FF9900' },
  'playstation': { name: 'PlayStation', logo: '🎮', domain: 'playstation.com', category: 'entertainment', color: '#003791' },
  'xbox': { name: 'Xbox', logo: '🎮', domain: 'xbox.com', category: 'entertainment', color: '#107C10' },
  'steam': { name: 'Steam', logo: '🎮', domain: 'steampowered.com', category: 'entertainment', color: '#1B2838' },

  // Food delivery / restaurants
  'deliveroo': { name: 'Deliveroo', logo: '🥡', domain: 'deliveroo.co.uk', category: 'food', color: '#00CCBC' },
  'just eat': { name: 'Just Eat', logo: '🥡', domain: 'just-eat.co.uk', category: 'food', color: '#FF8000' },
  'justeat': { name: 'Just Eat', logo: '🥡', domain: 'just-eat.co.uk', category: 'food', color: '#FF8000' },
  'just-eat': { name: 'Just Eat', logo: '🥡', domain: 'just-eat.co.uk', category: 'food', color: '#FF8000' },
  'nando': { name: "Nando's", logo: '🍗', domain: 'nandos.co.uk', category: 'food', color: '#DC241F' },
  // Keyed on the full name so it doesn't false-match "PrettyLittleThing".
  'pret a manger': { name: 'Pret A Manger', logo: '🥪', domain: 'pret.co.uk', category: 'food', color: '#7D2027' },
  'burger king': { name: 'Burger King', logo: '🍔', domain: 'burgerking.co.uk', category: 'food', color: '#D62300' },

  // Supermarkets / retail
  'lidl': { name: 'Lidl', logo: '🛒', domain: 'lidl.co.uk', category: 'shopping', color: '#0050AA' },
  'aldi': { name: 'Aldi', logo: '🛒', domain: 'aldi.co.uk', category: 'shopping', color: '#00559F' },
  'waitrose': { name: 'Waitrose', logo: '🛒', domain: 'waitrose.com', category: 'shopping', color: '#5A8F3C' },
  'boots': { name: 'Boots', logo: '💊', domain: 'boots.com', category: 'health', color: '#05054B' },
  'argos': { name: 'Argos', logo: '🛍️', domain: 'argos.co.uk', category: 'shopping', color: '#ED1B24' },
  'currys': { name: 'Currys', logo: '🛍️', domain: 'currys.co.uk', category: 'shopping', color: '#742D82' },
  'primark': { name: 'Primark', logo: '🛍️', domain: 'primark.com', category: 'shopping', color: '#0094D9' },
  'ikea': { name: 'IKEA', logo: '🛋️', domain: 'ikea.com', category: 'shopping', color: '#0058A3' },
  'asos': { name: 'ASOS', logo: '🛍️', domain: 'asos.com', category: 'shopping', color: '#000000' },

  // Tech / big brands  (apple already defined above.)
  'google': { name: 'Google', logo: '🔍', domain: 'google.com', category: 'other', color: '#4285F4' },
  'microsoft': { name: 'Microsoft', logo: '🪟', domain: 'microsoft.com', category: 'other', color: '#737373' }
};

// Default logos for categories
const CATEGORY_FALLBACKS: Record<string, string> = {
  'shopping': '🛍️',
  'food': '🍽️',
  'transport': '🚗',
  'finance': '💳',
  'telecoms': '📱',
  'utilities': '⚡',
  'entertainment': '🎬',
  'health': '🏥',
  'education': '📚',
  'other': '💰'
};

// Smart fallback logos based on description analysis
const SMART_FALLBACKS: { pattern: RegExp; logo: string; category: string }[] = [
  // ATM and Cash
  { pattern: /atm|cash.*withdraw|cash.*machine/i, logo: '🏧', category: 'finance' },
  { pattern: /cash.*deposit|deposit.*cash/i, logo: '💰', category: 'finance' },
  
  // Transfer and Payment patterns
  { pattern: /transfer|payment.*to|faster.*payment/i, logo: '💸', category: 'finance' },
  { pattern: /direct.*debit|standing.*order/i, logo: '📋', category: 'finance' },
  { pattern: /refund|return/i, logo: '↩️', category: 'finance' },
  
  // Shopping patterns
  { pattern: /store|shop|retail|market/i, logo: '🏪', category: 'shopping' },
  { pattern: /online|web|internet/i, logo: '💻', category: 'shopping' },
  { pattern: /pharmacy|chemist/i, logo: '💊', category: 'health' },
  
  // Food patterns
  { pattern: /restaurant|cafe|coffee|food|eat|dine/i, logo: '🍽️', category: 'food' },
  { pattern: /bar|pub|drink/i, logo: '🍺', category: 'food' },
  { pattern: /takeaway|delivery|fast.*food/i, logo: '🥡', category: 'food' },
  
  // Transport patterns
  { pattern: /taxi|cab|uber|lyft/i, logo: '🚕', category: 'transport' },
  { pattern: /train|rail|tube|metro/i, logo: '🚇', category: 'transport' },
  { pattern: /bus|coach/i, logo: '🚌', category: 'transport' },
  { pattern: /fuel|petrol|diesel|gas.*station/i, logo: '⛽', category: 'transport' },
  { pattern: /parking|car.*park/i, logo: '🅿️', category: 'transport' },
  
  // Utilities patterns
  { pattern: /electric|electricity|power/i, logo: '💡', category: 'utilities' },
  { pattern: /gas|heating/i, logo: '🔥', category: 'utilities' },
  { pattern: /water|sewage/i, logo: '💧', category: 'utilities' },
  { pattern: /internet|broadband|wifi/i, logo: '🌐', category: 'utilities' },
  { pattern: /phone|mobile|telecom/i, logo: '📞', category: 'telecoms' },
  
  // Entertainment patterns
  { pattern: /cinema|movie|film/i, logo: '🎬', category: 'entertainment' },
  { pattern: /music|spotify|apple.*music/i, logo: '🎵', category: 'entertainment' },
  { pattern: /netflix|streaming|subscription/i, logo: '📺', category: 'entertainment' },
  { pattern: /game|gaming|xbox|playstation/i, logo: '🎮', category: 'entertainment' },
  
  // Health patterns
  { pattern: /doctor|medical|hospital|clinic/i, logo: '🏥', category: 'health' },
  { pattern: /dental|dentist/i, logo: '🦷', category: 'health' },
  { pattern: /optical|vision|glasses/i, logo: '👓', category: 'health' },
  
  // Education patterns
  { pattern: /school|university|college|education/i, logo: '🎓', category: 'education' },
  { pattern: /library|book/i, logo: '📚', category: 'education' },
  
  // Miscellaneous patterns
  { pattern: /subscription|membership/i, logo: '📄', category: 'other' },
  { pattern: /donation|charity/i, logo: '❤️', category: 'other' },
  { pattern: /insurance/i, logo: '🛡️', category: 'finance' },
  { pattern: /government|tax|hmrc|council/i, logo: '🏛️', category: 'other' }
];

/**
 * Clean and normalize merchant name from transaction description
 */
/**
 * Simple name capitalization without circular dependencies
 */
function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Basic cleanup without merchant resolution
 */
function basicCleanup(description: string): string {
  return description
    .toLowerCase()
    .trim()
    .replace(/^(card payment to|payment to|direct debit to|standing order to)\s+/i, "")
    .replace(/\s+(visa|mastercard|amex|american express)$/i, "")
    .replace(/\s+ref\s*:?\s*\w+/i, "")
    .replace(/\s+\d{6,}/g, "")
    .replace(/\s+\d{3,4}$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function cleanMerchantName(description: string): string {
  if (!description) return 'Unknown Merchant';
  
  // Remove common prefixes and suffixes
  let cleaned = description
    .toLowerCase()
    .trim()
    // Remove card payment indicators
    .replace(/^(card payment to|payment to|direct debit to|standing order to)\s+/i, '')
    // Remove payment method indicators
    .replace(/\s+(visa|mastercard|amex|american express)$/i, '')
    // Remove reference numbers and codes
    .replace(/\s+ref\s*:?\s*\w+/i, '')
    .replace(/\s+\d{6,}/g, '') // Remove long number sequences
    // Remove location codes (like store numbers)
    .replace(/\s+\d{3,4}$/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Handle specific patterns
  if (cleaned.includes('three')) cleaned = 'three';
  if (cleaned.includes('ali express') || cleaned.includes('aliexpress')) cleaned = 'aliexpress';
  if (cleaned.includes('home bargains')) cleaned = 'home bargains';
  if (cleaned.includes('round-up') || cleaned.includes('roundup')) cleaned = 'round-up';
  if (cleaned.includes('cash deposit')) cleaned = 'cash deposit';
  
  // If we have a merchant mapping, return the proper name
  // Try to find in known merchant patterns directly (avoid circular dependency)
  // Try to find in known merchant logos directly (avoid circular dependency)
  if (MERCHANT_LOGOS[cleaned]) {
    return MERCHANT_LOGOS[cleaned].name;
  }
  
  // Try partial matches with known merchants
  for (const [key, merchantInfo] of Object.entries(MERCHANT_LOGOS)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return merchantInfo.name;
    }
  }
  
  // Otherwise capitalize the first letter of each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get merchant information (name, logo, etc.) based on description
 */
export function getMerchantInfo(description: string): MerchantInfo {
  if (!description) {
    return {
      name: 'Unknown Merchant',
      logo: CATEGORY_FALLBACKS.other,
      category: 'other'
    };
  }
  
  const cleanedName = description.toLowerCase().trim();
  
  // Try exact match first
  if (MERCHANT_LOGOS[cleanedName]) {
    return MERCHANT_LOGOS[cleanedName];
  }
  
  // Try partial matches with known merchants
  for (const [key, merchantInfo] of Object.entries(MERCHANT_LOGOS)) {
    if (cleanedName.includes(key) || key.includes(cleanedName)) {
      return merchantInfo;
    }
  }
  
  // Try smart fallbacks based on transaction patterns
  for (const fallback of SMART_FALLBACKS) {
    if (fallback.pattern.test(description)) {
      return {
        name: capitalizeWords(basicCleanup(description)),
        logo: fallback.logo,
        category: fallback.category
      };
    }
  }
  
  // Determine category based on keywords (legacy fallback)
  let category = 'other';
  if (cleanedName.includes('restaurant') || cleanedName.includes('cafe') || cleanedName.includes('food')) {
    category = 'food';
  } else if (cleanedName.includes('shop') || cleanedName.includes('store') || cleanedName.includes('retail')) {
    category = 'shopping';
  } else if (cleanedName.includes('transport') || cleanedName.includes('taxi') || cleanedName.includes('bus')) {
    category = 'transport';
  } else if (cleanedName.includes('bank') || cleanedName.includes('atm') || cleanedName.includes('card')) {
    category = 'finance';
  }
  
  return {
    name: capitalizeWords(basicCleanup(description)),
    logo: CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS.other,
    category
  };
}

/**
 * Get merchant logo as emoji
 */
export function getMerchantLogo(description: string): string {
  const merchantInfo = getMerchantInfo(description);
  return merchantInfo.logo;
}

/**
 * Get merchant color for theming
 */
export function getMerchantColor(description: string): string | undefined {
  const merchantInfo = getMerchantInfo(description);
  return merchantInfo.color;
}

/**
 * Cache frequently accessed merchant data locally
 */
const CACHE_KEY = 'merchant_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  data: MerchantInfo;
  timestamp: number;
}

export async function getCachedMerchantInfo(description: string): Promise<MerchantInfo> {
  try {
    const cacheKey = `${CACHE_KEY}_${description.toLowerCase()}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - entry.timestamp > CACHE_EXPIRY;
      
      if (!isExpired) {
        return entry.data;
      }
    }
    
    // Get fresh data and cache it
    const merchantInfo = getMerchantInfo(description);
    const cacheEntry: CacheEntry = {
      data: merchantInfo,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    return merchantInfo;
    
  } catch (error) {
    console.warn('Error with merchant cache:', error);
    return getMerchantInfo(description);
  }
}

/**
 * Clear merchant cache
 */
export async function clearMerchantCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const merchantKeys = keys.filter(key => key.startsWith(CACHE_KEY));
    await AsyncStorage.multiRemove(merchantKeys);
  } catch (error) {
    console.warn('Error clearing merchant cache:', error);
  }
}