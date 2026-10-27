import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';
type Operation = { type: 'search'; name: string } | { type: 'select'; city: City };

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

const initialState: WeatherState = {
  status: 'idle',
  data: null,
  cities: [],
  error: null,
  query: '',
};

export default function useWeather() {
  const [state, setState] = useState<WeatherState>(initialState);
  const generation = useRef(0);
  const lastOperation = useRef<Operation | null>(null);

  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );

  const run = useCallback(async (operation: Operation) => {
    const id = ++generation.current;
    lastOperation.current = operation;
    setState((previous) => ({
      ...previous,
      status: 'loading',
      data: null,
      error: null,
      ...(operation.type === 'search' ? { query: operation.name, cities: [] } : {}),
    }));
    try {
      let city: City;
      if (operation.type === 'search') {
        const cities = await searchCities(operation.name);
        if (id !== generation.current) return;
        setState((previous) => ({ ...previous, cities }));
        if (cities.length === 0) {
          setState((previous) => ({ ...previous, status: 'empty' }));
          return;
        }
        city = cities[0];
        lastOperation.current = { type: 'select', city };
      } else {
        city = operation.city;
      }
      const data = await getWeather(city);
      if (id !== generation.current) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (cause) {
      if (id !== generation.current) return;
      const error =
        cause instanceof WeatherServiceError
          ? cause.message
          : operation.type === 'search'
            ? 'Não foi possível concluir a busca por cidades. Tente novamente.'
            : 'Não foi possível concluir a consulta do clima. Tente novamente.';
      setState((previous) => ({ ...previous, status: 'error', error }));
    }
  }, []);

  const search = useCallback((name: string) => run({ type: 'search', name: name.trim() }), [run]);
  const selectCity = useCallback((city: City) => run({ type: 'select', city }), [run]);
  const retry = useCallback(
    () => (lastOperation.current ? run(lastOperation.current) : Promise.resolve()),
    [run],
  );

  return { ...state, search, selectCity, retry };
}
