'use client'

import { useNavigationStore } from '@/store/navigationStore'

/**
 * Botão de reload do manifest de navegação.
 * APENAS em development — removido automaticamente em produção pelo tree-shaking.
 */
export function NavReloadButton() {
  // Guard de produção: garantia dupla além do tree-shaking
  if (process.env.NODE_ENV !== 'development') return null

  const bumpManifestVersion = useNavigationStore((s) => s.bumpManifestVersion)
  const isLoading = useNavigationStore((s) => s.isLoading)
  const manifestVersion = useNavigationStore((s) => s.manifestVersion)

  return (
    <button
      onClick={bumpManifestVersion}
      disabled={isLoading}
      title={`Recarregar manifest de navegação (v${manifestVersion})`}
      aria-label="Recarregar menu de navegação"
      className={[
        'flex items-center gap-1.5 w-full px-3 py-1.5 rounded-md',
        'text-xs font-medium',
        'border border-dashed',
        'text-orange-400 border-orange-400/40 bg-orange-400/5',
        'hover:bg-orange-400/15 hover:border-orange-400/70',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'transition-all duration-150',
      ].join(' ')}
    >
      <span
        className={[
          'material-symbols-outlined text-[16px] leading-none',
          isLoading ? 'animate-spin' : '',
        ].join(' ')}
        aria-hidden="true"
      >
        {isLoading ? 'progress_activity' : 'refresh'}
      </span>
      <span>{isLoading ? 'Recarregando...' : 'Recarregar nav.json'}</span>
      <span className="ml-auto opacity-50 font-mono">v{manifestVersion}</span>
    </button>
  )
}
