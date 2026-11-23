import { expect, test } from '@playwright/test'
import {
  createResetToken,
  expectNoHorizontalOverflow,
  loginViaUi,
  registerViaUi,
  seed,
  uniqueEmail,
} from './fixtures'

// TASK-021: UC-001–UC-004 (cadastro, login, recuperação, perfil).
test.describe('identity flows', () => {
  test('registers, signs in, shows the profile and signs out', async ({
    page,
  }) => {
    const email = uniqueEmail('cadastro')
    await registerViaUi(page, email)
    await expect(page.getByRole('status')).not.toContainText(/erro|não foi/i)

    await loginViaUi(page, email)
    await expect(page.getByText(email)).toBeVisible()
    await expect(
      page.getByText('CUSTOMER', { exact: true }).first(),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)

    const logout = await page.request.post('/api/auth/logout')
    expect(logout.ok()).toBe(true)
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('rejects wrong credentials without revealing which field failed', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(seed.generalAdmin.email)
    await page.getByLabel('Senha').fill('Errada#2026x')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('status')).toContainText(/incorrect|incorret/i)
    await expect(page).toHaveURL(/\/login/)
  })

  test('validates the password policy on registration', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('E-mail').fill(uniqueEmail('fraca'))
    await page.getByLabel('Senha').fill('senhafraca')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('status')).toContainText(/maiúscula/i)
  })

  test('recovers access with a reset token', async ({ page }) => {
    const email = uniqueEmail('recupera')
    await registerViaUi(page, email)

    await page.goto('/forgot-password')
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: 'Enviar instruções' }).click()
    // Same generic answer for known and unknown accounts.
    await expect(page.getByRole('status')).toContainText(
      /recovery instructions|instruções/i,
    )

    const token = await createResetToken(email)
    const newPassword = 'Nova#Senha2026'
    await page.goto('/reset-password')
    await page.getByLabel('Token de recuperação').fill(token)
    await page.getByLabel('Senha').fill(newPassword)
    await page.getByRole('button', { name: 'Salvar nova senha' }).click()
    await expect(page.getByRole('status')).not.toBeEmpty()
    await expect(page.getByRole('status')).not.toContainText(
      /inválid|invalid|erro/i,
    )

    await loginViaUi(page, email, newPassword)
    await expect(page.getByText(email)).toBeVisible()
  })
})
