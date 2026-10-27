import type { WeatherCondition, WeatherIconKey } from '../types/weather';

export const weatherIcons: Record<WeatherIconKey, string> = {
  clear: '☀️',
  cloudy: '☁️',
  fog: '🌫️',
  drizzle: '🌦️',
  rain: '🌧️',
  snow: '❄️',
  thunderstorm: '⛈️',
  unknown: '❔',
};

const weatherCodes: Partial<Record<number, { labelPtBr: string; iconKey: WeatherIconKey }>> = {
  0: { labelPtBr: 'Céu limpo', iconKey: 'clear' },
  1: { labelPtBr: 'Predominantemente limpo', iconKey: 'clear' },
  2: { labelPtBr: 'Parcialmente nublado', iconKey: 'cloudy' },
  3: { labelPtBr: 'Nublado', iconKey: 'cloudy' },
  45: { labelPtBr: 'Nevoeiro', iconKey: 'fog' },
  48: { labelPtBr: 'Nevoeiro com geada', iconKey: 'fog' },
  51: { labelPtBr: 'Garoa fraca', iconKey: 'drizzle' },
  53: { labelPtBr: 'Garoa moderada', iconKey: 'drizzle' },
  55: { labelPtBr: 'Garoa intensa', iconKey: 'drizzle' },
  56: { labelPtBr: 'Garoa congelante fraca', iconKey: 'drizzle' },
  57: { labelPtBr: 'Garoa congelante intensa', iconKey: 'drizzle' },
  61: { labelPtBr: 'Chuva fraca', iconKey: 'rain' },
  63: { labelPtBr: 'Chuva moderada', iconKey: 'rain' },
  65: { labelPtBr: 'Chuva forte', iconKey: 'rain' },
  66: { labelPtBr: 'Chuva congelante fraca', iconKey: 'rain' },
  67: { labelPtBr: 'Chuva congelante forte', iconKey: 'rain' },
  71: { labelPtBr: 'Neve fraca', iconKey: 'snow' },
  73: { labelPtBr: 'Neve moderada', iconKey: 'snow' },
  75: { labelPtBr: 'Neve intensa', iconKey: 'snow' },
  77: { labelPtBr: 'Grãos de neve', iconKey: 'snow' },
  80: { labelPtBr: 'Pancadas de chuva fracas', iconKey: 'rain' },
  81: { labelPtBr: 'Pancadas de chuva moderadas', iconKey: 'rain' },
  82: { labelPtBr: 'Pancadas de chuva violentas', iconKey: 'rain' },
  85: { labelPtBr: 'Pancadas de neve fracas', iconKey: 'snow' },
  86: { labelPtBr: 'Pancadas de neve intensas', iconKey: 'snow' },
  95: { labelPtBr: 'Trovoada', iconKey: 'thunderstorm' },
  96: { labelPtBr: 'Trovoada com granizo fraco', iconKey: 'thunderstorm' },
  99: { labelPtBr: 'Trovoada com granizo forte', iconKey: 'thunderstorm' },
};

export function getWeatherCondition(code: number): WeatherCondition {
  const condition = weatherCodes[code] ?? {
    labelPtBr: 'Condição indisponível',
    iconKey: 'unknown',
  };
  return { code, ...condition };
}
