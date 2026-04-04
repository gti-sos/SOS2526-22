import { test, expect } from '@playwright/test';

// Usamos el mismo puerto que el resto del grupo
const app = 'http://localhost:3000';

test.describe.serial('E2E Tests - Gestión de Emisiones CO2 (JMV)', () => {

    // Test 1: Listar todos los recursos 
    test('Debe cargar la página y listar los recursos correctamente', async ({ page }) => {
        await page.goto(`${app}/co2-emissions-stats`);
        await page.waitForTimeout(1000); 
        await expect(page.locator('h1', { hasText: 'Gestión de Emisiones CO2' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'País' })).toBeVisible();
        
        const cantidad = await page.locator('tbody tr').count();
        expect(cantidad).toBeGreaterThan(0); 
    });

    // Test 2: Crear un recurso 
    test('Debe permitir crear un nuevo recurso y mostrar mensaje de éxito', async ({ page }) => {
        await page.goto(`${app}/co2-emissions-stats`);
        await page.waitForTimeout(1000);
        
        await page.locator('.create-row input[placeholder="País"]').fill('TestCountry');
        await page.locator('.create-row input[placeholder="Año"]').fill('2099');
        const inputs = page.locator('.create-row input[type="number"]');
        await inputs.nth(1).fill('10');
        await inputs.nth(2).fill('20');
        await inputs.nth(3).fill('30');
        await inputs.nth(4).fill('40');
        await inputs.nth(5).fill('50');
        await inputs.nth(6).fill('60');
        await inputs.nth(7).fill('70');

        await page.locator('button:has-text("Añadir")').click();
        await page.waitForTimeout(1000);

        const successMessage = page.locator('.msg-success');
        await expect(successMessage).toHaveText('Recurso creado correctamente.');
        await expect(page.locator('td', { hasText: 'TestCountry' })).toBeVisible();
    });

    // Test 3: Borrar un recurso concreto 
    test('Debe permitir borrar un recurso concreto', async ({ page }) => {
        await page.goto(`${app}/co2-emissions-stats`);
        await page.waitForTimeout(1000);

        // Preparamos la aceptación del cuadro de diálogo nativo de confirmación
        page.once('dialog', dialog => dialog.accept());
        
        // Hacemos clic en el botón de borrar de la fila que acabamos de crear (o cualquier otra)
        // Buscamos la fila que contiene "TestCountry" y hacemos clic en su botón de eliminar
        const row = page.locator('tbody tr', { hasText: 'TestCountry' });
        await row.locator('.btn-delete').click();
        await page.waitForTimeout(1000);

        // Verificamos el mensaje de éxito
        await expect(page.locator('.msg-success')).toContainText('Recurso eliminado.');
    });

    // Test 4: Editar un recurso 
    test('Debe permitir editar un recurso en vista separada', async ({ page }) => {
        await page.goto(`${app}/co2-emissions-stats`);
        await page.waitForTimeout(1000);

        // Hacemos clic en el enlace de edición (el emoji del lápiz ✏️) de la primera fila de datos
        // Usamos el texto del enlace o la clase, en tu caso la clase 'btn-icon' que no es 'btn-delete'
        const row = page.locator('tbody tr').nth(1); // nth(0) es la fila de crear, nth(1) es la primera de datos
        await row.locator('a.btn-icon').first().click();
        
        // Verificamos que hemos cambiado de URL
        await page.waitForURL(/\/co2-emissions-stats\/.+/);
        await page.waitForTimeout(1000);

        // Editamos un campo (por ejemplo, Savanna Fire)
        const inputs = page.locator('input[type="number"]');
        await inputs.nth(0).fill('9999');
        
        // Guardamos
        await page.locator('button', { hasText: 'Guardar Cambios' }).click();
        await page.waitForTimeout(1000);

        // Verificamos el mensaje
        await expect(page.locator('.msg-success')).toContainText('Recurso actualizado con éxito.');
    });

    // Test 5: Buscar recursos 
    test('Debe buscar recursos usando los filtros y actualizar la tabla', async ({ page }) => {
        await page.goto(`${app}/co2-emissions-stats`);
        await page.waitForTimeout(1000);

        // Rellenamos el input de búsqueda de país en el thead
        const searchInput = page.locator('.search-row input[placeholder="🔍 País..."]');
        await searchInput.fill('Algeria');
        
        // Simulamos presionar 'Enter' para disparar el evento onchange
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);

        // Verificamos que sale el mensaje de éxito
        await expect(page.locator('.msg-success')).toContainText('Búsqueda completada.');
        
        // Verificamos que la tabla contiene 'Algeria' y probablemente no contenga 'Andorra'
        const tbody = page.locator('tbody');
        await expect(tbody).toContainText('Algeria');
    });

    // Test 6: Borrar todos los recursos 
    test('Debe borrar todos los recursos', async ({ page }) => {
        await page.goto(`${app}/co2-emissions-stats`);
        await page.waitForTimeout(1000);

        // Preparamos confirm
        page.once('dialog', dialog => dialog.accept());
        
        // Clic en borrar todo
        await page.locator('button', { hasText: 'Eliminar todos' }).click();
        await page.waitForTimeout(1000);

        // Verificamos el mensaje
        await expect(page.locator('.msg-success')).toContainText('Base de datos vaciada.');
    });
});