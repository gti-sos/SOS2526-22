// @ts-check
import { test, expect } from '@playwright/test';

const app = 'http://localhost:3000';

test.describe.serial('Pruebas E2E - Ozone Depleting Substance Consumptions', () => {

    /** @param {import('@playwright/test').Page} page */
    async function cargarDatosIniciales(page) {
        await page.goto(`${app}/ozone-depleting-substance-consumptions`);
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
        await page.waitForTimeout(2000);
    }

    // -----------------------------------------------------------------------
    // i. Crear un nuevo recurso
    // -----------------------------------------------------------------------
    test('i. Crear un nuevo recurso', async ({ page }) => {
        await cargarDatosIniciales(page);

        await page.getByRole('button', { name: 'Nuevo recurso' }).click();
        await page.waitForTimeout(500);

        const inputs = page.locator('.create-card input');
        await inputs.nth(0).fill('test-country');
        await inputs.nth(1).fill('tst');
        await inputs.nth(2).fill('2099');
        await inputs.nth(3).fill('10');
        await inputs.nth(4).fill('20');
        await inputs.nth(5).fill('30');
        await inputs.nth(6).fill('40');
        await inputs.nth(7).fill('50');
        await inputs.nth(8).fill('60');

        await page.locator('.create-card button[type="submit"]').click();
        await page.waitForTimeout(1000);

        await expect(page.locator('.msg-success')).toContainText('Recurso creado correctamente');
    });

    // -----------------------------------------------------------------------
    // ii. Listar todos los recursos
    // -----------------------------------------------------------------------
    test('ii. Listar todos los recursos', async ({ page }) => {
        await cargarDatosIniciales(page);

        const rows = page.locator('.table tbody tr');
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);

        await expect(page.locator('.page-info')).toBeVisible();
    });

    // -----------------------------------------------------------------------
    // iii. Borrar todos los recursos
    // -----------------------------------------------------------------------
    test('iii. Borrar todos los recursos', async ({ page }) => {
        await cargarDatosIniciales(page);

        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Eliminar todo' }).click();
        await page.waitForTimeout(1000);

        await expect(page.locator('.msg-success')).toContainText('Todos los recursos eliminados');
        await expect(page.locator('.empty')).toBeVisible();
    });

    // -----------------------------------------------------------------------
    // iv. Borrar un recurso concreto
    // -----------------------------------------------------------------------
    test('iv. Borrar un recurso concreto', async ({ page }) => {
        await cargarDatosIniciales(page);

        const fila = page.locator('.table tbody tr').first();
        const pais = await fila.locator('td').nth(0).innerText();
        const anio = await fila.locator('td').nth(2).innerText();

        page.once('dialog', dialog => dialog.accept());
        await fila.locator('button:has-text("Borrar")').click();
        await page.waitForTimeout(1000);

        await expect(page.locator('.msg-success')).toContainText('Recurso eliminado');

        await page.fill('input[placeholder="Ej. japan"]', pais);
        await page.fill('input[placeholder="Ej. 2013"]', anio);
        await page.getByRole('button', { name: 'Buscar' }).click();
        await page.waitForTimeout(1000);

        await expect(page.locator('.msg-error')).toContainText('No hay resultados');
    });

    // -----------------------------------------------------------------------
    // v. Editar un recurso en vista separada
    // -----------------------------------------------------------------------
    test('v. Editar un recurso en vista separada', async ({ page }) => {
        await cargarDatosIniciales(page);

        const fila = page.locator('.table tbody tr').first();
        await fila.locator('button:has-text("Editar")').click();
        await page.waitForTimeout(500);

        await expect(page.locator('.edit-card')).toBeVisible();

        // Modificamos el último input no deshabilitado (CFC)
        const editInputs = page.locator('.edit-card input:not([disabled])');
        const count = await editInputs.count();
        await editInputs.nth(count - 1).fill('12345');

        await page.locator('.edit-card button[type="submit"]').click();

        // Esperamos a que el formulario de edición se cierre (señal de éxito)
        await expect(page.locator('.edit-card')).not.toBeVisible({ timeout: 8000 });

        // Verificamos que el valor 12345 aparece en la tabla
        await expect(page.locator('.table tbody')).toContainText('12345', { timeout: 5000 });
    });

    // -----------------------------------------------------------------------
    // vi. Buscar recursos usando la API
    // -----------------------------------------------------------------------
    test('vi. Buscar recursos por rango de años', async ({ page }) => {
        await cargarDatosIniciales(page);

        await page.fill('input[placeholder="Ej. 2010"]', '2009');
        await page.fill('input[placeholder="Ej. 2020"]', '2013');
        await page.getByRole('button', { name: 'Buscar' }).click();
        await page.waitForTimeout(1000);

        const rows = page.locator('.results-card tbody tr');
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const yearText = await rows.nth(i).locator('td:nth-child(3)').innerText();
            const year = parseInt(yearText);
            expect(year).toBeGreaterThanOrEqual(2009);
            expect(year).toBeLessThanOrEqual(2013);
        }
    });

});