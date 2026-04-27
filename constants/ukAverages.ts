/**
 * UK Cost of Living Averages
 * Data sourced from ONS (Office for National Statistics) and Ofgem
 * Last updated: Q4 2024
 *
 * These figures represent average monthly household spending in GBP
 * for a typical UK household (2.4 people average)
 */

// UK Regions for regional comparison
export type UKRegion =
  | 'national'
  | 'london'
  | 'south_east'
  | 'south_west'
  | 'east'
  | 'west_midlands'
  | 'east_midlands'
  | 'yorkshire'
  | 'north_west'
  | 'north_east'
  | 'wales'
  | 'scotland'
  | 'northern_ireland';

// Cost categories tracked
export type CostCategory = 'housing' | 'energy' | 'food' | 'transport';

// Monthly spending averages by category (in GBP)
export interface CategoryAverage {
  category: CostCategory;
  label: string;
  icon: string;
  color: string;
  nationalAverage: number;
  regionalAverages: Record<UKRegion, number>;
  description: string;
}

// UK National Monthly Averages (ONS Family Spending Survey 2024)
export const UK_CATEGORY_AVERAGES: CategoryAverage[] = [
  {
    category: 'housing',
    label: 'Housing',
    icon: 'home-outline',
    color: '#6366F1', // Indigo
    nationalAverage: 850, // Includes rent/mortgage, council tax, insurance
    regionalAverages: {
      national: 850,
      london: 1450,
      south_east: 1050,
      south_west: 780,
      east: 850,
      west_midlands: 680,
      east_midlands: 650,
      yorkshire: 620,
      north_west: 650,
      north_east: 580,
      wales: 620,
      scotland: 680,
      northern_ireland: 550,
    },
    description: 'Rent, mortgage, council tax, home insurance',
  },
  {
    category: 'energy',
    label: 'Energy',
    icon: 'flash-outline',
    color: '#F59E0B', // Amber
    nationalAverage: 165, // Based on Ofgem price cap Q1 2025
    regionalAverages: {
      national: 165,
      london: 155,
      south_east: 160,
      south_west: 170,
      east: 165,
      west_midlands: 170,
      east_midlands: 175,
      yorkshire: 175,
      north_west: 175,
      north_east: 180,
      wales: 175,
      scotland: 185,
      northern_ireland: 190,
    },
    description: 'Gas and electricity bills',
  },
  {
    category: 'food',
    label: 'Food & Groceries',
    icon: 'cart-outline',
    color: '#22C55E', // Green
    nationalAverage: 480, // Average household grocery spend
    regionalAverages: {
      national: 480,
      london: 550,
      south_east: 520,
      south_west: 470,
      east: 490,
      west_midlands: 450,
      east_midlands: 440,
      yorkshire: 430,
      north_west: 450,
      north_east: 420,
      wales: 430,
      scotland: 460,
      northern_ireland: 420,
    },
    description: 'Groceries, supermarket shopping, food delivery',
  },
  {
    category: 'transport',
    label: 'Transport',
    icon: 'car-outline',
    color: '#EC4899', // Pink
    nationalAverage: 350, // Fuel, public transport, car costs
    regionalAverages: {
      national: 350,
      london: 280, // Higher public transport use
      south_east: 380,
      south_west: 370,
      east: 360,
      west_midlands: 340,
      east_midlands: 350,
      yorkshire: 330,
      north_west: 340,
      north_east: 320,
      wales: 360,
      scotland: 350,
      northern_ireland: 340,
    },
    description: 'Fuel, public transport, car insurance, parking',
  },
];

// Total monthly average for all tracked categories
export const UK_TOTAL_MONTHLY_AVERAGE = UK_CATEGORY_AVERAGES.reduce(
  (sum, cat) => sum + cat.nationalAverage,
  0
);

// Energy price cap history (Ofgem quarterly caps - per typical household annual bill)
export interface EnergyPriceCap {
  quarter: string;
  startDate: string;
  endDate: string;
  annualCap: number; // Annual typical household bill
  monthlyCap: number; // Monthly equivalent
}

export const ENERGY_PRICE_CAP_HISTORY: EnergyPriceCap[] = [
  { quarter: 'Q1 2025', startDate: '2025-01-01', endDate: '2025-03-31', annualCap: 1738, monthlyCap: 145 },
  { quarter: 'Q4 2024', startDate: '2024-10-01', endDate: '2024-12-31', annualCap: 1717, monthlyCap: 143 },
  { quarter: 'Q3 2024', startDate: '2024-07-01', endDate: '2024-09-30', annualCap: 1568, monthlyCap: 131 },
  { quarter: 'Q2 2024', startDate: '2024-04-01', endDate: '2024-06-30', annualCap: 1690, monthlyCap: 141 },
  { quarter: 'Q1 2024', startDate: '2024-01-01', endDate: '2024-03-31', annualCap: 1928, monthlyCap: 161 },
  { quarter: 'Q4 2023', startDate: '2023-10-01', endDate: '2023-12-31', annualCap: 1834, monthlyCap: 153 },
];

// Current energy price cap
export const CURRENT_ENERGY_PRICE_CAP = ENERGY_PRICE_CAP_HISTORY[0];

// UK region labels for display
export const UK_REGION_LABELS: Record<UKRegion, string> = {
  national: 'UK National Average',
  london: 'London',
  south_east: 'South East',
  south_west: 'South West',
  east: 'East of England',
  west_midlands: 'West Midlands',
  east_midlands: 'East Midlands',
  yorkshire: 'Yorkshire & Humber',
  north_west: 'North West',
  north_east: 'North East',
  wales: 'Wales',
  scotland: 'Scotland',
  northern_ireland: 'Northern Ireland',
};

// Category keywords for transaction matching (case-insensitive)
export const CATEGORY_KEYWORDS: Record<CostCategory, string[]> = {
  housing: [
    // Rent & Mortgage
    'rent', 'mortgage', 'letting', 'landlord', 'tenant',
    // Council Tax
    'council tax', 'hmrc council', 'local authority',
    // Property platforms
    'openrent', 'zoopla', 'rightmove', 'spareroom', 'onthemarket',
    // Estate agents
    'estate agent', 'foxtons', 'savills', 'knight frank', 'hamptons',
    'countrywide', 'connells', 'haart', 'purplebricks',
    // Insurance
    'home insurance', 'buildings insurance', 'contents insurance',
    'aviva home', 'direct line home', 'admiral home',
    // Housing associations
    'housing association', 'peabody', 'l&q', 'notting hill',
  ],
  energy: [
    // Major UK energy suppliers
    'british gas', 'edf', 'eon', 'e.on', 'ovo', 'octopus energy',
    'scottish power', 'sse', 'bulb', 'shell energy', 'utility warehouse',
    'npower', 'ecotricity', 'good energy', 'green energy', 'utilita',
    'boost', 'outfox', 'so energy', 'pure planet', 'igloo',
    // Generic energy terms
    'electricity', 'gas bill', 'energy bill', 'utilities', 'utility',
    'electric bill', 'power bill', 'heating',
    // Water (often bundled)
    'water bill', 'thames water', 'severn trent', 'united utilities',
    'anglian water', 'yorkshire water', 'southern water',
  ],
  food: [
    // Major UK supermarkets
    'tesco', 'sainsbury', 'asda', 'morrisons', 'aldi', 'lidl',
    'waitrose', 'co-op', 'coop', 'cooperative', 'm&s food', 'marks spencer',
    'iceland', 'ocado', 'amazon fresh', 'amazon pantry',
    // Convenience stores
    'spar', 'londis', 'nisa', 'costcutter', 'premier', 'one stop',
    'budgens', 'mccoll', 'bargain booze',
    // Online grocery
    'getir', 'gorillas', 'gopuff', 'deliveroo grocery', 'uber eats grocery',
    // Generic terms
    'grocery', 'groceries', 'supermarket', 'food shop', 'food shopping',
    // Wholesale
    'costco', 'booker', 'makro',
  ],
  transport: [
    // London transport
    'tfl', 'transport for london', 'oyster', 'contactless tfl',
    'london underground', 'tube', 'london bus',
    // Rail
    'national rail', 'trainline', 'avanti', 'lner', 'gwr', 'southeastern',
    'southern rail', 'northern rail', 'transpennine', 'scotrail',
    'crosscountry', 'c2c', 'chiltern', 'east midlands',
    // Ride sharing
    'uber', 'bolt', 'free now', 'kapten', 'ola', 'addison lee',
    'taxi', 'cab', 'minicab', 'black cab',
    // Fuel stations
    'petrol', 'diesel', 'fuel', 'shell', 'bp', 'esso', 'texaco',
    'jet', 'murco', 'gulf', 'total', 'applegreen', 'asda petrol',
    'tesco fuel', 'sainsbury fuel', 'morrisons fuel',
    // Parking
    'parking', 'ncp', 'q-park', 'apcoa', 'ringgo', 'paybyphone',
    'justpark', 'yourparkingspace', 'parkopedia',
    // Vehicle costs
    'dvla', 'car insurance', 'mot', 'car tax', 'road tax',
    'rac', 'aa', 'green flag', 'car service', 'kwik fit', 'halfords',
    // Bus
    'stagecoach', 'arriva', 'first bus', 'go ahead', 'national express',
    // Bike
    'santander cycles', 'lime', 'tier', 'voi',
  ],
};

// Cost of Living Score thresholds
export interface CostOfLivingScoreThreshold {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

export const COST_OF_LIVING_SCORE_THRESHOLDS: CostOfLivingScoreThreshold[] = [
  {
    min: 80,
    max: 100,
    label: 'Excellent',
    color: '#22C55E', // Green
    description: 'Your spending is well below UK averages. Great job managing costs!',
  },
  {
    min: 60,
    max: 79,
    label: 'Good',
    color: '#84CC16', // Lime
    description: 'Your spending is below UK averages in most categories.',
  },
  {
    min: 40,
    max: 59,
    label: 'Average',
    color: '#F59E0B', // Amber
    description: 'Your spending is similar to typical UK households.',
  },
  {
    min: 20,
    max: 39,
    label: 'Above Average',
    color: '#F97316', // Orange
    description: 'Your spending is higher than UK averages. Consider reviewing expenses.',
  },
  {
    min: 0,
    max: 19,
    label: 'High',
    color: '#EF4444', // Red
    description: 'Your spending is significantly above UK averages. Time to cut costs!',
  },
];

// Helper function to get score threshold
export const getScoreThreshold = (score: number): CostOfLivingScoreThreshold => {
  return COST_OF_LIVING_SCORE_THRESHOLDS.find(
    (t) => score >= t.min && score <= t.max
  ) || COST_OF_LIVING_SCORE_THRESHOLDS[2]; // Default to 'Average'
};

// Helper function to get category by name
export const getCategoryAverage = (category: CostCategory): CategoryAverage | undefined => {
  return UK_CATEGORY_AVERAGES.find((c) => c.category === category);
};

// UK Inflation data (for year-over-year comparison)
export const UK_INFLATION_RATES = {
  current: 2.6, // CPI as of Nov 2024
  previous: 4.6, // CPI Nov 2023
  target: 2.0, // Bank of England target
  peakRecent: 11.1, // Oct 2022 peak
};
