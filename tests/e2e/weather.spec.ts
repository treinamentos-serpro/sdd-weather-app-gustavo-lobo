import { expect, test } from '@playwright/test';
import { mockWeatherData } from '../../src/mocks/weather';

const city = mockWeatherData.city;
const forecast = {
  timezone: mockWeatherData.timezone,
  current: {
    time: Date.parse('2026-10-27T18:00:00Z') / 1000,
    temperature_2m: 25.34,
    relative_humidity_2m: 63.4,
    weather_code: 2,
    wind_speed_10m: 12.34,
    surface_pressure: 925.67,
  },
  hourly: { time: [Date.parse('2026-10-27T18:00:00Z') / 1000], precipitation: [0.46] },
  daily: {
    time: mockWeatherData.forecast.map((day) => Date.parse(`${day.date}T03:00:00Z`) / 1000),
    temperature_2m_min: mockWeatherData.forecast.map((day) => day.minTemperatureC),
    temperature_2m_max: mockWeatherData.forecast.map((day) => day.maxTemperatureC),
    weather_code: mockWeatherData.forecast.map((day) => day.condition?.code),
    precipitation_sum: mockWeatherData.forecast.map((day) => day.precipitationSumMm),
    precipitation_probability_max: mockWeatherData.forecast.map(
      (day) => day.precipitationProbabilityMaxPct,
    ),
  },
};

test('busca, cinco dias responsivos e troca de unidade sem novas consultas', async ({ page }) => {
  let requests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    requests += 1;
    return route.fulfill({ json: { results: [{ ...city, country_code: 'BR' }] } });
  });
  await page.route('https://api.open-meteo.com/**', (route) => {
    requests += 1;
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Como está o clima por aí?' })).toBeVisible();
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByRole('main').getByText(/°F/)).toHaveCount(11);
  await expect(page.locator('[aria-live="polite"]')).toContainText('Fahrenheit');
  await page.getByRole('button', { name: '°C' }).click();
  await expect(page.getByRole('main').getByText(/°C/)).toHaveCount(11);

  const grid = page.getByRole('list');
  for (const width of [320, 375, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await grid.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
      ),
    ).toBe(width >= 1024 ? 5 : width >= 640 ? 3 : 2);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(requests).toBe(2);
});

test('teclado, vazio, erro de forecast e retry sem repetir geocoding', async ({ page }) => {
  let searches = 0;
  let forecasts = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    searches += 1;
    return route.fulfill({ json: searches === 1 ? {} : { results: [city] } });
  });
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecasts += 1;
    return forecasts === 1
      ? route.fulfill({ status: 503, body: '' })
      : route.fulfill({ json: forecast });
  });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveAccessibleDescription(
    'Digite o nome de uma cidade.',
  );
  await page.keyboard.type('Atlantis');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  expect(forecasts).toBe(0);
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('alert')).toContainText('HTTP 503');
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(searches).toBe(2);
  expect(forecasts).toBe(2);
  await expect(page.getByRole('main')).toBeFocused();
});

test('loading acessível e sem animação com movimento reduzido', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    await pending;
    await route.fulfill({ json: {} });
  });
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('searchbox').fill('Recife');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('searchbox')).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Consultando o clima');
  expect(
    await page
      .getByRole('status')
      .locator('[aria-hidden="true"]')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  release();
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
});
