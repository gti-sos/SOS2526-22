// test/e2e/route-EMM.spec.js
import { test, expect } from '@playwright/test';

const app = "http://localhost:3000";

async function resetData(page) {
  await page.click('text=Cargar datos iniciales');
  await expect(page.locator('.msg-success')).toHaveText(/Datos iniciales cargados/);
  await page.locator('.msg-success').waitFor({ state: 'hidden', timeout: 6000 });
  // Esperar a que la tabla tenga al menos una fila (timeout ampliado)
  await page.waitForSelector('.table tbody tr', { timeout: 10000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto(app + '/ozone-depleting-substance-consumptions');
  await page.waitForSelector('.container', { timeout: 10000 });
  await resetData(page);
});

test('i. Crear un nuevo recurso', async ({ page }) => {
  // Abrir formulario de creación
  await page.click('text=Nuevo recurso');
  await page.waitForSelector('form');

  // Rellenar campos con los placeholders reales
  await page.fill('input[placeholder="COUNTRY"]', 'prueba');
  await page.fill('input[placeholder="CODE"]', 'prb');
  await page.fill('input[placeholder="YEAR"]', '2025');
  await page.fill('input[placeholder="METHYL CHLOROFORM"]', '10');
  await page.fill('input[placeholder="CFC"]', '5');

  // Enviar formulario
  await page.click('button[type="submit"]');

  // Verificar mensaje de éxito (suficiente para probar la creación)
  await expect(page.locator('.msg-success')).toHaveText(/Recurso creado correctamente/, { timeout: 5000 });
  // Opcional: comprobar que existe mediante búsqueda (para mayor robustez)
  await page.fill('input[placeholder="Ej. japan"]', 'prueba');
  await page.click('button:has-text("Buscar")');
  await expect(page.locator('.results-card')).toBeVisible();
  await expect(page.locator('.results-card')).toContainText('prueba');
});

test('ii. Listar todos los recursos', async ({ page }) => {
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeGreaterThan(0);
  // Verificar que algún recurso conocido aparece (p.e. "costa-rica")
  await expect(page.locator('table')).toContainText('costa-rica');
});

test('iii. Borrar todos los recursos', async ({ page }) => {
  page.once('dialog', dialog => dialog.accept());
  await page.click('text=Eliminar todo');
  await expect(page.locator('.msg-success')).toHaveText(/Todos los recursos eliminados/, { timeout: 5000 });
  await expect(page.locator('.empty')).toBeVisible();
});

test('iv. Borrar un recurso concreto', async ({ page }) => {
  // Buscar un recurso concreto (ej. costa-rica, 1998) usando la búsqueda avanzada
  await page.fill('input[placeholder="Ej. japan"]', 'costa-rica');
  await page.click('button:has-text("Buscar")');
  await expect(page.locator('.results-card')).toBeVisible();

  // En los resultados, localizar la fila con el año 1998 y hacer clic en Borrar
  const row = page.locator('.results-card tbody tr', { hasText: '1998' }).first();
  page.once('dialog', dialog => dialog.accept());
  await row.locator('button:has-text("Borrar")').click();
  await expect(page.locator('.msg-success')).toHaveText(/Recurso eliminado/, { timeout: 5000 });

  // Verificar que ya no aparece en los resultados de la misma búsqueda
  await page.click('button:has-text("Buscar")'); // refrescar búsqueda
  await expect(page.locator('.results-card')).not.toContainText('costa-rica');
  await expect(page.locator('.results-card')).not.toContainText('1998');
});

test('v. Editar un recurso (vista separada)', async ({ page }) => {
  // Buscar el recurso "asia" con año 2012
  await page.fill('input[placeholder="Ej. japan"]', 'asia');
  await page.click('button:has-text("Buscar")');
  await expect(page.locator('.results-card')).toBeVisible();

  const row = page.locator('.results-card tbody tr', { hasText: '2012' }).first();
  await row.locator('button:has-text("Editar")').click();
  await expect(page.locator('.edit-card')).toBeVisible();

  // Modificar el valor de CFC (último input numérico)
  const cfcInput = page.locator('.edit-card input[type="number"]').last();
  await cfcInput.fill('999');
  await page.click('button[type="submit"]');
  await expect(page.locator('.msg-success')).toHaveText(/Recurso actualizado correctamente/, { timeout: 5000 });

  // Verificar el cambio en la tabla principal (puede que el recurso esté en la primera página)
  await expect(page.locator('table')).toContainText('999');
});

test('vi. Búsqueda por rango de años', async ({ page }) => {
  await page.fill('input[placeholder="Ej. 2010"]', '2010');
  await page.fill('input[placeholder="Ej. 2020"]', '2015');
  await page.click('button:has-text("Buscar")');
  await expect(page.locator('.results-card')).toBeVisible();

  const rows = await page.locator('.results-card tbody tr').all();
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    const yearText = await row.locator('td:nth-child(3)').innerText();
    const year = parseInt(yearText);
    expect(year).toBeGreaterThanOrEqual(2010);
    expect(year).toBeLessThanOrEqual(2015);
  }
});