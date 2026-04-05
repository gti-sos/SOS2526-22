// @ts-check
import { test, expect } from '@playwright/test';

// Asegúrate de que esta URL base coincide con el puerto de tu frontend
let app = 'http://localhost:3000'; 

test.describe.serial('Pruebas E2E - Panel Agricultura', () => {

  test('i. Cargar datos iniciales', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);
    
    await page.locator('.select-version').selectOption('v2');
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: /Cargar Datos Iniciales/i }).click();
    await page.waitForTimeout(2000);
    
    // Cambiado para buscar en toda la tabla y darle un pequeño margen de tiempo
    await expect(page.locator('table')).not.toContainText('No se han encontrado resultados', { timeout: 5000 });
  });

  test('ii. Listar todos los recursos', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);
    
    const cantidad = await page.locator('tbody tr').count();
    expect(cantidad).toBeGreaterThan(0);
  });

  test('iii. Crear un nuevo registro', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);
    await page.locator('.select-version').selectOption('v2');
    await page.waitForTimeout(500);

    // 1. Abrimos el formulario
    await page.getByRole('button', { name: /Nuevo Registro/i }).click();
    await page.waitForTimeout(1000);

    // 2. Apuntamos al cajón del formulario (.form-box)
    const form = page.locator('.form-box');
    
    // 3. Rellenamos los campos
    await form.getByPlaceholder(/^País$/).fill('E2ETestland');
    await form.getByPlaceholder(/^Año$/).fill('2050');
    await form.getByPlaceholder(/^Cultivo$/).fill('Tomate E2E');
    await form.getByPlaceholder(/^Temp$/).fill('25');
    await form.getByPlaceholder(/^Prec$/).fill('150');

    // 4. Clic en guardar
    await form.getByRole('button', { name: 'Guardar' }).click();
    
    // 5. Verificar mensaje de éxito con timeout extendido
    await expect(page.locator('.msg.success')).toContainText('Recurso creado', { timeout: 5000 });
  });

  test('iv. Buscar recursos utilizando los filtros', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);

    // Rellenamos el buscador
    await page.getByPlaceholder('🔎 País').fill('E2ETestland');
    await page.waitForTimeout(2000); 

    // CORRECCIÓN: Buscamos en toda la tabla ('table') en vez de ('tbody')
    await expect(page.locator('table')).toContainText(/E2ETestland/i, { timeout: 5000 });
  });

  test('v. Editar recursos', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);
    await page.locator('.select-version').selectOption('v2');
    
    // Filtramos primero para encontrarlo fácil
    await page.getByPlaceholder('🔎 País').fill('E2ETestland');
    await page.waitForTimeout(2000);

    // Clic en tu botón del lápiz
    await page.locator('.btn-edit').first().click();
    await page.waitForTimeout(1000);

    // Apuntamos al formulario de edición
    const editForm = page.locator('.form-box.edit');
    await editForm.getByPlaceholder(/^Cultivo$/).fill('Cultivo Editado');
    await editForm.getByRole('button', { name: 'Actualizar' }).click();
    
    // Verificamos mensaje y la tabla en general
    await expect(page.locator('.msg.success')).toContainText('Actualizado', { timeout: 5000 });
    await expect(page.locator('table')).toContainText(/Cultivo Editado/i, { timeout: 5000 });
  });

  test('vi. Borrar un recurso concreto', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);
    await page.locator('.select-version').selectOption('v2');

    // Filtramos
    await page.getByPlaceholder('🔎 País').fill('E2ETestland');
    await page.waitForTimeout(2000);

    // Preparamos la aceptación del confirm() de JavaScript
    page.once('dialog', dialog => dialog.accept());
    
    // Clic en la papelera roja
    await page.locator('.btn-del').first().click();
    
    // Verificamos mensaje
    await expect(page.locator('.msg.success')).toContainText('Eliminado', { timeout: 5000 });
  });

  test('vii. Borrar todos los recursos', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);
    await page.locator('.select-version').selectOption('v2');

    // Preparamos confirm
    page.once('dialog', dialog => dialog.accept());
    
    // Clic en borrar todo
    await page.getByRole('button', { name: /Borrar Todo/i }).click();
    
    // Verificamos el mensaje y que la tabla diga que está vacía
    await expect(page.locator('.msg.success')).toContainText('Base de datos vaciada', { timeout: 5000 });
    await expect(page.locator('table')).toContainText('No se han encontrado resultados', { timeout: 5000 });
  });

});