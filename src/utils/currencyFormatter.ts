import { CurrencyConfig } from '../types/invoice';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee (INR)',
    narrationUnit: 'rupees',
    narrationFraction: 'paise',
    locale: 'en-IN',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar (USD)',
    narrationUnit: 'dollars',
    narrationFraction: 'cents',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (EUR)',
    narrationUnit: 'euros',
    narrationFraction: 'cents',
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (GBP)',
    narrationUnit: 'pounds',
    narrationFraction: 'pence',
    locale: 'en-GB',
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham (AED)',
    narrationUnit: 'dirhams',
    narrationFraction: 'fils',
    locale: 'en-AE',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$ ',
    name: 'Canadian Dollar (CAD)',
    narrationUnit: 'Canadian dollars',
    narrationFraction: 'cents',
    locale: 'en-CA',
  },
  AUD: {
    code: 'AUD',
    symbol: 'AU$ ',
    name: 'Australian Dollar (AUD)',
    narrationUnit: 'Australian dollars',
    narrationFraction: 'cents',
    locale: 'en-AU',
  },
  SGD: {
    code: 'SGD',
    symbol: 'SG$ ',
    name: 'Singapore Dollar (SGD)',
    narrationUnit: 'Singapore dollars',
    narrationFraction: 'cents',
    locale: 'en-SG',
  },
};

export const DEFAULT_CURRENCY = 'INR';

export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES[code] || CURRENCIES.INR;
}

export function formatCurrency(amount: number | undefined | null, currencyCode: string = 'INR'): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const config = getCurrencyConfig(currencyCode);

  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

    return `${config.symbol}${formatted}`;
  } catch (e) {
    return `${config.symbol}${val.toFixed(2)}`;
  }
}

export function formatNumberOnly(amount: number | undefined | null, currencyCode: string = 'INR'): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const config = getCurrencyConfig(currencyCode);

  try {
    return new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  } catch (e) {
    return val.toFixed(2);
  }
}
