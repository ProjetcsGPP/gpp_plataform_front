// src/components/common/UnderDevelopment.tsx
// Componente para rotas que existem no manifest de navegacao mas
// ainda nao foram implementadas.
//
// USO em qualquer page.tsx:
//   export default function MinhaPage() {
//     return <UnderDevelopment featureName="Relatorios" />
//   }
//
// Isso mantem o layout (Sidebar + TopBar) montado normalmente.
// NAO usar redirect() nem notFound() — esses desmontam o AppThemeProvider.

import type { ReactNode } from 'react'

interface UnderDevelopmentProps {
  /** Nome da funcionalidade exibido no titulo */
  featureName?: string
  /** Previsao textual ex: "prevista para maio/2026" */
  forecast?: string
  /** Conteudo adicional abaixo do aviso */
  children?: ReactNode
}

export function UnderDevelopment({
  featureName,
  forecast,
  children,
}: UnderDevelopmentProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center px-4">
      <span
        className="material-symbols-outlined text-6xl text-amber-300"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
      >
        construction
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-700">
          {featureName
            ? `${featureName} em desenvolvimento`
            : 'Funcionalidade em desenvolvimento'}
        </h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Esta página ainda está sendo construída e será disponibilizada em breve.
          {forecast && (
            <> Previsão de entrega: <span className="font-medium">{forecast}</span>.</>          )}
        </p>
      </div>
      {children}
    </div>
  )
}
