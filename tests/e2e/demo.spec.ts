import { expect, test } from '@playwright/test';

test('demonstração responsiva com busca, estados e troca de unidade sem API', async ({ page }) => {
  const apiRequests: string[] = [];
  await page.route('https://**/*open-meteo.com/**', (route) => {
    apiRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Como está o clima por aí?' })).toBeVisible();
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);

  const grid = page.getByRole('list');
  const columns = await grid.evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe((page.viewportSize()?.width ?? 0) >= 1024 ? 5 : 2);

  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('main').getByText(/°F/)).toHaveCount(11);
  await page.getByRole('button', { name: '°C' }).click();
  await expect(page.getByRole('main').getByText(/°C/)).toHaveCount(11);

  await page.getByRole('button', { name: 'Carregando' }).click();
  await expect(page.getByRole('searchbox')).toBeDisabled();
  await page.getByRole('button', { name: 'Sem resultados' }).click();
  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  await page.getByRole('button', { name: 'Erro', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('erro simulado');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);

  for (const width of [320, 640, 1024]) {
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
  expect(apiRequests).toEqual([]);
});

test('foco por teclado, validação e recuperação acessíveis', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Ir para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveAccessibleDescription(
    'Digite o nome de uma cidade.',
  );
  await page.keyboard.type('Recife');
  await page.keyboard.press('Enter');
  const announcement = page.locator('[aria-live="polite"]');
  await expect(announcement).toContainText('Exemplo de São Paulo disponível');
  const fahrenheit = page.getByRole('button', { name: '°F' });
  await fahrenheit.focus();
  await page.keyboard.press('Space');
  await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  await expect(announcement).toContainText('Fahrenheit');
  expect(
    await fahrenheit.evaluate((element) => getComputedStyle(element).textDecorationLine),
  ).toContain('underline');
  expect(await fahrenheit.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
    'none',
  );

  await page.getByRole('button', { name: 'Erro', exact: true }).click();
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('textos longos e todos os estados sem cortes de 320 px a desktop', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('A'.repeat(80));
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  for (const width of [320, 375, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const state of ['Inicial', 'Carregando', 'Sem resultados', 'Erro', 'Sucesso']) {
      await page.getByRole('button', { name: state, exact: true }).click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    const clippedText = await page
      .getByRole('main')
      .locator('h2, h3, p, dt, dd')
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.scrollWidth > element.clientWidth)
          .map((element) => element.textContent),
      );
    expect(clippedText).toEqual([]);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Carregando' }).click();
  expect(
    await page
      .getByRole('status')
      .locator('[aria-hidden="true"]')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
});
