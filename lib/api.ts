/**
 * PockIt API Helpers
 * Typed fetch wrappers for all external APIs with error handling and timeouts.
 */

const DEFAULT_TIMEOUT = 10_000; // 10 seconds

// ─── Types ─────────────────────────────────────────────────────────────────

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  daily: {
    dates: string[];
    maxTemps: number[];
    minTemps: number[];
    weatherCodes: number[];
  };
}

export interface Quote {
  content: string;
  author: string;
  tags: string[];
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timeLastUpdated: number;
}

export interface StockPrice {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface DictionaryEntry {
  word: string;
  phonetic: string;
  phonetics: Array<{ text?: string; audio?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }>;
    synonyms: string[];
    antonyms: string[];
  }>;
}

export interface Translation {
  translatedText: string;
  match: number;
  detectedLanguage?: string;
}

export interface CountryData {
  name: { common: string; official: string };
  flags: { png: string; svg: string; alt?: string };
  flag?: string; // Emoji flag if available separately, though v3.1 usually has flag: '🇺🇸'
  capital: string[];
  population: number;
  region: string;
  subregion: string;
  currencies: Record<string, { name: string; symbol: string }>;
  languages: Record<string, string>;
  area: number;
  timezones: string[];
  cca3: string;
  idd: { root: string; suffixes: string[] };
  continents: string[];
  tld: string[];
  cca2: string;
  borders?: string[];
  gini?: Record<string, number>;
  coatOfArms: { png: string; svg: string };
  latlng: [number, number];
  landlocked: boolean;
  car: { side: string };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Internal Helpers ──────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeout}ms`, undefined, url);
    }
    throw new ApiError(
      error.message || 'Network request failed',
      undefined,
      url,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJson<T>(url: string, timeout?: number): Promise<T> {
  const response = await fetchWithTimeout(url, {}, timeout);

  if (!response.ok) {
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      url,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('Failed to parse JSON response', undefined, url);
  }
}

// ─── Weather (Open-Meteo) ──────────────────────────────────────────────────

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '7',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const data = await fetchJson<any>(url);

  return {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    daily: {
      dates: data.daily.time,
      maxTemps: data.daily.temperature_2m_max,
      minTemps: data.daily.temperature_2m_min,
      weatherCodes: data.daily.weather_code,
    },
  };
}

// ─── Quote (quotable.io) ───────────────────────────────────────────────────

export async function fetchQuote(): Promise<Quote> {
  const data = await fetchJson<{
    content: string;
    author: string;
    tags: string[];
  }>('https://api.quotable.io/random');

  return {
    content: data.content,
    author: data.author,
    tags: data.tags,
  };
}

// ─── Exchange Rates (open.er-api.com) ──────────────────────────────────────

export async function fetchExchangeRates(
  base: string = 'USD',
): Promise<ExchangeRates> {
  const data = await fetchJson<{
    result: string;
    base_code: string;
    rates: Record<string, number>;
    time_last_update_unix: number;
  }>(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);

  if (data.result !== 'success') {
    throw new ApiError(
      'Exchange rate API returned unsuccessful result',
      undefined,
      'open.er-api.com',
    );
  }

  return {
    base: data.base_code,
    rates: data.rates,
    timeLastUpdated: data.time_last_update_unix,
  };
}

// ─── Stock Price (Alpha Vantage) ───────────────────────────────────────────

/**
 * Fetch the latest stock quote from Tiingo.
 * Tiingo provides a more generous free tier than Alpha Vantage.
 */
export async function fetchStockPrice(
  symbol: string,
  apiKey: string = 'YOUR_TIINGO_API_KEY', // Placeholder, should be in env
): Promise<StockPrice> {
  const url = `https://api.tiingo.com/iex/?tickers=${symbol}&token=${apiKey}`;
  const data = await fetchJson<any[]>(url);

  if (!Array.isArray(data) || data.length === 0) {
    throw new ApiError(
      `No stock data found for symbol "${symbol}"`,
      undefined,
      'tiingo.com',
    );
  }

  const quote = data[0];
  const price = quote.last;
  const prevClose = quote.prevClose;
  const change = price - prevClose;
  const changePercent = prevClose !== 0 ? ((change / prevClose) * 100).toFixed(2) + '%' : '0.00%';

  return {
    symbol: quote.ticker,
    open: quote.open || quote.last,
    high: quote.high || quote.last,
    low: quote.low || quote.last,
    price: quote.last,
    volume: quote.volume || 0,
    latestTradingDay: new Date(quote.timestamp).toLocaleDateString(),
    previousClose: quote.prevClose,
    change,
    changePercent,
  };
}

/**
 * Search for stock symbols or company names using Tiingo.
 */
export async function searchStocks(
  keywords: string,
  apiKey: string = 'YOUR_TIINGO_API_KEY',
): Promise<StockSearchResult[]> {
  const url = `https://api.tiingo.com/tiingo/utilities/search?query=${encodeURIComponent(
    keywords,
  )}&token=${apiKey}`;
  const data = await fetchJson<any[]>(url);

  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    symbol: item.ticker,
    name: item.name,
    type: item.assetType || 'Stock',
    region: item.countryCode || 'US',
    currency: 'USD', // Tiingo search usually implies USD for major tickers, or we default
  }));
}

// ─── Dictionary (Free Dictionary API) ──────────────────────────────────────

export async function fetchDictionaryWord(
  word: string,
): Promise<DictionaryEntry> {
  const data = await fetchJson<any[]>(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );

  if (!Array.isArray(data) || data.length === 0) {
    throw new ApiError(
      `No definition found for "${word}"`,
      undefined,
      'dictionaryapi.dev',
    );
  }

  const entry = data[0];

  return {
    word: entry.word,
    phonetic: entry.phonetic ?? '',
    phonetics: entry.phonetics ?? [],
    meanings: (entry.meanings ?? []).map((m: any) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions ?? []).map((d: any) => ({
        definition: d.definition,
        example: d.example,
        synonyms: d.synonyms ?? [],
        antonyms: d.antonyms ?? [],
      })),
      synonyms: m.synonyms ?? [],
      antonyms: m.antonyms ?? [],
    })),
  };
}

// ─── Translation (MyMemory API) ────────────────────────────────────────────

export async function fetchTranslation(
  text: string,
  from: string = 'en',
  to: string = 'es',
): Promise<Translation> {
  const langPair = `${from}|${to}`;
  const params = new URLSearchParams({
    q: text,
    langpair: langPair,
  });

  const data = await fetchJson<{
    responseStatus: number;
    responseData: {
      translatedText: string;
      match: number;
      detectedLanguage?: string;
    };
  }>(`https://api.mymemory.translated.net/get?${params}`);

  if (data.responseStatus !== 200) {
    throw new ApiError(
      `Translation failed with status ${data.responseStatus}`,
      data.responseStatus,
      'mymemory.translated.net',
    );
  }

  return {
    translatedText: data.responseData.translatedText,
    match: data.responseData.match,
    detectedLanguage: data.responseData.detectedLanguage,
  };
}

// ─── Countries (RestCountries API) ─────────────────────────────────────────

export async function fetchAllCountries(): Promise<CountryData[]> {
  const fields = [
    'name',
    'flags',
    'capital',
    'population',
    'region',
    'currencies',
    'languages',
    'area',
    'timezones',
    'cca3',
  ].join(',');

  return await fetchJson<CountryData[]>(
    `https://restcountries.com/v3.1/all?fields=${fields}`,
  );
}

export async function fetchCountryDetails(code: string): Promise<CountryData> {
  const data = await fetchJson<CountryData[]>(
    `https://restcountries.com/v3.1/alpha/${code}`,
  );
  return data[0];
}

// ─── Weather Code Descriptions ─────────────────────────────────────────────

export const weatherCodeDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export const weatherCodeIcons: Record<number, string> = {
  0: 'weather-sunny',
  1: 'weather-sunny',
  2: 'weather-partly-cloudy',
  3: 'weather-cloudy',
  45: 'weather-fog',
  48: 'weather-fog',
  51: 'weather-rainy',
  53: 'weather-rainy',
  55: 'weather-rainy',
  56: 'weather-snowy-rainy',
  57: 'weather-snowy-rainy',
  61: 'weather-rainy',
  63: 'weather-pouring',
  65: 'weather-pouring',
  66: 'weather-snowy-rainy',
  67: 'weather-snowy-rainy',
  71: 'weather-snowy',
  73: 'weather-snowy',
  75: 'weather-snowy-heavy',
  77: 'weather-snowy',
  80: 'weather-rainy',
  81: 'weather-pouring',
  82: 'weather-pouring',
  85: 'weather-snowy',
  86: 'weather-snowy-heavy',
  95: 'weather-lightning',
  96: 'weather-lightning-rainy',
  99: 'weather-lightning-rainy',
};
