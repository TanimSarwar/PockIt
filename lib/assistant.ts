
export interface AssistantAction {
  intent: string;
  confidence: number;
  params: Record<string, any>;
  preview?: string;
  targetRoute: string;
}

const UNIT_MAP: Record<string, string> = {
  // Length
  'meter': 'm', 'meters': 'm',
  'kilometer': 'km', 'kilometers': 'km', 'km': 'km',
  'centimeter': 'cm', 'centimeters': 'cm', 'cm': 'cm',
  'millimeter': 'mm', 'millimeters': 'mm', 'mm': 'mm',
  'mile': 'mi', 'miles': 'mi',
  'yard': 'yd', 'yards': 'yd',
  'foot': 'ft', 'feet': 'ft', 'ft': 'ft',
  'inch': 'in', 'inches': 'in', 'in': 'in',
  // Weight
  'kilogram': 'kg', 'kilograms': 'kg', 'kg': 'kg',
  'gram': 'g', 'grams': 'g', 'g': 'g',
  'milligram': 'mg', 'milligrams': 'mg', 'mg': 'mg',
  'pound': 'lb', 'pounds': 'lb', 'lb': 'lb',
  'ounce': 'oz', 'ounces': 'oz', 'oz': 'oz',
  'ton': 't', 'tons': 't',
  // Temperature
  'celsius': 'C', 'fahrenheit': 'F', 'kelvin': 'K',
  // Speed
  'kmh': 'kmph', 'mph': 'mph', 'knot': 'knot',
};

const CURRENCY_MAP: Record<string, string> = {
  '$': 'USD', 'dollar': 'USD', 'dollars': 'USD', 'usd': 'USD',
  '€': 'EUR', 'euro': 'EUR', 'euros': 'EUR', 'eur': 'EUR',
  '£': 'GBP', 'pound': 'GBP', 'pounds': 'GBP', 'gbp': 'GBP',
  '¥': 'JPY', 'yen': 'JPY', 'jpy': 'JPY',
  '৳': 'BDT', 'taka': 'BDT', 'bdt': 'BDT',
  '₹': 'INR', 'rupee': 'INR', 'rupees': 'INR', 'inr': 'INR',
  'a$': 'AUD', 'aud': 'AUD',
  'c$': 'CAD', 'cad': 'CAD',
};

function mapUnit(unit: string): string {
  return UNIT_MAP[unit.toLowerCase()] || unit.toLowerCase();
}

function mapCurrency(curr: string): string {
  return CURRENCY_MAP[curr.toLowerCase()] || curr.toUpperCase();
}

const INTENT_PATTERNS = [
  {
    intent: 'CURRENCY_CONVERT',
    route: '/(tabs)/tools/currency-converter',
    patterns: [
      /(\d+\.?\d*)\s*([\$€£¥৳₹a-zA-Z]+)\s*(?:to|in)\s*([\$€£¥৳₹a-zA-Z]+)/i,
      /convert\s*(\d+\.?\d*)\s*([\$€£¥৳₹a-zA-Z]+)\s*(?:to|in)\s*([\$€£¥৳₹a-zA-Z]+)/i,
    ],
    validate: (match: RegExpMatchArray) => {
      const from = match[2].toLowerCase();
      const to = match[3].toLowerCase();
      return !!(CURRENCY_MAP[from] || CURRENCY_MAP[to] || (from.length === 3 && to.length === 3));
    },
    extract: (match: RegExpMatchArray) => ({
      amount: match[1],
      from: mapCurrency(match[2]),
      to: mapCurrency(match[3]),
    }),
  },
  {
    intent: 'UNIT_CONVERT',
    route: '/(tabs)/tools/unit-converter',
    patterns: [
      /(\d+\.?\d*)\s*([a-zA-Z]+)\s*(?:to|in)\s*([a-zA-Z]+)/i,
      /convert\s*(\d+\.?\d*)\s*([a-zA-Z]+)\s*(?:to|in)\s*([a-zA-Z]+)/i,
    ],
    validate: (match: RegExpMatchArray) => {
      const from = mapUnit(match[2]);
      const to = mapUnit(match[3]);
      // If we found a direct mapping in our unit map, it's definitely a unit
      return !!(UNIT_MAP[match[2].toLowerCase()] || UNIT_MAP[match[3].toLowerCase()]);
    },
    extract: (match: RegExpMatchArray) => ({
      value: match[1],
      from: mapUnit(match[2]),
      to: mapUnit(match[3]),
    }),
  },
  {
    intent: 'CALC',
    route: '/(tabs)/finance/calculator',
    patterns: [
      /(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)/i,
      /calculate\s*(.*)/i,
    ],
    extract: (match: RegExpMatchArray) => {
      if (match[2]) {
        return { 
          display: '0', 
          expression: `${match[1]}${match[2]}${match[3]}` 
        };
      }
      return { display: '0', expression: match[1] };
    },
  },
  {
    intent: 'TIP_CALC',
    route: '/(tabs)/tools/tip-calculator',
    patterns: [
      /split\s*(\d+\.?\d*)\s*(?:between|among|for)?\s*(\d+)/i,
      /tip\s*(?:on|for)?\s*(\d+\.?\d*)/i,
    ],
    extract: (match: RegExpMatchArray) => ({
      billAmount: match[1],
      splitCount: match[2] || '1',
    }),
  },
  {
    intent: 'PASSWORD_GEN',
    route: '/(tabs)/tools/password-generator',
    patterns: [
      /generate\s*password/i,
      /new\s*password/i,
      /strong\s*password/i,
    ],
    extract: () => ({}),
  },
  {
    intent: 'BMI_CALC',
    route: '/(tabs)/wellness/bmi-calculator',
    patterns: [
      /bmi/i,
      /calculate\s*bmi/i,
    ],
    extract: () => ({}),
  },
  {
    intent: 'PRAYER_TIMES',
    route: '/(tabs)/utilities/prayer-times',
    patterns: [
      /prayer/i,
      /salah/i,
      /namaz/i,
      /azan/i,
    ],
    extract: () => ({}),
  },
  {
    intent: 'GAMES',
    route: '/(tabs)/games',
    patterns: [
      /play\s*(?:a\s*)?game/i,
      /open\s*games/i,
      /arcade/i,
    ],
    extract: () => ({}),
  },
  {
    intent: 'SNAKE_GAME',
    route: '/(tabs)/games/snake',
    patterns: [
      /snake/i,
      /play\s*snake/i,
    ],
    extract: () => ({}),
  },
];

export function analyzeIntent(input: string): AssistantAction | null {
  const text = input.trim();
  if (!text) return null;

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of (pattern as any).patterns) {
      const match = text.match(regex);
      if (match) {
        // Run validation if it exists
        if ((pattern as any).validate && !(pattern as any).validate(match)) {
          continue;
        }

        return {
          intent: pattern.intent,
          confidence: 0.9,
          params: (pattern as any).extract(match),
          targetRoute: pattern.route,
        };
      }
    }
  }

  return null;
}
