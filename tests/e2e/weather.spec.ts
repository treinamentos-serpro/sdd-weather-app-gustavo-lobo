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
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  const dailyForecast = page.getByRole('region', { name: 'Previsão de 5 dias', exact: true });
  await expect(currentWeather).toBeVisible();
  await expect(currentWeather.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(currentWeather).toContainText(/Temperatura:\s*25 °C/);
  await expect(dailyForecast).toBeVisible();
  await expect(dailyForecast.getByRole('article')).toHaveCount(5);
  await page.getByRole('button', { name: '°F' }).click();
  await expect(currentWeather).toContainText(/Temperatura:\s*78 °F/);
  await expect(currentWeather).not.toContainText('25 °C');
  await expect(page.getByRole('main').getByText(/°F/)).toHaveCount(11);
  await expect(page.locator('[aria-live="polite"]')).toContainText('Fahrenheit');
  await page.getByRole('button', { name: '°C' }).click();
  await expect(currentWeather).toContainText(/Temperatura:\s*25 °C/);
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

test('geocoding sem results mostra nenhuma cidade encontrada sem consultar forecast', async ({
  page,
}) => {
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: {} }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: forecast });
  });

  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Nome da cidade' });
  await search.fill('Atlantis');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  await expect(search).toHaveValue('Atlantis');
  await expect(search).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
  expect(forecastRequests).toBe(0);
});

test('busca renderiza clima e previsão no viewport mobile de 375x812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [{ ...city, country_code: 'BR' }] } }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(currentWeather).toBeVisible();
  await expect(currentWeather).toContainText(/Temperatura:\s*25 °C/);
  await expect(currentWeather.getByRole('img', { name: 'Parcialmente nublado' })).toBeVisible();
  const dailyForecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(dailyForecast).toBeVisible();
  await expect(dailyForecast.getByRole('article')).toHaveCount(5);
  await dailyForecast.getByRole('article').last().scrollIntoViewIfNeeded();
  await expect(dailyForecast.getByRole('article').last()).toBeInViewport();

  await page.getByRole('button', { name: '°F' }).click();
  await expect(currentWeather).toContainText(/Temperatura:\s*78 °F/);
  expect(page.viewportSize()).toEqual({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
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

test('falha de rede no geocoding permite retry do termo enviado mesmo após editar o input', async ({
  page,
}) => {
  const names: (string | null)[] = [];
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    names.push(new URL(route.request().url()).searchParams.get('name'));
    return names.length === 1
      ? route.abort('failed')
      : route.fulfill({ json: { results: [{ ...city, country_code: 'BR' }] } });
  });
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
  await page.goto('/');
  const input = page.getByRole('searchbox', { name: 'Nome da cidade' });
  await input.fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Falha de rede.');
  await expect(page.getByRole('article')).toHaveCount(0);
  await input.fill('Recife');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'São Paulo', exact: true })).toBeVisible();
  expect(names).toEqual(['São Paulo', 'São Paulo']);
  await expect(input).toHaveValue('Recife');
});

test('resposta parcial preserva dados válidos e mostra indisponibilidade sem inventar zero', async ({
  page,
}) => {
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [{ ...city, country_code: 'BR' }] } }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        ...forecast,
        current: { ...forecast.current, temperature_2m: null, weather_code: 999 },
        daily: { ...forecast.daily, temperature_2m_min: [null, 0, 0, 0, 0] },
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const currentWeather = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(currentWeather).toContainText(/Temperatura:\s*Indisponível/);
  await expect(currentWeather.getByRole('img', { name: 'Condição indisponível' })).toBeVisible();
  await expect(currentWeather.getByText('63%', { exact: true })).toBeVisible();
  const days = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('article');
  await expect(days).toHaveCount(5);
  await expect(days.first().getByText('Indisponível', { exact: true })).toBeVisible();
  await expect(days.nth(1).getByText('0 °C', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    'Alguns dados meteorológicos estão indisponíveis.',
  );
  await page.getByRole('button', { name: '°F' }).click();
  await expect(currentWeather).toContainText(/Temperatura:\s*Indisponível/);
  await expect(days.nth(1).getByText('32 °F', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

for (const block of ['current', 'daily'] as const) {
  test(`forecast sem ${block} termina em erro e permite recuperar por retry`, async ({ page }) => {
    let attempts = 0;
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: { results: [{ ...city, country_code: 'BR' }] } }),
    );
    await page.route('https://api.open-meteo.com/**', (route) => {
      attempts += 1;
      return route.fulfill({ json: attempts === 1 ? { ...forecast, [block]: null } : forecast });
    });
    await page.goto('/');
    await page.getByRole('searchbox').fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Resposta incompleta');
    await expect(page.getByRole('searchbox')).toBeEnabled();
    await expect(page.getByRole('article')).toHaveCount(0);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('article')).toHaveCount(5);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(attempts).toBe(2);
  });
}

test('timeout de 10 segundos encerra loading e permite nova busca por retry', async ({ page }) => {
  await page.clock.install();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let attempts = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    attempts += 1;
    if (attempts === 1) await pending;
    await route.fulfill({ json: { results: [{ ...city, country_code: 'BR' }] } });
  });
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
  await page.goto('/');
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Consultando o clima');
  await page.clock.runFor(10_000);
  await expect(page.getByRole('alert')).toHaveText('A requisição demorou demais.');
  await expect(page.getByRole('searchbox')).toBeEnabled();
  release();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(attempts).toBe(2);
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
