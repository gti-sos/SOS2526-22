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
    
    const rows = page.locator('tbody tr');
    await expect(rows.nth(0)).not.toContainText('No se han encontrado resultados');
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
    await page.waitForTimeout(2000);

    // 5. Verificar mensaje de éxito
    await expect(page.locator('.msg.success')).toContainText('Recurso creado');
  });

  test('iv. Buscar recursos utilizando los filtros', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);

    // Rellenamos el buscador
    await page.getByPlaceholder('🔎 País').fill('E2ETestland');
    await page.waitForTimeout(2000); 

    // CORRECCIÓN 2: Expresión regular /E2ETestland/i para evitar fallos por mayúsculas/minúsculas
    await expect(page.locator('tbody')).toContainText(/E2ETestland/i);
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
    await page.waitForTimeout(2000);

    // Verificamos mensaje y la tabla (con /i por si acaso)
    await expect(page.locator('.msg.success')).toContainText('Actualizado');
    await expect(page.locator('tbody')).toContainText(/Cultivo Editado/i);
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
    await page.waitForTimeout(2000);

    // Verificamos mensaje
    await expect(page.locator('.msg.success')).toContainText('Eliminado');
  });

  test('vii. Borrar todos los recursos', async ({ page }) => {
    await page.goto(`${app}/global-agriculture-climate-impacts`);
    await page.waitForTimeout(1000);
    await page.locator('.select-version').selectOption('v2');

    // Preparamos confirm
    page.once('dialog', dialog => dialog.accept());
    
    // Clic en borrar todo
    await page.getByRole('button', { name: /Borrar Todo/i }).click();
    await page.waitForTimeout(2000);

    // Verificamos el mensaje y que la tabla diga que está vacía
    await expect(page.locator('.msg.success')).toContainText('Base de datos vaciada');
    await expect(page.locator('tbody')).toContainText('No se han encontrado resultados');
  });

});