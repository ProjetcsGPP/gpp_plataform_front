// src/app/portal/not-found.tsx
// Captura 404s dentro de /portal/* DENTRO da árvore de layouts.
// Sem este arquivo, o Next.js serve o not-found global (app/not-found.tsx)
// que fica FORA do portal/layout.tsx — desmontando o AppThemeProvider
// e destruindo o authStore/permissionsStore.
// Com este arquivo, o AppThemeProvider permanece montado e o botão
// voltar do browser funciona normalmente sem resets de estado.
import Link from 'next/link'

export default function PortalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center px-4">
      <span
        className="material-symbols-outlined text-6xl text-slate-300"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
      >
        search_off
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-700">
          Página não encontrada
        </h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Esta rota não existe ou ainda não foi implementada nesta versão do sistema.
        </p>
      </div>
      <Link
        href="/portal/dashboard"
        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
      >
        <span
          className="material-symbols-outlined text-base leading-none"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          arrow_back
        </span>
        Voltar ao Dashboard
      </Link>
    </div>
  )
}
