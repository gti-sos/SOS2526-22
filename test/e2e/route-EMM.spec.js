// test/e2e/route-EMM.spec.js
import { test, expect } from '@playwright/test';

const app = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(app + '/ozone-depleting-substance-consumptions');
  await page.waitForSelector('.container', { timeout: 10000 });

  // Cargar datos iniciales (limpia cualquier estado previo)
  await page.click('text=Cargar datos iniciales');
  await expect(page.locator('.msg-success')).toHaveText(/Datos iniciales cargados/, { timeout: 10000 });

  // Esperar a que la tabla tenga al menos una fila (los datos iniciales tienen 11 registros)
  await page.waitForSelector('.table tbody tr', { timeout: 10000 });
});

// ----------------------------------------------------------------------
// i. Crear un nuevo recurso
// ----------------------------------------------------------------------
test('i. Crear un nuevo recurso', async ({ page }) => {
  await page.click('text=Nuevo recurso');
  await page.waitForSelector('form'); // formulario de creación

  // Rellenar los campos obligatorios y algunos numéricos
  await page.fill('input[placeholder="COUNTRY"]', 'prueba');
  await page.fill('input[placeholder="CODE"]', 'prb');
  await page.fill('input[placeholder="YEAR"]', '2025');
  await page.fill('input[placeholder="METHYL CHLOROFORM"]', '10');
  await page.fill('input[placeholder="CFC"]', '5');

  // Enviar formulario
  await page.click('button[type="submit"]');
  await expect(page.locator('.msg-success')).toHaveText(/Recurso creado correctamente/, { timeout: 5000 });

  // Verificar que el nuevo recurso aparece en la tabla (pagina 1)
  await expect(page.locator('.table tbody tr', { hasText: 'prueba' })).toBeVisible();
});

// ----------------------------------------------------------------------
// ii. Listar todos los recursos
// ----------------------------------------------------------------------
test('ii. Listar todos los recursos', async ({ page }) => {
  const rows = await page.locator('.table tbody tr').count();
  expect(rows).toBeGreaterThan(0);
});

// ----------------------------------------------------------------------
// iii. Borrar todos los recursos
// ----------------------------------------------------------------------
test('iii. Borrar todos los recursos', async ({ page }) => {
  // Escuchar el diálogo de confirmación y aceptarlo
  page.once('dialog', dialog => dialog.accept());

  await page.click('text=Eliminar todo');
  await expect(page.locator('.msg-success')).toHaveText(/Todos los recursos eliminados/, { timeout: 5000 });

  // Verificar que la tabla está vacía y se muestra el mensaje de "No hay recursos"
  await expect(page.locator('.empty')).toBeVisible();
});

// ----------------------------------------------------------------------
// iv. Borrar un recurso concreto
// ----------------------------------------------------------------------
test('iv. Borrar un recurso concreto', async ({ page }) => {
  // Tomamos la primera fila de la tabla principal (antes de borrar)
  const fila = page.locator('.table tbody tr').first();
  const nombreRecurso = await fila.locator('td').first().innerText();
  const añoRecurso = await fila.locator('td:nth-child(3)').innerText();

  // Aceptar el diálogo de confirmación
  page.once('dialog', dialog => dialog.accept());

  // Hacer clic en el botón "Borrar" de esa fila
  await fila.locator('button:has-text("Borrar")').click();

  // Esperar mensaje de éxito
  await expect(page.locator('.msg-success')).toHaveText(/Recurso eliminado/, { timeout: 5000 });

  // Verificar que el recurso ya no aparece en la tabla (recargamos la tabla actual)
  // La tabla puede haberse recargado con la misma página; esperamos a que desaparezca la fila
  await expect(page.locator(`.table tbody tr:has-text("${nombreRecurso}"):has-text("${añoRecurso}")`)).toHaveCount(0);
});

// ----------------------------------------------------------------------
// v. Editar un recurso (vista separada)
// ----------------------------------------------------------------------
test('v. Editar un recurso (vista separada)', async ({ page }) => {
  // 1. Limpiar filtros para mostrar la tabla principal
  await page.click('button:has-text("Limpiar filtros")');
  await page.waitForSelector('.table tbody tr', { timeout: 5000 });

  // 2. Obtener número total de páginas
  const pageInfo = page.locator('.page-info');
  let totalPages = 1;
  const pageInfoText = await pageInfo.textContent();
  if (pageInfoText) {
    const match = pageInfoText.match(/de (\d+)/);
    if (match) totalPages = parseInt(match[1]);
  }

  let filaEncontrada = false;
  let paginaActual = 1;

  while (!filaEncontrada && paginaActual <= totalPages) {
    // Buscar en la página actual la fila que contenga "asia" y "2012"
    const fila = page.locator('.table tbody tr', { hasText: 'asia' }).filter({ hasText: '2012' }).first();
    const count = await fila.count();
    if (count > 0) {
      await fila.scrollIntoViewIfNeeded();
      await expect(fila).toBeVisible();
      await fila.locator('button', { name: 'Editar' }).click();
      filaEncontrada = true;
      break;
    }

    // Si no está en esta página, ir a la siguiente (si existe)
    if (paginaActual < totalPages) {
      await page.click('button:has-text("▶")');
      await page.waitForSelector('.table tbody tr', { timeout: 5000 });
      paginaActual++;
    } else {
      break;
    }
  }

  if (!filaEncontrada) {
    throw new Error('No se encontró el recurso "asia" con año 2012 en ninguna página');
  }

  // 3. Esperar que aparezca el formulario de edición
  await expect(page.locator('.edit-card')).toBeVisible();

  // 4. Localizar el input del campo CFC usando el label (más robusto)
  const cfcInput = page.locator('.edit-card label:has-text("cfc") + input');
  await cfcInput.fill('999');

  // 5. Guardar cambios
  await page.click('button[type="submit"]');
  await expect(page.locator('.msg-success')).toHaveText(/Recurso actualizado correctamente/, { timeout: 5000 });

  // 6. Esperar a que desaparezca el mensaje (opcional)
  await page.locator('.msg-success').waitFor({ state: 'hidden', timeout: 3000 });

  // 7. Verificar el cambio usando la búsqueda avanzada
  await page.fill('input[placeholder="Ej. japan"]', 'asia');
  await page.click('button:has-text("Buscar")');
  await page.waitForSelector('.results-card tbody tr', { timeout: 5000 });

  await expect(page.locator('.results-card')).toContainText('999');
});

// ----------------------------------------------------------------------
// vi. Búsqueda por rango de años
// ----------------------------------------------------------------------
test('vi. Búsqueda por rango de años', async ({ page }) => {
  // Rellenar los campos de rango (Desde año y Hasta año)
  await page.fill('input[placeholder="Ej. 2010"]', '2010');
  await page.fill('input[placeholder="Ej. 2020"]', '2015');

  await page.click('button:has-text("Buscar")');
  await page.waitForSelector('.results-card tbody tr', { timeout: 5000 });

  const rows = await page.locator('.results-card tbody tr').all();
  expect(rows.length).toBeGreaterThan(0); // Asegurar que hay resultados

  for (const row of rows) {
    const yearText = await row.locator('td:nth-child(3)').innerText();
    const year = parseInt(yearText);
    expect(year).toBeGreaterThanOrEqual(2010);
    expect(year).toBeLessThanOrEqual(2015);
  }
});