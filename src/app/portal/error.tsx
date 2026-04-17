'use client'
// src/app/portal/error.tsx
// Captura erros de runtime dentro de /portal/* DENTRO da árvore de layouts.
// Sem este arquivo, um erro de render em qualquer página do portal
// propagaria até o error boundary global do Next.js, fora do portal/layout.tsx,
// desmontando o AppThemeProvider e destruindo o estado da store.
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PortalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para diagnóstico — substituir por serviço de monitoramento em produção
    console.error('[PortalError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center px-4">
      <span
        className="material-symbols-outlined text-6xl text-slate-300"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
      >
        error
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-700">
          Algo deu errado
        </h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Ocorreu um erro inesperado nesta página. Tente novamente ou volte ao dashboard.
        </p>
        {error?.digest && (
          <p className="text-xs text-slate-400 font-mono mt-1">
            Código: {error.digest}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
        >
          <span
            className="material-symbols-outlined text-base leading-none"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            refresh
          </span>
          Tentar novamente
        </button>
        <a
          href="/portal/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
        >
          <span
            className="material-symbols-outlined text-base leading-none"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            arrow_back
          </span>
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  )
}
