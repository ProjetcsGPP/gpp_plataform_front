// src/components/common/__tests__/AppThemeProvider.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { AppThemeProvider } from '../AppThemeProvider'

afterEach(() => {
  cleanup()
  document.body.removeAttribute('data-app')
})

describe('AppThemeProvider', () => {
  it('deve aplicar data-app="PORTAL" no body', () => {
    render(
      <AppThemeProvider appContext="PORTAL">
        <div>conteúdo</div>
      </AppThemeProvider>
    )
    expect(document.body.getAttribute('data-app')).toBe('PORTAL')
  })

  it('deve aplicar data-app="ACOES_PNGI" no body', () => {
    render(
      <AppThemeProvider appContext="ACOES_PNGI">
        <div>conteúdo</div>
      </AppThemeProvider>
    )
    expect(document.body.getAttribute('data-app')).toBe('ACOES_PNGI')
  })

  it('deve remover data-app do body ao desmontar', () => {
    const { unmount } = render(
      <AppThemeProvider appContext="PORTAL">
        <div>conteúdo</div>
      </AppThemeProvider>
    )
    unmount()
    expect(document.body.getAttribute('data-app')).toBeNull()
  })
})
